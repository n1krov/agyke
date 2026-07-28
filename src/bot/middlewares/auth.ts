import { NextFunction } from 'grammy';
import { AgykeContext } from '../../types/context';
import { supabase } from '../../lib/supabase';
import { User } from '../../types/database';

export async function authMiddleware(ctx: AgykeContext, next: NextFunction): Promise<void> {
  try {
    if (!ctx.from) {
      await next();
      return;
    }

    const telegramId = ctx.from.id;
    const currentName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Usuario';

    // Buscar si el usuario ya existe en Supabase
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (error) {
      console.error('[AuthMiddleware] Error buscando usuario en Supabase:', error);
      await ctx.reply('⚠️ Ocurrió un error al consultar tu usuario en la base de datos.');
      return;
    }

    if (existingUser) {
      // Si cambió el nombre en Telegram, actualizarlo en la base de datos
      if (existingUser.name !== currentName) {
        await supabase
          .from('users')
          .update({ name: currentName })
          .eq('id', existingUser.id);
        existingUser.name = currentName;
      }
      ctx.dbUser = existingUser as User;
    } else {
      // Registrar automáticamente al usuario si no existe
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          name: currentName
        })
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('[AuthMiddleware] Error registrando usuario en Supabase:', insertError);
        await ctx.reply('⚠️ Error al registrar tu usuario en la base de datos.');
        return;
      }

      ctx.dbUser = newUser as User;
      await ctx.reply(`👋 ¡Hola ${currentName}! Te hemos registrado exitosamente en Agyke.`);
    }

    await next();
  } catch (err) {
    console.error('[AuthMiddleware] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar la autenticación.');
  }
}

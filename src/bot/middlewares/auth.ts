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
      ctx.dbUser = existingUser as User;
    } else {
      // Registrar automáticamente al usuario si no existe
      const name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Usuario';

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          name: name
        })
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('[AuthMiddleware] Error registrando usuario en Supabase:', insertError);
        await ctx.reply('⚠️ Error al registrar tu usuario en la base de datos.');
        return;
      }

      ctx.dbUser = newUser as User;
      await ctx.reply(`👋 ¡Hola ${name}! Te hemos registrado exitosamente en Agyke.`);
    }

    await next();
  } catch (err) {
    console.error('[AuthMiddleware] Excepción inesperada:', err);
    await ctx.reply('⚠️ Ocurrió un error inesperado al procesar la autenticación.');
  }
}

import { bot } from '../src/bot/index';
import { setupBotInterceptor, createTextMessageUpdate, createCallbackQueryUpdate } from '../src/tests/telegram-mock';
import { setupInMemorySupabase } from '../src/tests/supabase-mock';
import { clearSession } from '../src/services/session';

async function runSimulation() {
  console.log('\n============================================================');
  console.log('   🚀 SIMULADOR DE FLUJO LOCAL HEADLESS - AGYKE SYSTEM');
  console.log('   (Pruebas de punta a punta sin bot en vivo de Telegram)');
  console.log('============================================================\n');

  const memorySupabase = setupInMemorySupabase();
  const interceptor = setupBotInterceptor(bot);

  const USER_A = { id: 1001, name: 'Lautaro' };
  const USER_B = { id: 1002, name: 'Cholo' };

  clearSession(USER_A.id);
  clearSession(USER_B.id);

  try {
    // -------------------------------------------------------------
    // Paso 1: Autenticación y registro de usuarios
    // -------------------------------------------------------------
    console.log('🔹 [Paso 1] Registro y autenticación inicial...');
    
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      text: '/start'
    }));
    console.log(`   ✅ ${USER_A.name} envió /start`);
    console.log(`   📨 Respuesta: "${interceptor.getLastMessage()?.split('\n')[0]}"`);

    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_B.id,
      name: USER_B.name,
      text: '/start'
    }));
    console.log(`   ✅ ${USER_B.name} envió /start`);
    console.log(`   📨 Respuesta: "${interceptor.getLastMessage()?.split('\n')[0]}"`);
    console.log(`   👥 Total usuarios registrados: ${memorySupabase.db.users.length}\n`);

    // -------------------------------------------------------------
    // Paso 2: Carga directa compartida 50/50 por Usuario A
    // -------------------------------------------------------------
    console.log('🔹 [Paso 2] Carga directa: Lautaro paga $20.000 en el súper (50/50)...');
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      text: '/gasto 20000 Coto 50'
    }));
    console.log(`   ✅ Mensaje procesado: "/gasto 20000 Coto 50"`);
    console.log(`   📨 Bot: "${interceptor.getLastMessage()}"`);
    console.log(`   📊 Saldo neto en BD: $${memorySupabase.db.balances[0]?.net_balance} (${USER_B.name} le debe a ${USER_A.name})\n`);

    // -------------------------------------------------------------
    // Paso 3: Compensación: Usuario B paga $6.000 (50/50)
    // -------------------------------------------------------------
    console.log('🔹 [Paso 3] Compensación: Cholo paga $6.000 en la verdulería (50/50)...');
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_B.id,
      name: USER_B.name,
      text: '/gasto 6000 Verdulería 50'
    }));
    console.log(`   ✅ Mensaje procesado: "/gasto 6000 Verdulería 50"`);
    console.log(`   📨 Bot: "${interceptor.getLastMessage()}"`);
    console.log(`   📊 Nuevo saldo neto: $${memorySupabase.db.balances[0]?.net_balance} (Deuda reducida a $7.000)\n`);

    // -------------------------------------------------------------
    // Paso 4: Pago 100% a favor (Saldar deuda completa)
    // -------------------------------------------------------------
    console.log('🔹 [Paso 4] Saldo de cuentas: Cholo transfiere $7.000 a Lautaro (Favor 100%)...');
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_B.id,
      name: USER_B.name,
      text: '/gasto 7000 Transferencia 100'
    }));
    console.log(`   ✅ Mensaje procesado: "/gasto 7000 Transferencia 100"`);
    console.log(`   📨 Bot: "${interceptor.getLastMessage()}"`);
    console.log(`   ⚖️ Balance neto tras pago: $${memorySupabase.db.balances[0]?.net_balance} (¡Cuentas saldadas en $0!)\n`);

    // -------------------------------------------------------------
    // Paso 5: Flujo conversacional paso a paso con botones interactivos
    // -------------------------------------------------------------
    console.log('🔹 [Paso 5] Flujo conversacional interactivo (Wizard + Inline Keyboard)...');
    
    // Iniciar sin parámetros
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      text: '/gasto'
    }));
    console.log(`   1️⃣ Lautaro escribe "/gasto"`);
    console.log(`      Bot solicita: "${interceptor.getLastMessage()?.replace(/\*/g, '')}"`);

    // Enviar monto
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      text: '3500'
    }));
    console.log(`   2️⃣ Lautaro responde monto: "3500"`);
    console.log(`      Bot solicita: "${interceptor.getLastMessage()?.replace(/\*/g, '')}"`);

    // Enviar concepto
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      text: 'Peluquería'
    }));
    console.log(`   3️⃣ Lautaro responde concepto: "Peluquería"`);
    console.log(`      Bot presenta botones: "${interceptor.getLastMessage()?.replace(/\*/g, '')}"`);

    // Presionar botón 50
    interceptor.clear();
    await bot.handleUpdate(createCallbackQueryUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      data: 'session:1001:50'
    }));
    console.log(`   4️⃣ Lautaro presiona botón [ 50 (Mitad y Mitad) ]`);
    console.log(`      Bot confirma: "${interceptor.getLastMessage()?.replace(/\*/g, '')?.split('\n')[0]}"`);
    console.log(`   📊 Nuevo balance consolidado: $${memorySupabase.db.balances[0]?.net_balance}\n`);

    // -------------------------------------------------------------
    // Paso 6: Consulta formal del comando /saldo
    // -------------------------------------------------------------
    console.log('🔹 [Paso 6] Consulta final de saldos con /saldo...');
    interceptor.clear();
    await bot.handleUpdate(createTextMessageUpdate({
      userId: USER_A.id,
      name: USER_A.name,
      text: '/saldo'
    }));
    console.log(`   📨 Respuesta de /saldo:\n------------------------------------------------`);
    console.log(interceptor.getLastMessage()?.replace(/\*/g, ''));
    console.log(`------------------------------------------------\n`);

    // -------------------------------------------------------------
    // Resumen General
    // -------------------------------------------------------------
    console.log('============================================================');
    console.log('   🎉 SIMULACIÓN EXITOSA - RESUMEN DE LA SESIÓN');
    console.log('============================================================');
    console.log(`   • Total usuarios en BD:     ${memorySupabase.db.users.length}`);
    console.log(`   • Total transacciones:      ${memorySupabase.db.transactions.length}`);
    console.log(`   • Saldo neto final:         $${memorySupabase.db.balances[0]?.net_balance}`);
    console.log(`   • Peticiones interceptadas: ${interceptor.captured.length} llamadas`);
    console.log('============================================================\n');

  } finally {
    memorySupabase.restore();
  }
}

runSimulation().catch((err) => {
  console.error('❌ Error en la simulación:', err);
  process.exit(1);
});

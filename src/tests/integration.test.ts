import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { bot } from '../bot/index';
import { setupBotInterceptor, createTextMessageUpdate, createCallbackQueryUpdate } from './telegram-mock';
import { setupInMemorySupabase } from './supabase-mock';
import { clearSession } from '../services/session';

describe('Pruebas de Integración y Simulación Headless (Tarea 7)', () => {
  const memorySupabase = setupInMemorySupabase();
  const interceptor = setupBotInterceptor(bot);

  beforeEach(() => {
    interceptor.clear();
    clearSession(1001);
    clearSession(1002);
  });

  after(() => {
    memorySupabase.restore();
  });

  it('Escenario 1: Comando /start registra automáticamente a un nuevo usuario', async () => {
    const update = createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '/start'
    });

    await bot.handleUpdate(update);

    // Verificar que el usuario se registró en base de datos
    assert.equal(memorySupabase.db.users.length, 1);
    assert.equal(memorySupabase.db.users[0].name, 'Lautaro');
    assert.equal(memorySupabase.db.users[0].telegram_id, 1001);

    // Verificar que el bot envió el mensaje de bienvenida
    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('¡Hola Lautaro! Bienvenido a *Agyke*'));
  });

  it('Escenario 2: Carga directa con /gasto 15000 Coto 50 del Usuario A', async () => {
    const update = createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '/gasto 15000 Coto 50'
    });

    await bot.handleUpdate(update);

    // Verificar transacción registrada
    assert.equal(memorySupabase.db.transactions.length, 1);
    const tx = memorySupabase.db.transactions[0];
    assert.equal(tx.amount, 15000);
    assert.equal(tx.concept, 'Coto');
    assert.equal(tx.classification, '50');
    assert.equal(tx.debt_impact, 7500);

    // Verificar confirmación del bot
    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Gasto registrado'));
    assert.ok(lastMsg && lastMsg.includes('15.000'));
  });

  it('Escenario 3: Compensación de deuda con Usuario B pagando /gasto 5000 Farmacia 50', async () => {
    // Usuario B se autentica y registra un gasto 50/50 de $5.000
    const updateB = createTextMessageUpdate({
      userId: 1002,
      name: 'Cholo',
      text: '/gasto 5000 Farmacia 50'
    });

    await bot.handleUpdate(updateB);

    assert.equal(memorySupabase.db.users.length, 2);
    assert.equal(memorySupabase.db.transactions.length, 2);

    // Verificar balance neto: A pagó 7500 de impacto, B pagó 2500 de impacto -> Balance neto = +5000 a favor de A
    assert.equal(memorySupabase.db.balances.length, 1);
    assert.equal(Number(memorySupabase.db.balances[0].net_balance), 5000);

    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Gasto registrado'));
    assert.ok(lastMsg && lastMsg.includes('5.000'));
  });

  it('Escenario 4: Comando /saldo reporta el estado de deudas consolidado', async () => {
    const update = createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '/saldo'
    });

    await bot.handleUpdate(update);

    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Estado de Saldos en Agyke'));
    assert.ok(lastMsg && lastMsg.includes('Cholo') && lastMsg.includes('Lautaro'));
    assert.ok(lastMsg && lastMsg.includes('5.000'));
  });

  it('Escenario 4.1: Mensaje de texto "ver saldo" en lenguaje natural responde directamente sin IA', async () => {
    const update = createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: 'ver saldo'
    });

    await bot.handleUpdate(update);

    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Estado de Saldos en Agyke'));
    assert.ok(lastMsg && lastMsg.includes('Cholo') && lastMsg.includes('Lautaro'));
    assert.ok(lastMsg && lastMsg.includes('5.000'));
  });

  it('Escenario 4.2: Callback Query action:saldo responde con el saldo correctamente', async () => {
    const callbackUpdate = createCallbackQueryUpdate({
      userId: 1001,
      name: 'Lautaro',
      data: 'action:saldo'
    });

    await bot.handleUpdate(callbackUpdate);

    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Estado de Saldos en Agyke'));
    assert.ok(lastMsg && lastMsg.includes('5.000'));
  });

  it('Escenario 5: Flujo conversacional paso a paso con Callback Query', async () => {
    // Paso 1: Usuario escribe /gasto sin argumentos
    await bot.handleUpdate(createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '/gasto'
    }));
    let lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('ingresa el *monto* del gasto'));

    // Paso 2: Usuario envía el monto '3500'
    await bot.handleUpdate(createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '3500'
    }));
    lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('ingresa el *concepto* del gasto'));

    // Paso 3: Usuario envía el concepto 'Peluquería'
    await bot.handleUpdate(createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: 'Peluquería'
    }));
    lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Confirmar Clasificación'));

    // Paso 4: Usuario presiona botón '50' mediante callback_query
    const callbackUpdate = createCallbackQueryUpdate({
      userId: 1001,
      name: 'Lautaro',
      data: 'session:1001:50'
    });
    await bot.handleUpdate(callbackUpdate);

    lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Clasificado como *50/50 (Mitad y Mitad)*'));
    assert.ok(lastMsg && lastMsg.includes('Peluquería'));

    // Verificar que se haya insertado en transacciones
    assert.equal(memorySupabase.db.transactions.length, 3);
    const lastTx = memorySupabase.db.transactions[2];
    assert.equal(lastTx.amount, 3500);
    assert.equal(lastTx.concept, 'Peluquería');
    assert.equal(lastTx.debt_impact, 1750);
  });

  it('Escenario 6: Comando /cancelar aborta una sesión activa', async () => {
    // Iniciar wizard
    await bot.handleUpdate(createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '/gasto'
    }));
    let lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('ingresa el *monto* del gasto'));

    // Cancelar
    await bot.handleUpdate(createTextMessageUpdate({
      userId: 1001,
      name: 'Lautaro',
      text: '/cancelar'
    }));
    lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Operación cancelada'));
  });

  it('Escenario 7: Botón [ ❌ Descartar Gasto ] descarta el ítem de agyke_queue sin registrar transacción (MULTI-18)', async () => {
    // 1. Crear un ítem PENDING en agyke_queue
    const queueId = 'queue-test-discard-1';
    memorySupabase.db.queue.push({
      id: queueId,
      user_id: 'user-a-uuid',
      amount: 12000,
      concept: 'Cena Amigos',
      source_type: 'audio',
      status: 'PENDING',
      created_at: new Date().toISOString()
    });

    const txCountBefore = memorySupabase.db.transactions.length;

    // 2. Simular clic en [ ❌ Descartar Gasto ]
    const callbackUpdate = createCallbackQueryUpdate({
      userId: 1001,
      name: 'Lautaro',
      data: `agyke:${queueId}:discard`
    });
    await bot.handleUpdate(callbackUpdate);

    // 3. Verificar que el mensaje editado indique descarte
    const lastMsg = interceptor.getLastMessage();
    assert.ok(lastMsg && lastMsg.includes('Gasto descartado'));

    // 4. Verificar que el status cambió a DISCARDED y no se generó ninguna transacción
    const queueItem = memorySupabase.db.queue.find(q => q.id === queueId);
    assert.equal(queueItem?.status, 'DISCARDED');
    assert.equal(memorySupabase.db.transactions.length, txCountBefore, 'No debe generarse ninguna transacción');
  });
});

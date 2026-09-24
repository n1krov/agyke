import { Update, User as TgUser } from 'grammy/types';
import { Bot } from 'grammy';
import { AgykeContext } from '../types/context';

export interface InterceptedCall {
  method: string;
  payload: Record<string, unknown>;
}

/**
 * Registra un interceptor en la API del bot de grammY para capturar
 * todas las respuestas salientes (sendMessage, editMessageText, etc.)
 * y evitar que se realicen llamadas de red a los servidores de Telegram.
 */
export function setupBotInterceptor(bot: Bot<AgykeContext>): {
  captured: InterceptedCall[];
  clear: () => void;
  getLastMessage: () => string | undefined;
} {
  const captured: InterceptedCall[] = [];
  let messageIdCounter = 1000;

  // Asignar información sintética del bot para el runner offline
  bot.botInfo = {
    id: 99999999,
    is_bot: true,
    first_name: 'AgykeTestBot',
    username: 'AgykeTestBot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
    can_connect_to_business: false,
    has_main_web_app: false
  } as unknown as import('grammy/types').UserFromGetMe;

  bot.api.config.use(async (_prev, method, payload) => {
    captured.push({ method, payload: payload as Record<string, unknown> });

    if (method === 'sendMessage') {
      const msgPayload = payload as { chat_id: number; text: string; reply_markup?: unknown };
      return {
        ok: true,
        result: {
          message_id: ++messageIdCounter,
          chat: { id: msgPayload.chat_id, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: msgPayload.text,
          reply_markup: msgPayload.reply_markup
        }
      } as unknown as ReturnType<typeof _prev>;
    }

    if (method === 'editMessageText') {
      const editPayload = payload as { message_id?: number; chat_id: number; text: string };
      return {
        ok: true,
        result: {
          message_id: editPayload.message_id || ++messageIdCounter,
          chat: { id: editPayload.chat_id, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: editPayload.text
        }
      } as unknown as ReturnType<typeof _prev>;
    }

    if (method === 'deleteMessage' || method === 'answerCallbackQuery') {
      return { ok: true, result: true } as unknown as ReturnType<typeof _prev>;
    }

    return { ok: true, result: {} } as unknown as ReturnType<typeof _prev>;
  });

  return {
    captured,
    clear: () => {
      captured.length = 0;
    },
    getLastMessage: () => {
      for (let i = captured.length - 1; i >= 0; i--) {
        const item = captured[i];
        if (item.method === 'sendMessage' || item.method === 'editMessageText') {
          return item.payload.text as string;
        }
      }
      return undefined;
    }
  };
}

let updateIdCounter = 1;

/**
 * Crea un Update sintético de mensaje de texto.
 */
export function createTextMessageUpdate(options: {
  userId: number;
  text: string;
  name?: string;
  username?: string;
  chatId?: number;
}): Update {
  const { userId, text, name = 'Usuario Test', username = 'testuser', chatId = userId } = options;
  const user: TgUser = {
    id: userId,
    is_bot: false,
    first_name: name,
    username
  };

  const entities = text.startsWith('/')
    ? [{ offset: 0, length: text.split(' ')[0].length, type: 'bot_command' as const }]
    : undefined;

  return {
    update_id: updateIdCounter++,
    message: {
      message_id: updateIdCounter * 10,
      from: user,
      chat: {
        id: chatId,
        type: 'private',
        first_name: name
      },
      date: Math.floor(Date.now() / 1000),
      text,
      entities
    }
  };
}

/**
 * Crea un Update sintético de pulsación de botón (callback_query).
 */
export function createCallbackQueryUpdate(options: {
  userId: number;
  data: string;
  messageId?: number;
  originalText?: string;
  name?: string;
  chatId?: number;
}): Update {
  const {
    userId,
    data,
    messageId = 1001,
    originalText = 'Mensaje con botones',
    name = 'Usuario Test',
    chatId = userId
  } = options;

  const user: TgUser = {
    id: userId,
    is_bot: false,
    first_name: name
  };

  return {
    update_id: updateIdCounter++,
    callback_query: {
      id: `cb_${Date.now()}_${Math.random()}`,
      from: user,
      message: {
        message_id: messageId,
        from: { id: 99999999, is_bot: true, first_name: 'AgykeBot' },
        chat: { id: chatId, type: 'private', first_name: name },
        date: Math.floor(Date.now() / 1000),
        text: originalText
      },
      chat_instance: `ci_${Date.now()}`,
      data
    }
  };
}

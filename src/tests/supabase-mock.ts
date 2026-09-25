import { supabase } from '../lib/supabase';
import { User, Transaction, AgykeItem } from '../types/database';

export interface InMemoryDb {
  users: User[];
  transactions: Transaction[];
  balances: Array<{ id: string; user_a_id: string; user_b_id: string; net_balance: number; updated_at: string }>;
  queue: AgykeItem[];
}

/**
 * Crea un estado de base de datos en memoria para pruebas de integración
 * y mockea los métodos de Supabase para operar sobre él sin tocar la red.
 */
export function setupInMemorySupabase(): {
  db: InMemoryDb;
  reset: () => void;
  restore: () => void;
} {
  const db: InMemoryDb = {
    users: [],
    transactions: [],
    balances: [],
    queue: []
  };

  const originalFrom = supabase.from.bind(supabase);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any).from = (table: string) => {
    return {
      select: (_cols?: string) => {
        let filters: Array<(item: any) => boolean> = [];
        let sortFn: ((a: any, b: any) => number) | null = null;

        const queryBuilder = {
          eq: (field: string, val: unknown) => {
            filters.push((item: any) => item[field] === val);
            return queryBuilder;
          },
          order: (field: string, opts?: { ascending?: boolean }) => {
            const asc = opts?.ascending !== false;
            sortFn = (a: any, b: any) => {
              if (a[field] < b[field]) return asc ? -1 : 1;
              if (a[field] > b[field]) return asc ? 1 : -1;
              return 0;
            };
            return queryBuilder;
          },
          maybeSingle: async () => {
            const collection = (db as any)[table === 'agyke_queue' ? 'queue' : table] || [];
            let result = collection.filter((item: any) => filters.every(f => f(item)));
            if (sortFn) result = result.sort(sortFn);
            return { data: result[0] || null, error: null };
          },
          single: async () => {
            const collection = (db as any)[table === 'agyke_queue' ? 'queue' : table] || [];
            let result = collection.filter((item: any) => filters.every(f => f(item)));
            if (sortFn) result = result.sort(sortFn);
            if (result.length === 0) return { data: null, error: new Error('Row not found') };
            return { data: result[0], error: null };
          },
          then: (resolve: any, reject: any) => {
            const collection = (db as any)[table === 'agyke_queue' ? 'queue' : table] || [];
            let result = collection.filter((item: any) => filters.every(f => f(item)));
            if (sortFn) result = result.sort(sortFn);
            return Promise.resolve({ data: result, error: null }).then(resolve, reject);
          }
        };

        return queryBuilder;
      },

      insert: (record: any) => {
        const targetTable = table === 'agyke_queue' ? 'queue' : table;
        const newRecord = {
          id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          created_at: new Date().toISOString(),
          ...record
        };
        (db as any)[targetTable].push(newRecord);

        return {
          select: () => ({
            single: async () => ({ data: newRecord, error: null }),
            maybeSingle: async () => ({ data: newRecord, error: null })
          }),
          then: (resolve: any, reject: any) => {
            return Promise.resolve({ data: [newRecord], error: null }).then(resolve, reject);
          }
        };
      },

      update: (updates: any) => {
        const targetTable = table === 'agyke_queue' ? 'queue' : table;
        return {
          eq: (field: string, val: unknown) => {
            const collection = (db as any)[targetTable];
            for (const item of collection) {
              if (item[field] === val) {
                Object.assign(item, updates);
              }
            }
            return {
              then: (resolve: any, reject: any) => {
                return Promise.resolve({ error: null }).then(resolve, reject);
              }
            };
          }
        };
      }
    };
  };

  return {
    db,
    reset: () => {
      db.users.length = 0;
      db.transactions.length = 0;
      db.balances.length = 0;
      db.queue.length = 0;
    },
    restore: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from = originalFrom;
    }
  };
}

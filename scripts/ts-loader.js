import { pathToFileURL } from 'node:url';

const MOCKS = {
  '@supabase/supabase-js': `
    export function createClient() {
      return {
        from: () => ({
          select: () => ({ order: () => Promise.resolve({ data: [], error: null }), maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
          insert: () => Promise.resolve({ error: null }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) })
        })
      };
    }
  `,
  '@google/generative-ai': `
    export class GoogleGenerativeAI {
      constructor() {}
      getGenerativeModel() {
        return {
          generateContent: () => Promise.resolve({ response: { text: () => '{"amount":0,"concept":"Gasto general"}' } })
        };
      }
    }
  `,
  'grammy': `
    export class Bot {
      constructor() {}
      use() {}
      command() {}
      on() {}
      catch() {}
      start() {}
    }
    export function webhookCallback() { return () => new Response("OK"); }
  `,
  'dotenv': `
    export default { config: () => ({}) };
    export function config() { return {}; }
  `
};

export async function resolve(specifier, context, nextResolve) {
  if (MOCKS[specifier]) {
    return {
      format: 'module',
      shortCircuit: true,
      url: `mock:${specifier}`
    };
  }

  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      for (const ext of ['.ts', '.js', '/index.ts', '/index.js']) {
        try {
          return await nextResolve(specifier + ext, context);
        } catch {}
      }
      throw err;
    }
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (MOCKS[specifier]) {
      return {
        format: 'module',
        shortCircuit: true,
        url: `mock:${specifier}`
      };
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('mock:')) {
    const pkg = url.replace('mock:', '');
    return {
      format: 'module',
      shortCircuit: true,
      source: MOCKS[pkg] || 'export default {};'
    };
  }
  return nextLoad(url, context);
}

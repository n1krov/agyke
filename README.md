
  #### 1. Setup del Proyecto y Tipado Estricto (TASKS.md)

  • Dependencias instaladas: grammy, @supabase/supabase-js, @google/generative-ai, dotenv, typescript, @types/node, tsx.
  • Tipos de la base de datos en database.ts.
  • Cliente inicializado en supabase.ts.
  • Script DDL de base de datos en schema.sql.

  #### 2. Bot Engine y Autenticación (TASKS.md)

  • Middleware de autenticación auth.ts que verifica y auto-registra a los usuarios en Supabase sin interrumpir la experiencia.
  • Entrada principal del Bot con grammY en index.ts.

  #### 3. Flujo Directo /gasto y Cálculo Financiero (TASKS.md)

  • Comando /gasto <monto> <concepto> <clasificacion> en gasto.ts.
  • Servicio financiero de recálculo del net_balance sin adivinaciones en balance.ts.

  #### 4. Pipeline Asistido con Gemini 1.5 Flash y Muro Agyke (TASKS.md)

  • Integración con Gemini 1.5 Flash en gemini.ts para audios, comprobantes PDF/fotos y texto libre.
  • Listener del Muro Agyke en assisted.ts enviando Inline Keyboard con los 4 botones (50, 100, -100, 0).
  • Listener de botones interactivos en callback.ts que pasa de agyke_queue a transactions, recalcula el balance y edita el
  mensaje en Telegram.

  #### 5. Dashboard Web en Next.js 15+ (App Router) (TASKS.md)

  • Aplicación de Next.js creada en la carpeta web.
  • Interfaz moderna en page.tsx con estética oscura, glassmorphism, tarjetas de net_balance, estadísticas globales, gráficos
  interactivos en Recharts y tabla de historial con filtros de búsqueda y clasificación.
  ──────
  ### 💻 Comandos para ejecutar el proyecto:

  • Iniciar el Bot de Telegram:
    npm run dev:bot

  • Iniciar el Dashboard Web de Next.js:
    npm run dev:web

  • Compilar producciones:
    npm run build && npm run build:web

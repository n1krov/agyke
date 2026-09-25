# GEMINI.md - Contexto y Reglas del Agente de IA (Agyke System)

## Rol y Filosofía
Actúas como un **Desarrollador Full-Stack Senior en TypeScript/Node.js**.
El proyecto se rige estrictamente bajo la metodología **Spec-Driven Development (SDD)**: ninguna implementación de código se realiza sin haber sido formalmente documentada, modelada y aprobada previamente en la carpeta [`docs/`](./docs).

---

## 1. Fuente de Verdad Innegociable (`docs/`)
La carpeta [`docs/`](./docs) es la **única fuente de información oficial y verdad técnica** del proyecto.
Antes de proponer cambios, escribir código o responder sobre el estado de la arquitectura, debes consultar obligatoriamente:
- [`docs/STATUS.md`](./docs/STATUS.md): **Bitácora viva del proyecto**. Contiene el estado actual, versión de ramas, decisiones recientes y qué tarea toca ejecutar. **Debe mantenerse actualizada tras cada cambio relevante**.
- [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) y [`docs/REQUIREMENTS_PROD.md`](./docs/REQUIREMENTS_PROD.md): Requerimientos de negocio, reglas de deuda e infraestructura.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) y [`docs/ARCHITECTURE_PROD.md`](./docs/ARCHITECTURE_PROD.md): Esquema de base de datos, flujos de datos y serverless webhooks.
- [`docs/TASKS.md`](./docs/TASKS.md) y [`docs/TASKS_PROD.md`](./docs/TASKS_PROD.md): Roadmap y checklist de tareas activas.
- [`docs/WORKFLOW_DEV_CI.md`](./docs/WORKFLOW_DEV_CI.md): Git Flow (`dev` / `master`) y pipeline de integración continua.

---

## 2. Metodología Spec-Driven Development (SDD)
El ciclo de desarrollo debe seguir este orden estricto:
1. **Especificar (Spec):** Definir o actualizar los requerimientos y arquitectura en [`docs/`](./docs).
2. **Planificar Tareas (Tasks):** Desglosar en tareas atómicas y medibles en [`docs/TASKS.md`](./docs/TASKS.md).
3. **Pruebas Primero (Test-Driven / Simulation):** Diseñar las pruebas automatizadas que validen el comportamiento esperado.
4. **Implementar:** Escribir el código estrictamente necesario para cumplir la especificación.
5. **Verificar:** Correr tests unitarios, typecheck estricto y linter (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`).
6. **Bitácora y Docs Pre-Commit (Obligatorio):** Actualizar obligatoriamente [`docs/STATUS.md`](./docs/STATUS.md) y toda la carpeta [`docs/`](./docs) ANTES de realizar cualquier commit. No se permite ningún commit sin su correspondiente registro en la bitácora.

---

## 3. Pruebas en Local sin Bot en Vivo (Local Test-First)
- En entorno local, **no se requiere ni se depende del bot de Telegram en vivo** para probar la lógica.
- La lógica de negocio, parsing con Gemini, flujos conversacionales y recálculo financiero se verifican mediante **tests automatizados y scripts de simulación de peticiones** (`Update` payloads de Telegram y llamadas a endpoints).
- El bot en vivo es exclusivamente el mecanismo de entrega (*delivery mechanism*) para producción o pruebas manuales esporádicas.

---

## 4. Reglas Estrictas de Código y Calidad
1. **Tipado Estricto:** TypeScript estricto en todo el proyecto. Prohibido el uso de `any`. Toda entidad (Telegram, Supabase, Gemini) debe tener interfaces explícitas.
2. **Manejo de Errores Resiliente:** Todo handler y endpoint debe usar `try/catch` con logs estructurados en consola.
3. **Cero Adivinación Financiera:** El cálculo de `net_balance` y el impacto de los 4 botones (`50`, `100`, `-100`, `0`) deben respetar exactamente la fórmula matemática de negocio.
4. **CI en Verde:** Ningún commit debe romper `npm test`, `npm run typecheck`, `npm run lint` ni `npm run build`.

---

## 5. Stack Tecnológico Aprobado
- **Runtime & Lenguaje:** Node.js (v20+ / v22), TypeScript estricto, ESM.
- **Bot Engine:** `grammY` framework (Webhook en Prod, Long Polling / Simulación en Dev).
- **AI Engine:** `@google/generative-ai` (Modelo `gemini-1.5-flash`).
- **Database:** Supabase PostgreSQL (`@supabase/supabase-js`).
- **Frontend:** Next.js 16+ (App Router), Tailwind CSS, Recharts, Lucide Icons.
- **Testing:** Runner nativo de Node.js (`node:test`, `node:assert`).

# Flujo de Trabajo en Dev, Testing y CI/CD (Agyke)

Este documento detalla el ciclo de vida de desarrollo, la estrategia de ramas, la suite de pruebas y el pipeline de Integración Continua (CI).

---

## 1. Estrategia de Ramas (Git Flow)

* **`master` (Producción)**:
  * Rama protegida y estable.
  * Conectada al despliegue automático de Vercel en producción (`agyke.vercel.app`).
  * Solo recibe cambios probados y validados desde `dev` mediante Pull Request aprobado.
* **`dev` (Desarrollo e Integración)**:
  * Rama de trabajo principal donde se integran y prueban nuevas funcionalidades y mejoras.
  * Todo desarrollo pasa por aquí antes de llegar a producción.
* **`feat/<nombre>` / `fix/<nombre>`**:
  * Ramas secundarias para tareas específicas creadas a partir de `dev`.
  * Se integran a `dev` mediante Pull Requests.

### 1.1 Guía de Sincronización Diaria (Git)
Para sincronizar y mantener el repositorio al día con GitHub sin pérdida de cambios:
1. **Comprobar estado local:** `git status` (si hay cambios temporales, resguardar con `git stash`).
2. **Descargar novedades de todas las ramas:** `git fetch --all --prune`.
3. **Actualizar la rama de trabajo actual (`dev`):** `git pull`.
4. **Sincronizar ambas ramas (`dev` y `master`) en un paso:**
   ```bash
   git checkout master && git pull && git checkout dev && git pull
   ```

---

## 2. Unificación de Arquitectura

Toda la lógica de negocio, clientes de servicios, tipos y handlers del bot residen en [`/src`](../src):
* `src/bot/`: Definición de comandos, handlers y middlewares del bot de Telegram.
* `src/bot/cli.ts`: Entrada para desarrollo local en modo Long Polling (`npm run dev:bot`).
* `src/services/`: Lógica financiera (`balance.ts`), integración con Gemini (`gemini.ts`), y sesiones en memoria (`session.ts`).
* `src/types/`: Definiciones estrictas de TypeScript (`database.ts`, `context.ts`).
* La aplicación Web (`web/`) consume directamente [`/src`](../src) mediante el path mapping `@/shared/*` configurado en `web/tsconfig.json`, evitando duplicación de código.

---

## 3. Pruebas Automatizadas

El proyecto cuenta con tests unitarios ejecutados de manera nativa y ultrarrápida:

```bash
# Ejecutar todas las pruebas unitarias
npm test
```

### Cobertura de Pruebas:
1. **Lógica Financiera (`src/services/balance.test.ts`)**:
   * Validación estricta de las 4 clasificaciones (`50`, `100`, `-100`, `0`).
   * Verificación de la invariante del saldo neto consolidado (`net_balance`).
2. **Parser de Texto Libre (`src/services/gemini.test.ts`)**:
   * Extracción de montos y conceptos con formatos argentinos/internacionales (puntos de miles, comas decimales, prefijos de moneda `$`).
3. **Manejo de Sesiones (`src/services/session.test.ts`)**:
   * Gestión de borradores de gastos interactivos por usuario.

---

## 4. Pipeline de CI (GitHub Actions)

El archivo [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) se dispara automáticamente en cada `push` o `pull_request` sobre `master` y `dev`.

### Fases del CI:
1. **Typecheck estricto**: Verifica que no existan errores de tipos ni tipos `any` indebidos en raíz y web.
2. **Linting**: Valida las reglas de código con ESLint en Next.js.
3. **Tests Unitarios**: Ejecuta la suite completa de pruebas.
4. **Build Check**: Ejecuta `npm run build` para garantizar que la compilación de Next.js sea exitosa antes del despliegue.

---

## 5. Comandos Rápidos de Desarrollo

| Comando | Acción |
| :--- | :--- |
| `npm run dev:bot` | Inicia el Bot en modo local (Long Polling) |
| `npm run dev:web` | Inicia el Dashboard de Next.js en `http://localhost:3000` |
| `npm test` | Ejecuta la suite de pruebas unitarias |
| `npm run typecheck` | Ejecuta el análisis de tipos de TypeScript |
| `npm run lint` | Ejecuta el linter de código |
| `npm run build` | Compila la aplicación Web de producción |

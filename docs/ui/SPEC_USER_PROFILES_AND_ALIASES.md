# SPEC_USER_PROFILES_AND_ALIASES.md - Especificación de Perfiles de Usuarios Vinculados, Estado de Actividad y Alias Web

> **Estado:** Aprobado / Listo para Implementación (Fase 13)  
> **Área:** Base de Datos (`supabase/schema.sql`), Backend (`web/src/app/api/users/`) & Frontend (`web/src/`)  
> **Rama de Desarrollo:** `feat/settings-tags-and-transaction-detail`  
> **Tecnologías:** Next.js 16 (App Router), Supabase PostgreSQL, TypeScript estricto, Tailwind CSS v4 (Dual Theme Editorial)  
> **Objetivo:**  
> 1. Permitir visualizar y auditar los usuarios vinculados a la plataforma Agyke, incluyendo su estado operativo y su **última actividad** calculada a partir del último gasto registrado.
> 2. Incorporar el soporte de **Alias / Apodo (`alias`)** por usuario para personalizar cómo se muestra su identidad en **toda la interfaz Web** (Dashboard, Analítica, Muro, Avatares y Tablas), manteniendo intacto el nombre original de Telegram (`name`) dentro del flujo del Bot.

---

## 1. Motivación y Reglas de Negocio

1. **Visibilidad de Usuarios Vinculados y Última Actividad:**
   * Los usuarios se auto-registran en Agyke al interactuar con el bot de Telegram. Sin embargo, hasta ahora la Web no ofrecía un panel donde consultar quiénes están vinculados, cuál es su ID de Telegram, cuántos gastos llevan registrados ni cuándo fue su última interacción contable.
   * **Cálculo de Última Actividad:** Se obtiene tomando la transacción más reciente (`transactions` ordenada por `created_at DESC`) perteneciente a cada `user_id`. Muestra la fecha/hora exacta, el tiempo relativo (ej. *"Hace 3 horas"*, *"Ayer"*, *"14 oct"*) y el resumen de ese último movimiento (`concept` y `amount`).
2. **Sistema de Alias / Apodo con Alcance Web Exclusivo:**
   * Los nombres provenientes de Telegram (`first_name`) suelen ser formales, incompletos o técnicos.
   * Cada usuario vinculado puede tener un campo opcional `alias` (ej. `"Lau"`, `"Gorda"`, `"Capi"`).
   * **Regla de Resolución Visual (`getUserDisplayName`):**
     * **En toda la Interfaz Web** (Dashboard `/`, Analítica `/analytics`, Muro `/muro`, `<MasterBalanceHero />`, `<TransactionsTable />`, `<UserAvatar />`): Si `user.alias` existe y no es vacío, se utiliza `user.alias`. En caso contrario, se hace fallback automático a `user.name`.
     * **En la Ficha de Configuración (`/settings`):** Se muestran explícitamente ambos valores: el **Alias activo** (editable) y el **Nombre original de Telegram** (`name` + `telegram_id`) como metadato técnico inmutable.
     * **En el Bot de Telegram (`src/bot/`):** No se altera el comportamiento actual; el bot continúa utilizando `user.name` nativo de Telegram.

---

## 2. Evolución del Esquema de Base de Datos (`supabase/schema.sql`)

Se extiende la tabla `users` añadiendo la columna `alias`:

```sql
-- Migración: Soporte de Alias de Usuario
ALTER TABLE users
ADD COLUMN IF NOT EXISTS alias TEXT DEFAULT NULL;
```

### Restricciones de Validación del Alias:
* Tipo: `TEXT NULL`.
* Longitud permitida al guardar: entre `1` y `24` caracteres (se aplica `.trim()`).
* Si el usuario envía una cadena vacía `""` o `null`, se limpia el alias en la base de datos (`alias = NULL`), restaurando el `name` original de Telegram como nombre visible en la Web.

---

## 3. Contratos TypeScript y Helper Canónico (`src/types/database.ts` y `web/src/types/database.ts`)

```typescript
export interface User {
  id: string;
  telegram_id: number;
  name: string;
  alias?: string | null;
  created_at: string;
}

export interface UserLastActivity {
  transaction_id: string;
  amount: number;
  concept: string | null;
  classification: ClassificationType;
  created_at: string;
}

export interface UserProfileSummary extends User {
  display_name: string;               // alias?.trim() || name
  transactions_count: number;         // Total de gastos históricos registrados por el usuario
  last_activity: UserLastActivity | null; // Último gasto registrado
}
```

### Helper Unificado de Visualización (`web/src/lib/user-display.ts`):
```typescript
import type { User } from '@/types/database';

export function getUserDisplayName(user?: Pick<User, 'name' | 'alias'> | null, fallback = 'Usuario'): string {
  if (!user) return fallback;
  const trimmedAlias = user.alias?.trim();
  return trimmedAlias && trimmedAlias.length > 0 ? trimmedAlias : user.name;
}
```

---

## 4. Especificación de Endpoints Backend (`/api/users`)

### A. `GET /api/users`
Obtiene la lista de usuarios vinculados enriquecida con su estado de actividad y estadísticas operativas.
* **Flujo de Datos:**
  1. Consulta `users` ordenados por `created_at ASC`.
  2. Consulta `transactions` para calcular el conteo total de transacciones por `user_id` y extraer la última transacción (`ORDER BY created_at DESC LIMIT 1` por usuario).
  3. Devuelve un arreglo `UserProfileSummary[]`.

### B. `PATCH /api/users/[id]`
Actualiza la configuración de perfil del usuario (específicamente su `alias`).
* **Body JSON:**
  ```json
  {
    "alias": "Lau"
  }
  ```
* **Validaciones:**
  * Verificar que `alias` sea `string` o `null`.
  * Si `alias.trim().length > 24`, retornar `400 Bad Request` con mensaje claro.
  * Actualizar en Supabase `users.update({ alias: trimmed || null }).eq('id', id)`.
  * Retornar `200 OK` con el objeto `User` actualizado.

---

## 5. Impacto en Componentes Existentes de la Web

Para que el `alias` surta efecto inmediato en toda la plataforma Web:
1. **`web/src/app/api/dashboard/route.ts`:**
   * Asegurar que los joins `users(id, name, alias, telegram_id)` y el listado de `users` incluyan el campo `alias`.
2. **`web/src/app/api/analytics/route.ts`:**
   * Resolver `userAName` y `userBName` usando `user.alias?.trim() || user.name`, de modo que todos los KPIs, el cuadro Cara a Cara, la Línea Temporal de Interacción y el Top 5 Gastos muestren automáticamente el apodo configurado.
3. **`<MasterBalanceHero />`, `<TransactionsTable />`, `<UserAvatar />` y `/muro`:**
   * Utilizar `getUserDisplayName(user)` para renderizar nombres e iniciales de avatar coherentes con el alias activo.

---

## 6. Criterios de Aceptación y Pruebas (Test-First)

1. **Test Unitario de Resolución de Alias:**
   * Si `user = { name: "Lautaro T", alias: "Lau" }` -> `getUserDisplayName(user)` retorna `"Lau"`.
   * Si `user = { name: "Lautaro T", alias: "   " }` o `null` -> `getUserDisplayName(user)` retorna `"Lautaro T"`.
2. **Test de Última Actividad:**
   * Verificar que para una lista de transacciones de distintos usuarios, el agregador de perfil asigne exactamente la transacción con mayor `created_at` a cada usuario, o `null` si el usuario aún no registró gastos.
3. **Invariante de Bot:**
   * Confirmar que ningún archivo dentro de `src/bot/` reemplace `user.name` por `alias`.

# SPEC_SETTINGS_HUB_AND_TAGS_CRUD.md - Especificación del Centro de Configuración (`/settings`) y Gestor ABM de Etiquetas

> **Estado:** Aprobado / Listo para Implementación (Fase 13)  
> **Área:** Backend (`web/src/app/api/tags/`) & Frontend (`web/src/app/settings/`, `HeaderBar.tsx`, `MobileBottomDock.tsx`)  
> **Rama de Desarrollo:** `feat/settings-tags-and-transaction-detail`  
> **Tecnologías:** Next.js 16 (App Router), Supabase PostgreSQL, TypeScript estricto, Tailwind CSS v4 (Dual Theme Editorial)  
> **Objetivo:**  
> 1. Crear una página dedicada de Configuración en **`/settings`** que unifique mediante pestañas (`Usuarios y Perfiles` y `Etiquetas`) la administración de identidades vinculadas y el catálogo de etiquetas de la plataforma.
> 2. Proveer un **ABM (CRUD) completo de Etiquetas (`Tags`)** que permita listar, crear, editar (nombre y color semántico) y eliminar etiquetas, exhibiendo cuántas transacciones utilizan cada etiqueta para habilitar futuras métricas analíticas por etiqueta.

---

## 1. Arquitectura de Navegación Unificada (`/settings`)

Para preservar la limpieza visual del estilo *Editorial Financial Craft* y evitar saturar la barra superior o el dock móvil con múltiples botones de administración:
1. **Ruta Unificada:** `/settings` (con soporte de query param opcional `?tab=users` o `?tab=tags` para enlaces profundos desde el Drawer de gastos).
2. **Integración en `<HeaderBar />` (Desktop):**
   * En el bloque central de navegación (`Inicio`, `Analítica`, `Muro`), se incorpora el cuarto ítem **`Ajustes`** (o icono `SlidersHorizontal` / `Settings2` + etiqueta `Ajustes`) apuntando a `/settings`.
3. **Integración en `<MobileBottomDock />` (Smartphones):**
   * Se añade el acceso táctil a `/settings` (`Ajustes`) dentro de la cápsula flotante inferior manteniendo el target mínimo de 44px y equilibrio simétrico.
4. **Protección en Middleware (`web/src/middleware.ts`):**
   * Asegurar que `/settings`, `/api/users/*`, `/api/tags/*` y `/api/transactions/*` estén protegidos por la cookie `agyke_session` HMAC-SHA256 al igual que `/` y `/api/dashboard`.

---

## 2. Estructura Visual de la Página `/settings`

La vista `/settings` sigue la grilla editorial `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8` con encabezado de página y selector de pestañas estilo segmented control:

### A. Pestaña 1: `Usuarios y Perfiles` (`tab = 'users'`)
Muestra las tarjetas de todos los usuarios vinculados en la tabla `users`:
1. **Encabezado de Ficha de Usuario:**
   * `<UserAvatar />` de tamaño grande (`lg`) + **Nombre visible actual** (`alias || name`).
   * Badge de estado operativo:
     * `🟢 Vinculado · Activo` (si posee actividad registrada).
     * `⚪ Vinculado · Sin movimientos` (si aún no registró gastos).
2. **Metadatos Técnicos de Vinculación:**
   * **Nombre original en Telegram:** `{user.name}`
   * **Telegram ID:** `#{user.telegram_id}` (con tipografía `font-mono tabular-nums`)
   * **Miembro desde:** Fecha formateada de `user.created_at`.
   * **Total de gastos registrados:** `{user.transactions_count} movimientos`.
3. **Bloque de Última Actividad (Obtenido del Último Gasto):**
   * Muestra una caja sutil con borde hairline detallando el último gasto registrado por ese usuario:
     * **Fecha y hora relativa/exacta:** ej. *"Hace 2 días (25 oct 2026, 14:20 hs)"*
     * **Concepto y Monto:** ej. *"Supermercado Coto — $ 34.500,00"* + `<BadgeClassification />`.
4. **Formulario Inline de Configuración de Alias:**
   * Input de texto editorial (`maxLength={24}`) con placeholder *"Ej. Lau, Gorda, Capi..."*.
   * Botón **`Guardar Alias`** y botón secundario **`Restaurar nombre original`** (si ya tiene un alias activo).
   * Nota explicativa al pie: *"El alias reemplaza tu nombre en toda la interfaz Web (Dashboard, Analítica y Muro). El bot de Telegram seguirá usando tu nombre nativo."*

---

### B. Pestaña 2: `Etiquetas` (`tab = 'tags'`)
Permite administrar el catálogo maestro de etiquetas que se usan para clasificar gastos y alimentar métricas futuras:

1. **Panel Superior de Creación / Edición de Etiqueta:**
   * **Input de Nombre:** Nombre de la etiqueta (ej. `Supermercado`, `Salidas`, `Servicios`, `Mascotas`, `Vacaciones`). Se normaliza sin espacios extremos (`1` a `28` caracteres, único sin distinción de mayúsculas/minúsculas).
   * **Selector de Color Semántico (`TagColorToken`):**
     Paleta curada de 7 tonos editoriales compatibles con modo Claro y Oscuro:
     * `indigo` (Azul Índigo)
     * `emerald` (Verde Esmeralda)
     * `amber` (Ámbar / Dorado)
     * `rose` (Rosa Carmesí)
     * `cyan` (Cian / Celeste)
     * `violet` (Violeta Sobrio)
     * `slate` (Gris Pizarra Neutro)
   * **Vista Previa en Vivo:** Muestra en tiempo real cómo se verá la píldora `<TagBadge />` antes de guardar.
   * **Botón Crear Etiqueta** (o **Guardar Cambios / Cancelar** cuando se está editando una etiqueta existente).

2. **Listado y Tabla de Etiquetas Existentes:**
   * Cada fila o tarjeta de etiqueta exhibe:
     * **Píldora Visual (`<TagBadge />`)** con el nombre y color configurado.
     * **Contador de Uso (`usage_count`):** Indica en cuántos gastos está aplicada actualmente (ej. `12 gastos asociados`).
     * **Fecha de creación**.
     * **Acciones:**
       * **Editar (`Pencil`):** Carga el nombre y color en el formulario o habilita edición inline para renombrar o cambiar el color de la etiqueta (actualizando automáticamente todos los gastos que la referencian gracias a la clave foránea `tag_id`).
       * **Eliminar (`Trash2`):** Solicita confirmación rápida antes de borrar. Si la etiqueta tenía gastos asociados, informa que se desvinculará de esos `{usage_count}` gastos (`ON DELETE CASCADE` en `transaction_tags`) sin borrar los gastos en sí.

---

## 3. Especificación de Endpoints Backend (`/api/tags`)

### A. `GET /api/tags`
Lista todas las etiquetas ordenadas alfabéticamente por `name ASC`, incluyendo el conteo de transacciones asociadas (`usage_count`).
* **Respuesta `200 OK`:**
  ```json
  {
    "tags": [
      {
        "id": "uuid-1",
        "name": "Supermercado",
        "color": "emerald",
        "created_at": "2026-10-27T12:00:00Z",
        "usage_count": 8
      }
    ]
  }
  ```

### B. `POST /api/tags`
Crea una nueva etiqueta en el catálogo.
* **Body JSON:**
  ```json
  {
    "name": "Supermercado",
    "color": "emerald"
  }
  ```
* **Validaciones:**
  * `name` obligatorio, entre `1` y `28` caracteres tras `.trim()`.
  * `color` debe pertenecer a la lista permitida `['slate', 'indigo', 'emerald', 'amber', 'rose', 'cyan', 'violet']`.
  * Si ya existe una etiqueta con el mismo nombre (`ILIKE`), retornar `409 Conflict` con mensaje descriptivo.

### C. `PATCH /api/tags/[id]`
Edita el nombre y/o color de una etiqueta existente.
* **Body JSON:**
  ```json
  {
    "name": "Súper y Almacén",
    "color": "cyan"
  }
  ```
* **Validaciones:** Mismas reglas de longitud, color permitido y unicidad de nombre.

### D. `DELETE /api/tags/[id]`
Elimina una etiqueta por su UUID.
* Gracias a `ON DELETE CASCADE` en `transaction_tags(tag_id)`, se limpian las asociaciones sin afectar la integridad contable de la tabla `transactions`.

---

## 4. Plan de Pruebas y Criterios de Calidad (CI en Verde)

1. **Tests Unitarios de Validación y Normalización (`src/tests/settings-and-tags.test.ts`):**
   * Validación de nombres de etiquetas (rechazo de vacíos o `>28` caracteres, detección de duplicados case-insensitive).
   * Validación de paleta de colores `TagColorToken`.
   * Resolución de `getUserDisplayName` con y sin alias, y cálculo de `last_activity` a partir de una colección de transacciones.
2. **Calidad Estática y Build:**
   * `npm test` en verde.
   * `npm run typecheck` (raíz y `web`) con `0` errores y cero uso de `any`.
   * `npm run lint` con `0` warnings de ESLint / React 19 hooks.
   * `npm run build` compilando todas las rutas nuevas (`/settings`, `/api/users`, `/api/tags`, `/api/transactions/[id]/tags`).

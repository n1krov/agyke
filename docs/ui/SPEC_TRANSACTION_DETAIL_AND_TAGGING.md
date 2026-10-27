# SPEC_TRANSACTION_DETAIL_AND_TAGGING.md - Especificación de Vista de Detalle Extra de Gasto y Etiquetado Múltiple en Vivo

> **Estado:** Aprobado / Listo para Implementación (Fase 13)  
> **Área:** Base de Datos (`supabase/schema.sql`), Backend (`web/src/app/api/transactions/`) & Frontend (`web/src/components/`)  
> **Rama de Desarrollo:** `feat/settings-tags-and-transaction-detail`  
> **Tecnologías:** Next.js 16 (App Router), Supabase PostgreSQL, TypeScript estricto, Tailwind CSS v4 (Dual Theme Editorial)  
> **Objetivo:**  
> 1. Permitir inspeccionar el **detalle completo y auditado de cualquier gasto** haciendo clic sobre su fila (Desktop) o tarjeta (Mobile) en `<TransactionsTable />`, desplegando un **Drawer / Modal Lateral Editorial** sin recargar la página.
> 2. Incorporar la capacidad de **asignar y quitar múltiples etiquetas (`tags`) a cada gasto en vivo** (relación N:M), enriqueciendo las transacciones para futura clasificación y analítica avanzada.

---

## 1. Motivación y Experiencia de Usuario (UX)

1. **Inspección Profunda sin Fricción (Drawer / Modal Lateral):**
   * En la tabla principal de movimientos, el espacio horizontal es acotado. Al seleccionar un gasto, el usuario necesita ver la ficha técnica completa del registro contable sin perder el contexto de su búsqueda o filtro actual.
   * Un **Drawer lateral deslizable** (en Desktop alineado a la derecha `max-w-md w-full h-full`, y en Mobile como Bottom Sheet / Modal de altura adaptable) ofrece una experiencia ágil inspirada en Linear y Ramp.
2. **Etiquetado Múltiple (`N:M`) en Tiempo Real:**
   * A diferencia de una categoría rígida única, un gasto real suele pertenecer a más de una dimensión semántica (ej. una compra en Coto puede etiquetarse con `#supermercado` y `#hogar`, o una cena con `#salidas` y `#vacaciones`).
   * Desde el Drawer de detalle del gasto, el usuario puede marcar o desmarcar etiquetas existentes con un solo clic, viendo el cambio reflejado instantáneamente tanto en el Drawer como en la fila/tarjeta de `<TransactionsTable />`.

---

## 2. Esquema Relacional de Etiquetas por Gasto (`supabase/schema.sql`)

Se modela una relación muchos-a-muchos (`N:M`) entre `transactions` y `tags` mediante la tabla puente `transaction_tags`:

```sql
-- Tabla Maestro de Etiquetas (definida en SPEC_SETTINGS_HUB_AND_TAGS_CRUD.md)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT 'slate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla Puente N:M entre Transacciones y Etiquetas
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_tx_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);
```

---

## 3. Contratos TypeScript (`src/types/database.ts` y `web/src/types/database.ts`)

```typescript
export type TagColorToken =
  | 'slate'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'violet';

export interface Tag {
  id: string;
  name: string;
  color: TagColorToken;
  created_at: string;
  usage_count?: number; // Cantidad de transacciones que usan esta etiqueta
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  concept: string | null;
  classification: ClassificationType;
  debt_impact: number;
  created_at: string;
  users?: User;
  tags?: Tag[]; // Etiquetas asociadas a este gasto
}
```

---

## 4. Anatomía Visual del Componente `<TransactionDetailDrawer />`

Al hacer clic en una fila o tarjeta de `<TransactionsTable />`, se abre `<TransactionDetailDrawer />` con las siguientes secciones editoriales:

### A. Encabezado Técnico
* **Píldora de ID de Registro:** Muestra el UUID corto (ej. `TX #a8f3...91c2`) con botón para copiar el UUID completo al portapapeles.
* **Botón Cerrar (`X`):** También se cierra presionando la tecla `Escape` o haciendo clic en el backdrop translúcido.

### B. Bloque Monumental de Monto y Concepto
* **Monto Total:** Tipografía `Geist Mono` (`tabular-nums`, `text-3xl font-bold`), formateado en ARS (`$ 45.200,00`).
* **Concepto Completo:** Texto íntegro sin truncamiento (`break-words`), permitiendo leer descripciones largas extraídas por Gemini desde comprobantes o notas de voz.

### C. Grilla de Metadatos Contables (2 Columnas con Bordes Hairline)
1. **Registrado por:**
   * `<UserAvatar />` + **Alias activo** (`getUserDisplayName(tx.users)`).
   * Si tiene alias configurado, muestra debajo en texto secundario el nombre original de Telegram (`@{tx.users.name}`).
2. **Fecha y Hora Exacta:**
   * Fecha completa (`23 de octubre de 2026, 19:42:15 hs`) + indicador relativo (`Hace 4 días`).
3. **Regla de Clasificación Aplicada:**
   * `<BadgeClassification type={tx.classification} />` acompañado de una micro-explicación en lenguaje natural:
     * `50`: *"Gasto compartido 50/50 — La otra parte asume la mitad del monto."*
     * `100`: *"Favor 100% — Pagado íntegramente a cuenta de la otra persona."*
     * `-100`: *"Deuda directa (-100%) — Monto adeudado en su totalidad a quien pagó."*
     * `0`: *"Gasto personal (0%) — Registrado para control estadístico sin impacto en deuda."*
4. **Impacto Matemático en Balance (`debt_impact`):**
   * Valor exacto en moneda (`+$ 22.600,00`, `-$ 45.200,00` o `$ 0,00`) con color semántico esmeralda/carmesí/neutro.

### D. Panel Interactivo de Etiquetas del Gasto (`Tags Assignment`)
* **Etiquetas Activas en este Gasto:**
  * Lista de chips coloreados (`<TagBadge />`) actualmente asignados al gasto, cada uno con un icono `×` para desvincularlo en un clic.
* **Selector Rápido de Etiquetas Disponibles:**
  * Lista/buscador de todas las etiquetas creadas en la plataforma. Al hacer clic en una etiqueta disponible, se vincula inmediatamente al gasto mediante petición `PUT /api/transactions/[id]/tags`.
* **Enlace Directo / Creación Rápida:**
  * Incluye un enlace sutil `Gestionar catálogo de etiquetas →` que lleva a `/settings?tab=tags`, además de la opción de crear una etiqueta nueva in-situ si el catálogo está vacío.

---

## 5. Previsualización y Filtrado en `<TransactionsTable />`

1. **Píldoras Compactas en Tabla y Card Feed:**
   * Debajo o al lado del concepto de cada gasto en `<TransactionsTable />`, si la transacción posee etiquetas (`tx.tags && tx.tags.length > 0`), se renderizan mini-badges editoriales (`#supermercado`, `#hogar`).
2. **Filtro por Etiqueta:**
   * Además del buscador por texto y los chips de clasificación (`Todos | 50 | 100 | -100 | 0`), si existen etiquetas creadas se habilita un selector/barra de filtro por etiqueta para aislar al instante todos los gastos de una etiqueta específica y ver su suma rápida.
3. **Indicador de Interacción:**
   * Las filas de la tabla y las tarjetas móviles tendrán cursor interactivo (`cursor-pointer`) y un sutil realce en hover para indicar que al hacer clic se abre el detalle completo del gasto.

---

## 6. Especificación de Endpoints Backend

### A. Enriquecimiento de `GET /api/dashboard`
* Al consultar `transactions`, incluir las etiquetas vinculadas a través de `transaction_tags(tag_id, tags(id, name, color, created_at))` y mapearlas limpiamente en un arreglo `tags: Tag[]` dentro de cada objeto `Transaction`, además de devolver el catálogo completo `tags: Tag[]` en el payload del dashboard para alimentar el selector.

### B. `PUT /api/transactions/[id]/tags`
Reemplaza o sincroniza el conjunto de etiquetas asociadas a una transacción específica.
* **Body JSON:**
  ```json
  {
    "tagIds": ["uuid-tag-1", "uuid-tag-2"]
  }
  ```
* **Comportamiento Atómico:**
  1. Valida que `id` sea una transacción existente y que `tagIds` sea un arreglo de UUIDs válidos (sin duplicados).
  2. Elimina las filas previas de `transaction_tags` para `transaction_id = id`.
  3. Si `tagIds.length > 0`, inserta los pares `(transaction_id, tag_id)` en `transaction_tags`.
  4. Retorna `200 OK` con la lista actualizada de objetos `Tag[]` asociados a la transacción.

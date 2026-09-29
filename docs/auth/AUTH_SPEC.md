# AUTH_SPEC.md - Especificación Técnica de Control de Acceso por PIN / Contraseña

## 1. Contexto y Requerimientos de Privacidad
Actualmente, el dashboard web de Agyke (`https://agyke.vercel.app`) es accesible públicamente sin ningún filtro de autenticación. Cualquier persona que conozca o adivine la URL puede consultar el balance consolidado, nombres de los usuarios, comprobantes del Muro Agyke y el historial detallado de gastos.

El objetivo de esta especificación es **cerrar el acceso público al dashboard y a su API interna**, permitiendo el ingreso únicamente a los usuarios que posean el **PIN / Contraseña de Acceso** compartido, con persistencia segura mediante cookies firmadas.

---

## 2. Principios de Diseño
1. **Ligereza Absoluta:** Sin depender de proveedores de autenticación pesados ni requerir que los usuarios abran emails de confirmación en cada dispositivo.
2. **Seguridad Robusta:** Verificación en middleware de servidor con cookies `httpOnly`, `Secure` y `SameSite=Lax`. Las cookies estarán firmadas criptográficamente para evitar su alteración.
3. **Cero Afectación a Telegram:** El endpoint `/api/telegram/webhook` debe quedar formalmente excluido de la verificación de sesión web, ya que opera bajo su propio esquema de seguridad (`x-telegram-bot-api-secret-token`).
4. **Continuidad Visual:** La pantalla de desbloqueo debe adherir estrictamente a los tokens del sistema de diseño *Obsidian Slate* ([`docs/ui/DESIGN_SYSTEM_SPEC.md`](../ui/DESIGN_SYSTEM_SPEC.md)).

---

## 3. Variables de Entorno Requeridas

| Variable | Descripción | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `DASHBOARD_ACCESS_PIN` | PIN numérico o contraseña de desbloqueo compartida por los dos usuarios. | Configurada en `.env` y Vercel (ej: `2026` o palabra clave). |
| `SESSION_SECRET` | Clave secreta utilizada para generar el hash de firma HMAC de la cookie de sesión. | Cadena aleatoria de 32+ caracteres. |

---

## 4. Arquitectura de Sesión y Cookies

### A. Anatomía de la Cookie
* **Nombre:** `agyke_session`
* **Valor:** Token firmado con HMAC-SHA256 (`<timestamp>.<firma>`).
* **Atributos de Seguridad:**
  * `HttpOnly`: Inaccesible desde JavaScript del navegador (mitiga robo vía XSS).
  * `Secure`: Obligatorio en producción para transmitirse únicamente sobre HTTPS.
  * `SameSite=Lax`: Protección contra ataques Cross-Site Request Forgery (CSRF).
  * `Path=/`: Válido para todo el dominio.
  * `Max-Age`: `2592000` segundos (30 días de persistencia para no solicitar PIN constantemente en dispositivos de confianza).

---

## 5. Middleware de Next.js (`web/src/middleware.ts`)

El middleware intercepta cada petición entrante y clasifica la ruta:

### A. Rutas Públicas (Exentas de Validación)
1. `/login`: Pantalla de ingreso de PIN.
2. `/api/auth/login`: Endpoint de verificación del PIN.
3. `/api/auth/logout`: Endpoint de cierre de sesión.
4. `/api/telegram/webhook`: Webhook oficial de Telegram (autenticado por token secreto de Telegram).
5. `/api/telegram/setup-webhook`: Utilidad de configuración inicial.
6. Rutas de assets estáticos de Next.js: `/_next/static/*`, `/_next/image/*`, `/favicon.ico`.

### B. Rutas Protegidas
1. `/` (Dashboard principal).
2. `/api/dashboard` (API REST consumida por el cliente para obtener usuarios, transacciones y balances).
3. Cualquier ruta o subruta futura que no esté en la lista blanca de rutas públicas.

### C. Comportamiento ante Acceso No Autorizado:
* **Páginas HTML (navegación):** Redirección HTTP `307 Temporary Redirect` hacia `/login`.
* **Rutas API (`/api/*`):** Retorno de respuesta HTTP `401 Unauthorized` con payload JSON:
  ```json
  { "error": "Acceso no autorizado. Ingrese el PIN de Agyke." }
  ```

---

## 6. Endpoints de Autenticación

### `POST /api/auth/login`
* **Request Payload:**
  ```json
  { "pin": "string" }
  ```
* **Lógica:**
  * Compara el PIN recibido contra `process.env.DASHBOARD_ACCESS_PIN`.
  * Si es válido: Genera el token de sesión firmado, setea la cookie `agyke_session` y responde `200 OK` `{ "success": true }`.
  * Si es inválido: Responde `401 Unauthorized` `{ "error": "PIN o contraseña incorrecta" }`.

### `POST /api/auth/logout`
* **Lógica:** Setea la cookie `agyke_session` con `Max-Age=0` para revocarla de inmediato y retorna `200 OK` `{ "success": true }`.

### `GET /api/auth/check`
* **Lógica:** Valida si la cookie actual es válida y vigente. Retorna `{ "authenticated": boolean }`.

---

## 7. Experiencia de Usuario (UI/UX de `/login`)

### Pantalla de Bloqueo
* Centrada vertical y horizontalmente en el canvas `#080B11`.
* Tarjeta glassmorphism con resplandor sutil índigo.
* Isotipo de Agyke (balanza) + Título `"Acceso Privado a Agyke"`.
* Input de PIN/Contraseña tipo `password` con botón de mostrar/ocultar y botón de desbloqueo `"Ingresar al Dashboard"`.
* Feedback visual ante error con animación sutil y texto claro.

### Acción de Salida en el Dashboard
* En [`HeaderBar.tsx`](../web/src/components/HeaderBar.tsx), incorporar un botón minimalista de **"Bloquear"** (`Lock` / `LogOut`) que invoque `/api/auth/logout` y redirija a `/login`.

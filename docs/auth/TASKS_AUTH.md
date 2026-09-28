# TASKS_AUTH.md - Roadmap de Implementación de Control de Acceso por PIN

Este documento desglosa en tareas atómicas y medibles la implementación del sistema de control de acceso por PIN y protección de rutas en **Agyke** bajo la metodología **Spec-Driven Development (SDD)**.

---

## Tareas de Implementación

### Fase 1: Módulo Criptográfico y Rutas de Autenticación
- [ ] **Tarea AUTH-1:** Crear módulo de utilidades de sesión (`web/src/lib/auth.ts`) para generar, firmar y verificar tokens HMAC-SHA256 con expiración.
- [ ] **Tarea AUTH-2:** Implementar endpoint `POST /api/auth/login` para validar el PIN y setear la cookie `agyke_session` (con flags `httpOnly`, `Secure`, `SameSite=Lax`).
- [ ] **Tarea AUTH-3:** Implementar endpoint `POST /api/auth/logout` para limpiar la cookie de sesión y revocar el acceso.

### Fase 2: Middleware de Protección de Rutas
- [ ] **Tarea AUTH-4:** Crear `web/src/middleware.ts` en Next.js para interceptar navegación a `/` y llamadas a `/api/dashboard`:
  - Permitir bypass estricto para `/login`, `/api/auth/*` y `/api/telegram/webhook`.
  - Redirigir a `/login` si no hay sesión válida en rutas de páginas.
  - Retornar `401 Unauthorized` si no hay sesión válida en rutas de API.

### Fase 3: Pantalla de Login y Botón de Bloqueo
- [ ] **Tarea AUTH-5:** Crear la página de acceso `web/src/app/login/page.tsx` con diseño *Obsidian Slate*, tarjeta glassmorphism, input de PIN/contraseña y feedback de validación.
- [ ] **Tarea AUTH-6:** Agregar botón de **"Bloquear / Salir"** en `web/src/components/HeaderBar.tsx` para permitir cerrar la sesión manualmente desde el dashboard.

### Fase 4: Pruebas y Verificación Integral
- [ ] **Tarea AUTH-7:** Crear tests automatizados de validación de PIN y firma de sesión HMAC.
- [ ] **Tarea AUTH-8:** Verificar que el Webhook de Telegram continúe operando sin interferencias (`POST /api/telegram/webhook`).
- [ ] **Tarea AUTH-9:** Actualizar bitácora pre-commit en `docs/STATUS.md` (ADR-014).

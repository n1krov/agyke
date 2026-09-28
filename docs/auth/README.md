# Control de Acceso y Privacidad en Agyke

Este directorio contiene las especificaciones formales, arquitectura y plan de tareas para la protección y control de acceso al Dashboard Web de **Agyke** bajo la metodología **Spec-Driven Development (SDD)**.

---

## Documentos de la Especificación

1. **[`AUTH_SPEC.md`](./AUTH_SPEC.md):** Especificación técnica formal del mecanismo de control de acceso mediante PIN / Contraseña, cookies HTTP-only, protección de rutas y middleware de Next.js.
2. **[`TASKS_AUTH.md`](./TASKS_AUTH.md):** Desglose atómico y medible de tareas para la implementación.

---

## Objetivo Principal
Evitar que personas no autorizadas puedan acceder a la URL pública del dashboard (`https://agyke.vercel.app`) y visualizar transacciones financieras, nombres o saldos netos entre los usuarios, manteniendo una experiencia ligera, fluida y sin fricción innecesaria para los dos participantes autorizados.

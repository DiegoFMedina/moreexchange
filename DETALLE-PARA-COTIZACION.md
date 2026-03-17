# Detalle del proyecto More Exchange — Para cotización

Resumen simple de lo que incluye la plataforma web (casa de cambios de divisas).

---

## 1. Sitio público (landing y uso)

- **Página de inicio**: Hero con mensaje principal, calculadora de cambio en vivo, secciones “Cómo funciona”, “Por qué elegirnos”, calculadora detallada, sucursales y footer.
- **Tasas**: Página con tabla de tasas de cambio en tiempo real (actualización cada 30 segundos).
- **Exchange**: Página de compra/venta de divisas con calculadora y flujo hacia pago.
- **Sucursales**: Página con ubicaciones/sucursales.
- **Autenticación**: Login y registro de clientes.

---

## 2. Panel de administración (CPanel)

- **Dashboard**: Métricas (volumen 24h, transacciones, tasa más consultada, ingresos del mes) y gráfica de historial de tasas.
- **Tasas**: CRUD de tasas de cambio con edición en línea (compra/venta), historial de cambios.
- **Transacciones**: Listado de transacciones con filtros (estado, fecha, moneda, usuario).

Acceso solo para rol **ADMIN**.

---

## 3. Backend (API REST)

- **Auth**: Registro, login, refresh token, logout, perfil (`/me`).
- **Tasas**: Listar tasas (público, cache 30s), obtener par específico, crear/actualizar/desactivar tasas (admin), historial por tasa (admin).
- **Exchange**: Calcular monto sin orden, crear orden con pago Stripe, listar y ver detalle de órdenes del usuario.
- **Pagos**: Webhook Stripe para confirmar pago; historial de pagos del usuario.
- **Admin**: Estadísticas, listado y activación/desactivación de usuarios, listado de transacciones con filtros.
- **API Keys**: Crear, listar y revocar API keys para integraciones externas.

API versionada bajo `/v1`, documentación Swagger en `/api/docs`.

---

## 4. Base de datos y lógica

- **PostgreSQL** con Prisma ORM.
- **Modelos**: Usuario (roles ADMIN/CLIENT), Moneda, Tasa de cambio, Historial de tasas, Transacción, API Key.
- **Redis**: Cache de tasas (30s) y soporte para rate limiting y tokens de refresco.
- **Seeds**: Monedas (USD, EUR, GBP, CLP, BRL, ARS), tasas de ejemplo, usuario admin inicial.

---

## 5. Pagos y seguridad

- **Stripe**: Pagos con tarjeta; creación de PaymentIntent y webhook para marcar transacción como completada.
- **JWT**: Access token (15 min) y refresh token (7 días), guardados/validados en backend.
- **Seguridad**: Bcrypt para contraseñas, validación de DTOs, CORS, Helmet, rate limiting, API keys hasheadas (SHA-256).

---

## 6. Stack técnico

| Área        | Tecnología |
|------------|------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind, Shadcn UI, Framer Motion, React Query, React Hook Form + Zod |
| Backend    | NestJS, TypeScript, Prisma, JWT, Swagger, Winston, class-validator |
| Base de datos | PostgreSQL |
| Cache / sesión | Redis |
| Pagos     | Stripe |
| Infra     | Monorepo (Turborepo + pnpm), Nginx, PM2, scripts de deploy y setup en Linux |

---

## 7. Infraestructura y despliegue

- Deploy en servidor Linux **sin Docker**: PM2 (front en puerto 3000, API en 3001), Nginx como reverse proxy.
- SSL con Certbot/Let’s Encrypt.
- Scripts: `setup-server.sh` (instalación inicial), `deploy.sh` (despliegue incremental).
- CI/CD con GitHub Actions (lint, test, build, deploy por SSH).

---

## Resumen para cotización (ítems)

1. Landing pública con hero, tasas en vivo, calculadora, cómo funciona, por qué elegirnos, sucursales.
2. Páginas: Tasas, Exchange (compra/venta), Sucursales.
3. Login y registro de clientes.
4. Panel admin: dashboard, gestión de tasas (CRUD + historial), gestión de transacciones.
5. API REST completa: auth, tasas, exchange, pagos, admin, API keys.
6. Integración Stripe (pago y webhook).
7. Base de datos PostgreSQL + Redis (cache y sesión).
8. Autenticación JWT y roles (ADMIN/CLIENT).
9. Documentación API (Swagger).
10. Infraestructura: Nginx, PM2, scripts y CI/CD (GitHub Actions).

---

*Documento generado para elaborar cotización. Proyecto: More Exchange.*

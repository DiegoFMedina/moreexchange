Eres un arquitecto de software senior. Debes diseñar y generar el código
base completo de una plataforma web para una casa de cambios de divisas.
Este es un proyecto profesional de alto presupuesto. No omitas ningún
detalle técnico.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPCIÓN DEL PROYECTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plataforma web para una casa de cambios con las siguientes capacidades:

1. Landing page pública que muestra tasas de cambio en tiempo real
2. Flujo de compra/venta de divisas con integración de pagos
3. Panel de administración (CPanel) para gestionar tasas
4. API REST pública versionada, lista para ser consumida por apps externas
5. Sistema de autenticación con roles (admin / cliente)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK TECNOLÓGICO OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND:
- Next.js 14 (App Router, SSR + SSG)
- TypeScript estricto (strict: true en tsconfig)
- Tailwind CSS + Shadcn UI (tema personalizado)
- Framer Motion para animaciones
- React Query (TanStack Query v5) para fetching y cache
- React Hook Form + Zod para formularios y validación
- next-intl para internacionalización (español/inglés)

BACKEND:
- Node.js con NestJS (arquitectura modular)
- TypeScript estricto
- Prisma ORM (con migraciones)
- JWT para autenticación (access token 15min + refresh token 7d)
- Guards de roles (ADMIN, CLIENT)
- Swagger/OpenAPI autogenerado en /api/docs
- Rate limiting (nestjs-throttler)
- Helmet + CORS configurado
- Class-validator + class-transformer para DTOs
- Winston para logging estructurado

BASE DE DATOS:
- PostgreSQL instalado localmente en el servidor Linux
- Prisma schema completo con todas las relaciones
- Seeds de datos iniciales (divisas, tasas de ejemplo, usuario admin)

CACHÉ Y RATE LIMITING:
- Redis instalado localmente en el servidor Linux
- Cache de tasas públicas con TTL de 30 segundos
- Rate limiting almacenado en Redis

PAGOS:
- Stripe (tarjetas internacionales)
- Estructura preparada para agregar Transbank/Webpay (Chile) en fase 2
- Webhooks para confirmación de pago asíncrona

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFRAESTRUCTURA — SIN DOCKER
Deploy directo en servidor Linux con PM2 y Nginx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROCESO DE DEPLOY:
- PM2 gestiona todos los procesos Node.js
- Nginx como reverse proxy con SSL (Certbot / Let's Encrypt)
- pnpm como gestor de paquetes en todo el proyecto
- Turborepo para gestión del monorepo

ARCHIVOS DE INFRAESTRUCTURA A GENERAR:

1. ecosystem.config.js (raíz del proyecto)
   - Proceso "cambios-web": Next.js puerto 3000, cluster mode, 2 instancias
   - Proceso "cambios-api": NestJS puerto 3001, cluster mode, 2 instancias
   - Variables de entorno referenciadas desde .env por proceso
   - max_memory_restart: 512M por proceso
   - Política restart: on_failure, max_restarts: 10
   - Logs separados por proceso en /var/log/cambios/

2. nginx/cambios-web.conf
   - Server block: dominio frontend → proxy_pass http://localhost:3000
   - Server block: api.dominio → proxy_pass http://localhost:3001
   - Headers de seguridad completos:
     X-Frame-Options, X-Content-Type-Options, HSTS,
     Content-Security-Policy básico
   - Gzip habilitado para assets estáticos
   - Cache de assets de Next.js (_next/static)
   - Location especial para /v1/payments/webhook:
     proxy_pass sin modificar el body (para verificación de firma Stripe)
   - Límite de body: 10mb para uploads

3. scripts/setup-server.sh
   Script completo y comentado para configurar el servidor desde cero:
   - Instalar Node.js 20 LTS via nvm
   - Instalar pnpm y pm2 globalmente
   - pm2 startup para sobrevivir reinicios del servidor
   - Instalar y configurar PostgreSQL (crear DB y usuario)
   - Instalar y configurar Redis (bind solo a localhost)
   - Crear directorios necesarios (/var/log/cambios, /var/www/cambios)
   - Clonar el repositorio
   - Instalar dependencias con pnpm
   - Configurar variables de entorno desde .env.example
   - Ejecutar migraciones y seeds de Prisma
   - Iniciar con PM2

4. scripts/deploy.sh
   Script de deploy incremental (usado en cada actualización):
   - git pull origin main
   - pnpm install --frozen-lockfile
   - cd apps/api && pnpm build
   - cd apps/web && pnpm build
   - npx prisma migrate deploy (solo aplica migraciones pendientes)
   - pm2 reload ecosystem.config.js --update-env
   - pm2 save
   - Echo resumen: versión desplegada, hora, estado de procesos

5. .github/workflows/deploy.yml
   CI/CD con GitHub Actions:
   - Trigger: push a rama main
   - Jobs en orden: lint → test → build → deploy
   - Job deploy: SSH al servidor, ejecutar scripts/deploy.sh
   - Usar secrets de GitHub para: SSH_HOST, SSH_USER, SSH_PRIVATE_KEY
   - Notificación al final (éxito o error) con resumen de cambios

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUCTURA DE CARPETAS COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/
├── apps/
│   ├── web/                             ← Next.js frontend
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx             ← Landing page
│   │   │   │   ├── rates/page.tsx       ← Tabla de tasas pública
│   │   │   │   └── exchange/page.tsx    ← Flujo de compra/venta
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx           ← Protegido, solo rol ADMIN
│   │   │       ├── page.tsx             ← Dashboard con métricas
│   │   │       ├── rates/page.tsx       ← CRUD tasas en vivo
│   │   │       └── transactions/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                      ← Shadcn components
│   │   │   ├── rates/
│   │   │   │   ├── RatesWidget.tsx      ← Widget tasas con polling 30s
│   │   │   │   ├── RatesTable.tsx
│   │   │   │   └── RateCard.tsx
│   │   │   ├── exchange/
│   │   │   │   ├── ExchangeForm.tsx
│   │   │   │   └── ExchangeCalculator.tsx
│   │   │   └── admin/
│   │   │       ├── RatesManager.tsx     ← Edición inline de tasas
│   │   │       ├── RateHistoryChart.tsx ← Gráfica con recharts
│   │   │       └── StatsCards.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                   ← Axios instance + interceptors
│   │   │   ├── auth.ts                  ← Helpers JWT client-side
│   │   │   └── utils.ts                 ← Formateo de monedas, fechas
│   │   ├── hooks/
│   │   │   ├── useRates.ts              ← React Query + polling
│   │   │   ├── useExchange.ts
│   │   │   └── useAuth.ts
│   │   └── types/index.ts
│   │
│   └── api/                             ← NestJS backend
│       ├── src/
│       │   ├── main.ts                  ← Bootstrap + Swagger + Helmet
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts
│       │   │   │   │   └── refresh-jwt.strategy.ts
│       │   │   │   ├── guards/
│       │   │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   │   └── roles.guard.ts
│       │   │   │   └── dto/
│       │   │   │       ├── login.dto.ts
│       │   │   │       └── register.dto.ts
│       │   │   ├── rates/
│       │   │   │   ├── rates.module.ts
│       │   │   │   ├── rates.controller.ts
│       │   │   │   ├── rates.service.ts
│       │   │   │   ├── rates.cache.service.ts ← Redis cache logic
│       │   │   │   └── dto/
│       │   │   │       ├── create-rate.dto.ts
│       │   │   │       └── update-rate.dto.ts
│       │   │   ├── exchange/
│       │   │   │   ├── exchange.module.ts
│       │   │   │   ├── exchange.controller.ts
│       │   │   │   ├── exchange.service.ts
│       │   │   │   └── dto/create-exchange.dto.ts
│       │   │   ├── payments/
│       │   │   │   ├── payments.module.ts
│       │   │   │   ├── payments.controller.ts
│       │   │   │   ├── payments.service.ts
│       │   │   │   └── stripe.service.ts
│       │   │   └── users/
│       │   │       ├── users.module.ts
│       │   │       ├── users.service.ts
│       │   │       └── dto/update-user.dto.ts
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   │   ├── roles.decorator.ts
│       │   │   │   └── public.decorator.ts
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   ├── interceptors/
│       │   │   │   └── transform.interceptor.ts
│       │   │   └── middleware/
│       │   │       └── logger.middleware.ts
│       │   └── prisma/
│       │       ├── prisma.module.ts
│       │       ├── prisma.service.ts
│       │       ├── schema.prisma
│       │       └── seed.ts
│       └── test/
│           └── rates.e2e-spec.ts
│
├── nginx/
│   └── cambios-web.conf
├── scripts/
│   ├── setup-server.sh
│   └── deploy.sh
├── .github/
│   └── workflows/
│       └── deploy.yml
├── ecosystem.config.js
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
└── package.json                         ← raíz del monorepo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCHEMA DE BASE DE DATOS — Prisma completo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Genera schema.prisma con estos modelos exactos:

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  password     String
  role         Role          @default(CLIENT)
  firstName    String
  lastName     String
  phone        String?
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  transactions Transaction[]
  apiKeys      ApiKey[]
  rateChanges  RateHistory[]
}

enum Role { ADMIN CLIENT }

model Currency {
  id           String         @id @default(cuid())
  code         String         @unique
  name         String
  symbol       String
  flagEmoji    String
  decimals     Int            @default(2)
  isActive     Boolean        @default(true)
  ratesFrom    ExchangeRate[] @relation("FromCurrency")
  ratesTo      ExchangeRate[] @relation("ToCurrency")
}

model ExchangeRate {
  id             String        @id @default(cuid())
  fromCurrency   Currency      @relation("FromCurrency", fields: [fromCurrencyId], references: [id])
  fromCurrencyId String
  toCurrency     Currency      @relation("ToCurrency", fields: [toCurrencyId], references: [id])
  toCurrencyId   String
  buyRate        Decimal       @db.Decimal(18, 6)
  sellRate       Decimal       @db.Decimal(18, 6)
  spread         Decimal       @db.Decimal(5, 4)
  isActive       Boolean       @default(true)
  updatedAt      DateTime      @updatedAt
  updatedById    String?
  history        RateHistory[]
  @@unique([fromCurrencyId, toCurrencyId])
}

model RateHistory {
  id             String       @id @default(cuid())
  exchangeRate   ExchangeRate @relation(fields: [exchangeRateId], references: [id])
  exchangeRateId String
  buyRate        Decimal      @db.Decimal(18, 6)
  sellRate       Decimal      @db.Decimal(18, 6)
  changedAt      DateTime     @default(now())
  changedBy      User?        @relation(fields: [changedById], references: [id])
  changedById    String?
}

model Transaction {
  id              String            @id @default(cuid())
  user            User              @relation(fields: [userId], references: [id])
  userId          String
  fromCurrencyId  String
  toCurrencyId    String
  fromAmount      Decimal           @db.Decimal(18, 2)
  toAmount        Decimal           @db.Decimal(18, 2)
  rateApplied     Decimal           @db.Decimal(18, 6)
  status          TransactionStatus @default(PENDING)
  paymentMethod   String?
  paymentIntentId String?           @unique
  notes           String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

enum TransactionStatus {
  PENDING PROCESSING COMPLETED FAILED REFUNDED
}

model ApiKey {
  id         String    @id @default(cuid())
  user       User      @relation(fields: [userId], references: [id])
  userId     String
  keyHash    String    @unique
  name       String
  lastUsedAt DateTime?
  expiresAt  DateTime?
  isActive   Boolean   @default(true)
  rateLimit  Int       @default(1000)
  createdAt  DateTime  @default(now())
}

Genera también seed.ts con:
- 6 monedas: USD, EUR, GBP, CLP, BRL, ARS
- Tasas de ejemplo para los pares más comunes
- Usuario admin: email desde variable de entorno ADMIN_EMAIL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENDPOINTS COMPLETOS DE LA API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prefijo global: /v1

AUTH — /v1/auth
  POST   /register          Registro cliente. Devuelve tokens.
  POST   /login             Login. Devuelve access + refresh tokens.
  POST   /refresh           Renueva access token con refresh token.
  POST   /logout            Invalida refresh token en Redis.
  GET    /me                Perfil autenticado. [JWT]

RATES — /v1/rates
  GET    /                  Lista tasas activas. Público. Cache Redis 30s.
  GET    /:from/:to         Tasa específica ej: /USD/CLP. Público.
  POST   /                  Crear tasa. [ADMIN]
  PATCH  /:id               Actualizar buyRate y/o sellRate. [ADMIN]
                            Guarda en RateHistory automáticamente.
                            Invalida cache Redis al actualizar.
  DELETE /:id               Desactivar tasa (soft delete). [ADMIN]
  GET    /:id/history       Historial de cambios paginado. [ADMIN]

EXCHANGE — /v1/exchange
  POST   /calculate         Calcula monto resultado sin crear orden.
                            Público. Usa tasa vigente en ese instante.
  POST   /order             Crea orden y PaymentIntent de Stripe. [JWT]
  GET    /orders            Lista órdenes del usuario autenticado. [JWT]
  GET    /orders/:id        Detalle de orden. [JWT]

PAYMENTS — /v1/payments
  POST   /webhook           Webhook Stripe. Sin auth. Verifica firma.
                            Al recibir payment_intent.succeeded:
                            actualiza Transaction a COMPLETED.
  GET    /history           Historial de pagos del usuario. [JWT]

ADMIN — /v1/admin          Todos requieren [ADMIN]
  GET    /stats             Métricas: volumen 24h, transacciones,
                            tasa más consultada, ingresos del mes.
  GET    /users             Lista usuarios con paginación y filtros.
  PATCH  /users/:id         Activar o desactivar usuario.
  GET    /transactions      Todas las transacciones con filtros:
                            status, fecha, usuario, moneda.

API KEYS — /v1/api-keys    Todos requieren [JWT]
  GET    /                  Lista mis API keys activas.
  POST   /                  Crea nueva key. Retorna el valor plano
                            UNA sola vez. Guarda solo el hash SHA-256.
  DELETE /:id               Revoca una API key.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO ESTÁNDAR DE RESPUESTAS API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementar con TransformInterceptor y HttpExceptionFilter.
TODAS las respuestas deben seguir este formato:

Éxito:
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}

Error:
{
  "success": false,
  "error": {
    "code": "RATE_NOT_FOUND",
    "message": "La tasa solicitada no existe",
    "details": []
  }
}

Paginado:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEGURIDAD — IMPLEMENTAR TODO SIN EXCEPCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Passwords: bcrypt con saltRounds 12
- JWT access token: expira 15min, firmado con JWT_SECRET
- JWT refresh token: expira 7d, firmado con JWT_REFRESH_SECRET distinto
  Almacenar refresh token hasheado en Redis al hacer login.
  Al hacer logout, eliminar de Redis (invalidación real).
- API Keys: SHA-256 del valor plano, nunca guardar el valor real
- Stripe webhook: verificar con stripe.webhooks.constructEvent()
  Si la firma falla, responder 400 inmediatamente sin procesar.
- Rate limiting:
  100 req/min en rutas públicas (GET /v1/rates)
  20 req/min en rutas de auth (POST /v1/auth/*)
  500 req/min para API Keys de integración
- CORS: leer dominios permitidos desde variable ALLOWED_ORIGINS
  En desarrollo: localhost:3000
  En producción: solo el dominio real
- Helmet: configurar con CSP básico
- Todos los DTOs con class-validator: no pasar datos sin validar
- Prisma: usar siempre queries parametrizadas (nunca raw strings)
- Variables sensibles: SOLO en .env, nunca hardcodeadas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISEÑO VISUAL — FRONTEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La landing page debe posicionarse visualmente por encima de Afex Chile.
Referentes de diseño: Mercury Bank, Brex, Ramp — fintech de nueva
generación. Futurista pero contenido. Datos que se ven bien. Sin
ornamentos. Sin el look "startup de 2018".

NUNCA usar:
- Inter, Roboto, gradientes morados, cards con sombra difusa
- Íconos de emoji, ilustraciones flat genéricas
- Layouts centrados y simétricos sin tensión visual
- Cualquier cosa que parezca un template de Tailwind UI
- Animaciones de partículas, glitch, neon, cyberpunk —
  futurista barato. Queremos futurista sofisticado.

TIPOGRAFÍA:
- Display / títulos grandes: Syne peso 800 (geométrica, moderna,
  con carácter propio)
- Cuerpo y UI: DM Sans (compacto, funcional)
- Cargar ambas desde Google Fonts via next/font
- Números de tasas: font-variant-numeric: tabular-nums siempre,
  para que los dígitos no se muevan al actualizarse
- Tamaño hero: clamp(52px, 7vw, 88px), line-height 0.95

COLOR — Paleta "More Exchange — azul profundo":
Basada en la identidad de marca existente (azul + cyan),
elevada a fintech de nueva generación. Profundidad y sofisticación.

- Fondo base:           #06080f
- Superficie primaria:  #0c0f1a
- Superficie cards:     #111629
- Bordes sutiles:       #1c2240
- Bordes énfasis:       #2a3460
- Texto primario:       #eef0f8
- Texto secundario:     #6b7499
- Acento principal:     #00b4d8
- Acento hover:         #00d4ff
- Acento suave (glow):  rgba(0, 180, 216, 0.12)
- Alza / positivo:      #00c896
- Baja / negativo:      #ff4d6a
- Azul medio (UI):      #1a3a8f

Usar el acento cyan SOLO en: cifras de tasas, CTA principal,
bordes de elementos activos, indicadores de cambio.
El resto de la UI vive en la escala azul-oscura.

ACERCA DEL LOGO Y MARCA:
- El logo del toro y el nombre "More Exchange" son el símbolo
  central de la marca. Incluir en navbar como <Image> de Next.js
  apuntando a /public/logo.svg — nunca usar <img>.
- El nombre "More Exchange" en Syne peso 700, color #eef0f8.
- En mobile el logo colapsa a solo el toro sin el texto.
- No reinventar la marca — evolucionarla visualmente.

LAYOUT Y COMPOSICIÓN:
- Hero: texto a la izquierda (60% del ancho), calculadora
  flotando a la derecha con borde luminoso sutil en #00b4d8
- Líneas de 1px en #1c2240 como separadores estructurales
- Tabla de tasas: estilo "terminal financiero". Filas densas,
  números monoespaciados, indicador de alza/baja con triángulo
  de color (#00c896 / #ff4d6a). Sin cards redondeadas.
- Elemento decorativo en el hero: grid de puntos muy sutil
  (opacity 0.04) como fondo — tecnológico sin ser cliché
- Número grande de tasa en el fondo del hero (opacity 0.03)
  como textura tipográfica

ANIMACIONES (Framer Motion — menos es más):
- Entrada hero: stagger 0.06s, y: 20 → 0, opacity 0 → 1
- Números de tasas al actualizarse: color flash en #00b4d8
  por 400ms, spring suave (stiffness 100, damping 20)
- Hover en filas de tasas: fondo #111629 → #151d38,
  borde izquierdo 2px #00b4d8. Sin escala, sin sombras.
- CTA button: borde que "se llena" de acento en hover
  (clip-path animation).
- Scroll reveal: solo opacity + y mínimo. Nada dramático.

NAVBAR:
- Fondo transparente sobre hero, blur al hacer scroll
  (backdrop-filter: blur(12px) + fondo #06080f con 80% opacidad)
- Logo: <Image> del toro + "More Exchange" en Syne peso 700
- Links en DM Sans peso 400, color #6b7499, hover #eef0f8
- CTA en navbar: outline #00b4d8, relleno en hover

CTA PRINCIPAL:
- Fondo #00b4d8, texto #06080f
- border-radius: 6px
- Sin sombras, sin gradiente
- En hover: fondo #00d4ff

FOOTER:
- Fondo #04060c
- Tipografía 13px DM Sans, color #6b7499
- Línea superior 1px #1c2240
- Sin grandes espacios en blanco

LANDING PAGE — 6 secciones en orden:

1. HERO
   - Titular principal en Syne peso 800, clamp(52px, 7vw, 88px)
   - Subtítulo en DM Sans, máximo 2 líneas, color #6b7499
   - Calculadora de cambio inline a la derecha:
     campo "Envío" con selector de divisa (bandera + código)
     campo "Recibe" con selector de divisa
     montos calculados en tiempo real al escribir
     usa tasa actual de la API via React Query
   - CTA primario: "Cambiar ahora"
   - Animación de entrada con Framer Motion (stagger 0.06s)

2. TASAS EN VIVO
   - Separador editorial: línea 1px + label en mayúsculas 11px
   - Tabla estilo terminal financiero con columnas:
     Par, Compra, Venta, Variación 24h
   - Actualización cada 30 segundos con React Query
   - Números animados con spring al cambiar (flash #00b4d8)

3. CÓMO FUNCIONA
   - 3 pasos: Elige divisa → Confirma monto → Recibe tu dinero
   - Iconos SVG inline simples, color #00b4d8
   - Layout horizontal en desktop, vertical en mobile

4. POR QUÉ ELEGIRNOS
   - 4 diferenciadores en grid 2x2:
     "Tasas competitivas", "100% seguro",
     "Proceso en minutos", "Soporte en español"
   - Cards con borde 1px #1c2240, hover borde #00b4d8

5. CALCULADORA DETALLADA
   - Versión expandida de la calculadora del hero
   - Desglose visible: monto base, spread, monto final
   - Selector de método de pago (tarjeta / transferencia)

6. FOOTER
   - Logo More Exchange + descripción corta
   - Links: Tasas, Cómo funciona, Contacto, Términos, Privacidad
   - Información regulación / licencia (placeholder)
   - Links redes sociales (more_exchange)

PANEL ADMIN:
- Light mode, estética dashboard financiero limpio
- Sidebar fijo: Dashboard, Tasas, Transacciones, Usuarios
- Dashboard: 4 StatsCards (volumen 24h, transacciones hoy,
  tasa más consultada, ingresos mes)
- Gráfica historial de tasas con recharts (línea temporal)
- Tabla de tasas con Shadcn DataTable: edición inline de
  buyRate y sellRate, guardar con un click, invalida cache
  Redis inmediatamente reflejando el cambio en el sitio público
- Tabla de transacciones con filtros: estado, fecha, moneda
- Responsive: sidebar colapsa en mobile con hamburger menu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VARIABLES DE ENTORNO — .env.example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Genera el archivo completo con comentarios explicativos:

# ── Base de datos ──────────────────────────────────
# PostgreSQL local. Reemplazar con tus credenciales.
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cambios_db"

# ── Redis ──────────────────────────────────────────
# Redis local. No exponer al exterior.
REDIS_URL="redis://localhost:6379"

# ── JWT ────────────────────────────────────────────
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Stripe ─────────────────────────────────────────
# Obtener en https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
# Obtener en https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=
# Clave pública, puede exponerse al frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# ── URLs ───────────────────────────────────────────
# En desarrollo: http://localhost:3001
# En producción: https://api.tudominio.cl
NEXT_PUBLIC_API_URL=
# Dominios permitidos en CORS, separados por coma
ALLOWED_ORIGINS=

# ── Entorno ────────────────────────────────────────
NODE_ENV=development

# ── Admin inicial (usado en seed) ──────────────────
ADMIN_EMAIL=
ADMIN_PASSWORD=

# ── Puertos ────────────────────────────────────────
PORT_API=3001
PORT_WEB=3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CALIDAD DE CÓDIGO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ESLint config para Next.js y NestJS por separado
- Prettier con config compartida en la raíz
- Husky + lint-staged: en pre-commit ejecuta lint y format
- Jest para tests unitarios del backend:
  rates.service.spec.ts (mockear Prisma con jest-mock-extended)
  auth.service.spec.ts
- Un test e2e básico: rates.e2e-spec.ts (GET /v1/rates)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCCIONES DE ENTREGA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGLA 1 — Código real, sin placeholders.
No uses "// TODO", "// implementar", "// lógica aquí".
Cada archivo debe tener código funcional completo.

REGLA 2 — Encabezado en cada archivo.
Al inicio de cada archivo incluye:
// PATH: ruta/relativa/desde/raiz/del/proyecto
// DESC: una línea describiendo qué hace este archivo

REGLA 3 — Orden de entrega obligatorio:
  a) package.json raíz + turbo.json + pnpm-workspace.yaml
  b) schema.prisma + seed.ts
  c) Backend: main.ts → app.module → módulos en orden:
     auth → rates → exchange → payments → users
     luego common: guards → filters → interceptors
  d) Frontend: layout raíz → landing page (page.tsx) →
     RatesWidget → ExchangeForm → admin layout → admin pages
  e) Infraestructura: ecosystem.config.js →
     nginx/cambios-web.conf → scripts/ → .github/workflows/
  f) .env.example

REGLA 4 — Si la respuesta se corta.
Termina el archivo actual antes de cortar.
Cuando el usuario diga "continúa", retoma exactamente
desde el siguiente archivo en el orden de entrega.

REGLA 5 — Al finalizar todo, incluye sección:
"COMANDOS DE INICIO — DESDE CERO"
Con pasos exactos, numerados, para:
  1. Clonar el repositorio
  2. Configurar el servidor Linux (ejecutar setup-server.sh)
  3. Configurar variables de entorno
  4. Ejecutar migraciones y seed
  5. Iniciar con PM2
  6. Verificar que todo funciona (URLs de prueba)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Empieza ahora con el paso (a):
package.json raíz, turbo.json y pnpm-workspace.yaml.
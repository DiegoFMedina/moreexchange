#!/usr/bin/env bash
# PATH: scripts/deploy.sh
# DESC: Script de deploy incremental — actualiza código, instala dependencias, migra y recarga PM2

set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

START_TIME=$(date +%s)

# ── Verificaciones previas ────────────────────────────────────────────────────
APP_DIR="${APP_DIR:-/var/www/cambios}"
[ -d "${APP_DIR}/.git" ] || err "No se encontró repositorio en ${APP_DIR}"
cd "${APP_DIR}"

log "=== More Exchange — Deploy iniciado ==="
log "Rama: $(git branch --show-current)"
log "Commit anterior: $(git rev-parse --short HEAD)"

# ── 1. Actualizar código ──────────────────────────────────────────────────────
log "1/6 git pull origin main..."
git pull origin main --rebase

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --format="%s")
log "  Nuevo commit: ${COMMIT_HASH} — ${COMMIT_MSG}"

# ── 2. Instalar dependencias ──────────────────────────────────────────────────
log "2/6 pnpm install --frozen-lockfile..."
pnpm install --frozen-lockfile --silent

# ── 3. Build API ──────────────────────────────────────────────────────────────
log "3/6 Build API (NestJS)..."
cd apps/api && pnpm build && cd "${APP_DIR}"
log "  API compilada en apps/api/dist/"

# ── 4. Build Web ──────────────────────────────────────────────────────────────
# Next.js hornea NEXT_PUBLIC_* en tiempo de build. Si no está definida, el cliente
# pide tasas a localhost y en producción no se ven. Cargamos .env de la raíz para
# que NEXT_PUBLIC_API_URL esté disponible durante el build.
log "4/6 Build Web (Next.js)..."
if [ -f "${APP_DIR}/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "${APP_DIR}/.env"
  set +a
  [ -n "${NEXT_PUBLIC_API_URL:-}" ] && log "  NEXT_PUBLIC_API_URL definida para el build"
fi
[ -z "${NEXT_PUBLIC_API_URL:-}" ] && warn "  NEXT_PUBLIC_API_URL no definida: el hero pedirá tasas a localhost (no se verán en producción)"
cd apps/web && pnpm build && cd "${APP_DIR}"
log "  Web compilada en apps/web/.next/"

# ── 5. Migraciones pendientes ─────────────────────────────────────────────────
log "5/6 Aplicando migraciones Prisma..."
cd apps/api && npx prisma migrate deploy && cd "${APP_DIR}"
log "  Migraciones aplicadas"

# ── 6. Recargar PM2 ──────────────────────────────────────────────────────────
log "6/6 Recargando procesos PM2..."
pm2 reload ecosystem.config.js --update-env
pm2 save

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# ── Resumen ───────────────────────────────────────────────────────────────────
log ""
log "✅ === Deploy completado ==="
log "  Versión desplegada: ${COMMIT_HASH}"
log "  Mensaje:            ${COMMIT_MSG}"
log "  Hora:               $(date)"
log "  Tiempo total:       ${ELAPSED}s"
log ""
log "Estado de procesos PM2:"
pm2 status

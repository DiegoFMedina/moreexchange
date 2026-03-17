#!/usr/bin/env bash
# PATH: scripts/setup-server.sh
# DESC: Script de configuración completa del servidor Linux desde cero — Node, pnpm, PM2, PostgreSQL, Redis, Nginx

set -euo pipefail
IFS=$'\n\t'

# ── Colores ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[SETUP]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Variables configurables ───────────────────────────────────────────────────
REPO_URL="${REPO_URL:-https://github.com/tu-usuario/moreexchange.git}"
APP_DIR="/var/www/cambios"
LOG_DIR="/var/log/cambios"
DB_NAME="cambios_db"
DB_USER="cambios_user"
DB_PASS="${DB_PASSWORD:-$(openssl rand -base64 24)}"
NODE_VERSION="20"

log "=== More Exchange — Configuración de servidor ==="
log "Hora: $(date)"
log "Usuario: $(whoami)"

# ── 1. Actualizar sistema ─────────────────────────────────────────────────────
log "1/10 Actualizando paquetes del sistema..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
sudo apt-get install -y -qq curl git build-essential openssl ca-certificates gnupg lsb-release

# ── 2. Instalar Node.js 20 LTS via nvm ───────────────────────────────────────
log "2/10 Instalando Node.js ${NODE_VERSION} LTS via nvm..."
if ! command -v nvm &>/dev/null; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # Cargar nvm en la sesión actual
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
nvm install "${NODE_VERSION}"
nvm use "${NODE_VERSION}"
nvm alias default "${NODE_VERSION}"
log "  Node.js: $(node --version) | npm: $(npm --version)"

# ── 3. Instalar pnpm y pm2 globalmente ───────────────────────────────────────
log "3/10 Instalando pnpm y PM2..."
npm install -g pnpm@9 pm2 --quiet
log "  pnpm: $(pnpm --version) | PM2: $(pm2 --version)"

# ── 4. PM2 startup para sobrevivir reinicios ─────────────────────────────────
log "4/10 Configurando PM2 startup..."
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash || true

# ── 5. Instalar y configurar PostgreSQL ──────────────────────────────────────
log "5/10 Instalando PostgreSQL..."
sudo apt-get install -y -qq postgresql postgresql-contrib

sudo systemctl enable postgresql
sudo systemctl start postgresql

# Crear base de datos y usuario
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || warn "Usuario ${DB_USER} ya existe"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || warn "BD ${DB_NAME} ya existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true

log "  PostgreSQL configurado: BD=${DB_NAME} | Usuario=${DB_USER}"
warn "  GUARDAR esta contraseña: ${DB_PASS}"

# ── 6. Instalar y configurar Redis ───────────────────────────────────────────
log "6/10 Instalando Redis..."
sudo apt-get install -y -qq redis-server

# Configurar Redis: solo escuchar en localhost
sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

sudo systemctl enable redis-server
sudo systemctl restart redis-server
log "  Redis corriendo en 127.0.0.1:6379"

# ── 7. Crear directorios necesarios ──────────────────────────────────────────
log "7/10 Creando directorios..."
sudo mkdir -p "${LOG_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER:$USER" "${LOG_DIR}" "${APP_DIR}"
log "  Directorios creados: ${APP_DIR}, ${LOG_DIR}"

# ── 8. Clonar el repositorio ─────────────────────────────────────────────────
log "8/10 Clonando repositorio..."
if [ -d "${APP_DIR}/.git" ]; then
    warn "  Repositorio ya existe. Ejecutando git pull..."
    cd "${APP_DIR}" && git pull origin main
else
    git clone "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"

# ── 9. Configurar variables de entorno ───────────────────────────────────────
log "9/10 Configurando variables de entorno..."
if [ ! -f "${APP_DIR}/.env" ]; then
    cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"

    # Rellenar valores generados automáticamente
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|" .env
    sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env

    warn "  IMPORTANTE: Edita .env y configura STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc."
    warn "  Archivo: ${APP_DIR}/.env"
else
    log "  .env ya existe — omitiendo."
fi

# ── 10. Instalar dependencias, migrar y arrancar ──────────────────────────────
log "10/10 Instalando dependencias..."
pnpm install --frozen-lockfile

log "  Generando cliente Prisma..."
pnpm db:generate

log "  Ejecutando migraciones..."
pnpm db:migrate:deploy

log "  Ejecutando seed inicial..."
pnpm db:seed

log "  Compilando aplicaciones..."
pnpm build

log "  Iniciando con PM2..."
pm2 start ecosystem.config.js --env production
pm2 save

log ""
log "✅ === Servidor configurado exitosamente ==="
log ""
log "URLs de verificación:"
log "  Frontend: http://$(hostname -I | awk '{print $1}'):3000"
log "  API:      http://$(hostname -I | awk '{print $1}'):3001/v1"
log "  Swagger:  http://$(hostname -I | awk '{print $1}'):3001/api/docs"
log ""
log "Próximos pasos:"
log "  1. Editar ${APP_DIR}/.env con tus credenciales reales"
log "  2. Configurar Nginx: sudo cp nginx/cambios-web.conf /etc/nginx/sites-available/"
log "  3. Obtener certificados SSL con Certbot"
log "  4. Recargar Nginx: sudo nginx -s reload"

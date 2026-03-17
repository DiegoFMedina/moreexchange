#!/usr/bin/env bash
# PATH: scripts/setup-nginx.sh
# DESC: Instala la config de Nginx en el servidor (ejecutar en el servidor tras clonar el repo)
# Uso: ./scripts/setup-nginx.sh tudominio.com
#   o: DOMAIN=tudominio.com ./scripts/setup-nginx.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log()  { echo -e "${GREEN}[nginx]${NC} $*"; }
warn() { echo -e "${YELLOW}[nginx]${NC} $*"; }

# Directorio del repo (donde está deploy/nginx/)
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
CONF_SRC="${REPO_DIR}/deploy/nginx/moreexchange.conf"
SITE_NAME="moreexchange"
AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}"
ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"

DOMAIN="${1:-${DOMAIN:-}}"
if [[ -z "${DOMAIN}" ]]; then
  echo "Uso: $0 <dominio>   ej: $0 midominio.com"
  echo "  o: DOMAIN=midominio.com $0"
  exit 1
fi

[[ -f "${CONF_SRC}" ]] || { echo "No se encuentra ${CONF_SRC}. Ejecuta desde la raíz del repo."; exit 1; }

log "Dominio: ${DOMAIN}"
log "Instalando config en ${AVAILABLE} ..."
sudo sed "s/__DOMAIN__/${DOMAIN}/g" "${CONF_SRC}" | sudo tee "${AVAILABLE}" > /dev/null

if [[ ! -L "${ENABLED}" ]]; then
  log "Activando sitio (symlink a sites-enabled)..."
  sudo ln -sf "${AVAILABLE}" "${ENABLED}"
else
  log "Sitio ya estaba activado."
fi

log "Comprobando Nginx (nginx -t)..."
sudo nginx -t

log "Recargando Nginx..."
sudo systemctl reload nginx

log "Listo. Nginx sirve ${DOMAIN} -> :3000 (web) y /v1 -> :3001 (API)."
warn "Para HTTPS ejecuta: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

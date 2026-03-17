#!/usr/bin/env bash
# PATH: scripts/prepare-certbot.sh
# DESC: Crea /var/www/certbot con permisos para Nginx y opcionalmente desactiva el default site
# Ejecutar en el servidor antes de certbot certonly --webroot

set -euo pipefail

log() { echo "[certbot-prep] $*"; }

log "Creando /var/www/certbot y estructura .well-known/acme-challenge/ ..."
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
# Nginx suele correr como www-data; debe poder leer los ficheros que Certbot crea
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot

log "Comprobando que la config de Nginx tiene location /.well-known/acme-challenge/ ..."
if ! sudo grep -q 'acme-challenge' /etc/nginx/sites-enabled/moreexchange 2>/dev/null; then
  echo "AVISO: En /etc/nginx/sites-enabled/moreexchange no aparece acme-challenge."
  echo "       Ejecuta de nuevo: ./scripts/setup-nginx.sh TU_DOMINIO"
  exit 1
fi

log "Listo. Ejecuta: sudo certbot certonly --webroot -w /var/www/certbot -d TU_DOMINIO -d www.TU_DOMINIO"
log "Si sigue fallando, revisa el log de Nginx: sudo tail -20 /var/log/nginx/error.log"

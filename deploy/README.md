# Deploy en servidor Ubuntu

## Nginx (una sola vez en el servidor)

Tras clonar el repo en el servidor:

```bash
cd /var/www/moreexchange   # o la ruta donde clonaste
chmod +x scripts/setup-nginx.sh
./scripts/setup-nginx.sh tudominio.com
```

Luego HTTPS (crear carpeta para el reto ACME y obtener certificado):

```bash
sudo mkdir -p /var/www/certbot
# Opción A: obtener cert y que Certbot configure Nginx
sudo certbot certonly --webroot -w /var/www/certbot -d tudominio.com -d www.tudominio.com
sudo certbot --nginx   # añade SSL al sitio ya existente
# Opción B: solo certbot --nginx (si el sitio ya tiene location /.well-known en la config)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

## Deploy de la app (actualizar código)

Usa el script existente (ajusta `APP_DIR` si no es `/var/www/cambios`):

```bash
APP_DIR=/var/www/moreexchange ./scripts/deploy.sh
```

Requiere PM2 y `ecosystem.config.js` con los procesos web y api ya configurados.

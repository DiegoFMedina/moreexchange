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
./scripts/prepare-certbot.sh
sudo certbot certonly --webroot -w /var/www/certbot -d tudominio.com -d www.tudominio.com
sudo certbot --nginx
```

Si Certbot devuelve 500 en el reto ACME:
- Comprueba que en el servidor está la config nueva: `grep acme-challenge /etc/nginx/sites-enabled/moreexchange`
- Si no sale nada, haz `git pull` y vuelve a ejecutar `./scripts/setup-nginx.sh tudominio.com`
- Revisa el log de Nginx: `sudo tail -30 /var/log/nginx/error.log`
- Si existe sitio por defecto que pueda capturar el tráfico: `sudo rm /etc/nginx/sites-enabled/default` y `sudo nginx -t && sudo systemctl reload nginx`

## Deploy de la app (actualizar código)

Usa el script existente (ajusta `APP_DIR` si no es `/var/www/cambios`):

```bash
APP_DIR=/var/www/moreexchange ./scripts/deploy.sh
```

Requiere PM2 y `ecosystem.config.js` con los procesos web y api ya configurados.

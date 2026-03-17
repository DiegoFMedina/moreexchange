#!/usr/bin/env bash
# PATH: scripts/debug-acme.sh
# DESC: Diagnóstico del reto ACME: comprueba Nginx, permisos y simula una petición
# Ejecutar en el servidor como root o con sudo

set -euo pipefail

echo "=== 1. Sitios habilitados ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true

echo ""
echo "=== 2. ¿Existe location acme-challenge en moreexchange? ==="
grep -n "acme-challenge\|alias\|root" /etc/nginx/sites-enabled/moreexchange 2>/dev/null || echo "(archivo no encontrado o sin coincidencias)"

echo ""
echo "=== 3. Permisos de /var/www/certbot ==="
ls -la /var/www/certbot 2>/dev/null || echo "(directorio no existe)"
ls -la /var/www/certbot/.well-known/acme-challenge 2>/dev/null || true

echo ""
echo "=== 4. Fichero de prueba (simular Certbot) ==="
TEST_FILE="/var/www/certbot/.well-known/acme-challenge/debug-test-$$"
echo "ok" | sudo tee "$TEST_FILE" > /dev/null
sudo chown www-data:www-data "$TEST_FILE" 2>/dev/null || true
echo "Creado: $TEST_FILE"

echo ""
echo "=== 5. Petición a localhost con Host: problemasinformaticos.cloud ==="
HTTP_CODE=$(curl -s -o /tmp/acme-response.txt -w "%{http_code}" -H "Host: problemasinformaticos.cloud" "http://127.0.0.1/.well-known/acme-challenge/debug-test-$$" 2>/dev/null || echo "000")
echo "Código HTTP: $HTTP_CODE"
echo "Contenido: $(cat /tmp/acme-response.txt 2>/dev/null || echo '—')"
rm -f "$TEST_FILE" /tmp/acme-response.txt 2>/dev/null || true

echo ""
echo "=== 6. Últimas líneas del log de errores de Nginx ==="
sudo tail -15 /var/log/nginx/error.log 2>/dev/null || echo "(no se pudo leer)"

echo ""
echo "=== Conclusión ==="
echo "Si en (5) el código es 200: Nginx está bien; el 500 puede venir de un proxy/firewall delante del servidor (p. ej. del proveedor del VPS)."
echo "Si en (5) el código es 500 o 000: revisa (6) y la config de Nginx."

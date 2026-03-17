#!/usr/bin/env bash
# Ejecutar en el servidor: bash scripts/check-backend.sh
# Comprueba por qué Nginx puede devolver 502 (web y API no responden)

set -euo pipefail

echo "=== 1. Procesos PM2 (cambios-web, cambios-api) ==="
pm2 list 2>/dev/null | grep -E "cambios|name|──" || pm2 list

echo ""
echo "=== 2. ¿Algo escucha en 3000 y 3001? ==="
ss -tlnp 2>/dev/null | grep -E ':3000|:3001' || echo "Nada en 3000/3001"
echo "O con netstat:"
netstat -tlnp 2>/dev/null | grep -E '3000|3001' || true

echo ""
echo "=== 3. Petición a la web (puerto 3000) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" --connect-timeout 2 http://127.0.0.1:3000/ || echo "Fallo o timeout"

echo ""
echo "=== 4. Petición a la API (puerto 3001) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" --connect-timeout 2 http://127.0.0.1:3001/v1/ || echo "Fallo o timeout"

echo ""
echo "=== 5. Últimas líneas de logs cambios-web ==="
pm2 logs cambios-web --nostream --lines 20 2>/dev/null || echo "(sin logs)"

echo ""
echo "=== 6. Últimas líneas de logs cambios-api ==="
pm2 logs cambios-api --nostream --lines 20 2>/dev/null || echo "(sin logs)"

echo ""
echo "=== 7. ¿Existe build de la API? ==="
ls -la /srv/moreexchange/apps/api/dist/main.js 2>/dev/null || echo "No existe apps/api/dist/main.js — hay que hacer: pnpm build (o desde raíz: pnpm --filter @moreexchange/api build)"

echo ""
echo "=== 8. ¿Existe build de la web? ==="
ls -la /srv/moreexchange/apps/web/.next 2>/dev/null | head -5 || echo "No existe .next — hay que hacer: pnpm build en apps/web"

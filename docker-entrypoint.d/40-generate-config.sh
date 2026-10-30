#!/bin/sh
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"
API_URL="${VITE_API_BASE_URL:-http://localhost:8000/api}"

cat <<EOF > "$CONFIG_FILE"
// Dynamically generated at container boot from environment variable VITE_API_BASE_URL (.env)
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_URL}"
};
EOF

echo "[SPA] Injected runtime API_BASE_URL: ${API_URL} into ${CONFIG_FILE}"

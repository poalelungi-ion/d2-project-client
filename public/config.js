// Runtime configuration placeholder for development.
// In the production Nginx Docker container, /docker-entrypoint.d/40-generate-config.sh
// dynamically writes the container's VITE_API_BASE_URL from .env into this file at startup.
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};

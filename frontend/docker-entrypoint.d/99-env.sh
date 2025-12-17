#!/usr/bin/env sh
set -eu

ENV_JS="/usr/share/nginx/html/env.js"

cat >"${ENV_JS}" <<EOF
window.__ENV__ = {
  VITE_OPENWEATHERMAP_API_KEY: "${VITE_OPENWEATHERMAP_API_KEY:-}",
}
EOF

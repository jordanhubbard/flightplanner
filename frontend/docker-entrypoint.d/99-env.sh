#!/usr/bin/env sh
set -eu

ENV_JS="/usr/share/nginx/html/env.js"

owm_key="${VITE_OPENWEATHERMAP_API_KEY:-${OPENWEATHERMAP_API_KEY:-${OPENWEATHER_API_KEY:-}}}"

cat >"${ENV_JS}" <<EOF
window.__ENV__ = {
  VITE_OPENWEATHERMAP_API_KEY: "${owm_key}",
}
EOF

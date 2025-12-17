FROM node:20-alpine AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM nginx:1.27-alpine AS runtime

ENV BACKEND_HOST=backend \
    BACKEND_PORT=8000

COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/

COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY frontend/docker-entrypoint.d/99-env.sh /docker-entrypoint.d/99-env.sh
RUN chmod +x /docker-entrypoint.d/99-env.sh

EXPOSE 80

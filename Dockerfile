# ── 1. Compilar el front ───────────────────────────────────────────────
FROM node:22-alpine AS compilacion
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# URL de la API del trip (se fija al compilar)
ARG VITE_API_URL=http://localhost:5006
ENV VITE_API_URL=$VITE_API_URL
# El nginx de esta imagen reenvía /s3/ al bucket (en S3 + CloudFront no existe ese proxy)
ENV VITE_PROXY_S3=true
RUN npm run lint && npm test && npm run build

# ── 2. Servir con nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine
ENV NGINX_RESOLVER="1.1.1.1 8.8.8.8"
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=compilacion /app/dist /usr/share/nginx/html
EXPOSE 8095
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8095/ >/dev/null || exit 1

# Multi-stage: build React app, serve with Nginx

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# nginx.conf lives alongside this Dockerfile in the app/ build context
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S hackhub && adduser -S hackhub -G hackhub \
    && chown -R hackhub:hackhub /usr/share/nginx/html \
    && chown -R hackhub:hackhub /var/cache/nginx \
    && chown -R hackhub:hackhub /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown hackhub:hackhub /var/run/nginx.pid

USER hackhub
EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Build stage for main app
FROM node:20-alpine AS main-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Build stage for admin dashboard
FROM node:20-alpine AS admin-builder

WORKDIR /app/admin

# Copy admin dashboard source
COPY Admin-Dash/admin-dashboard/package*.json ./
RUN npm install

COPY Admin-Dash/admin-dashboard/ ./
RUN npm run build

# Production stage
FROM nginx:alpine

RUN apk add --no-cache openssl

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=IN/ST=State/L=City/O=HotelOrderBot/CN=localhost"

# Copy main app build
COPY --from=main-builder /app/dist /usr/share/nginx/html

# Copy admin dashboard build to /admin subdirectory
COPY --from=admin-builder /app/admin/dist /usr/share/nginx/html/admin

COPY frontend/nginx-ssl.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

# Usamos Node LTS
FROM node:20-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo dev para build)
RUN npm install

# Copiamos el resto del proyecto
COPY . .

# Build de Next.js
RUN npm run build

# ==================================================
# Stage final: imagen de producción más ligera
FROM node:20-alpine

WORKDIR /app

# Copiamos solo dependencias de producción
COPY package*.json ./
RUN npm install --production

# Copiamos el build desde el stage builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./  # opcional, útil para npm start

# Exponemos puerto
EXPOSE 3000

# Ejecutamos la app
CMD ["npm", "start"]

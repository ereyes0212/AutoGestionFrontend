# Usamos Node LTS
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install --production

# Copiamos el build de Next.js
COPY .next ./.next
COPY public ./public
COPY next.config.js ./

# Copiamos .env (si quieres que Docker lo use directamente, sino lo puedes montar)
# COPY .env .env

# Puerto que exponemos
EXPOSE 3000

# Comando para correr la app
CMD ["npm", "start"]

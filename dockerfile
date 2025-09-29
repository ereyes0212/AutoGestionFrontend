# ---------- STAGE: builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependencias completas (dev + prod)
COPY package*.json ./
RUN npm install

# Copia todo el proyecto (incluye prisma/schema.prisma)
COPY . .

# Genera el cliente de Prisma explícitamente (evita dependencia de postinstall)
# Solo si usas prisma; si tu package.json ya ejecuta prisma generate en postinstall,
# esto asegura que se ejecute en el builder.
RUN npx prisma generate || true

# Build de Next.js (genera .next)
RUN npm run build

# ---------- STAGE: runner (producción) ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Copiamos package.json para poder usar npm start metadata
COPY package*.json ./

# Copiamos node_modules desde el builder (tiene @prisma/client generado)
COPY --from=builder /app/node_modules ./node_modules

# Copiamos build y assets desde el builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Si necesitas archivos de prisma en runtime (no es obligatorio si copias node_modules),
# puedes copiarlos también:
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]

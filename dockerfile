# ---------- STAGE: builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependencias completas (dev + prod)
COPY package*.json ./
RUN npm install

# Copia todo el proyecto (incluye prisma/schema.prisma si lo tienes)
COPY . .

# Genera el cliente de Prisma si aplica (no falla si no existe)
RUN npx prisma generate || true

# Build de Next.js (genera .next)
RUN npm run build

# ---------- STAGE: runner (producción) ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Copiamos package.json para metadata
COPY package*.json ./

# Copiamos node_modules desde el builder (incluye @prisma/client generado)
COPY --from=builder /app/node_modules ./node_modules

# Copiamos build y assets desde el builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
# Si necesitas prisma runtime:
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]

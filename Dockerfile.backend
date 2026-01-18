# Multi-stage build para frontend
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Servidor backend con frontend estático
FROM node:18
WORKDIR /app

# Instalar backend
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --production

# Copiar archivos
COPY backend ./backend
COPY --from=builder /app/dist ./dist

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3333

# Exponer puertos
EXPOSE 3333

# Iniciar servidor
CMD ["node", "backend/server.js"]

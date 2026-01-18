#!/bin/bash
# Deploy automático en GoDaddy Cloud Hosting

set -e

echo "🚀 Iniciando deployment en GoDaddy..."

# Variables
DOMAIN=${1:-"ejemplo.com"}
WEB_DIR="/var/www/parlay-betting-platform"

# 1. Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

# 3. Instalar herramientas
echo "📦 Instalando Git, Nginx, PM2..."
sudo apt install -y git nginx
sudo npm install -g pm2

# 4. Clonar repositorio
echo "📁 Clonando repositorio..."
cd /var/www
sudo git clone https://github.com/fjchmoron17/parlay-betting-platform.git
cd parlay-betting-platform

# 5. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install
cd backend && npm install && cd ..

# 6. Build frontend
echo "🔨 Compilando frontend..."
npm run build

# 7. Crear .env
echo "⚙️ Configurando variables de entorno..."
sudo tee backend/.env > /dev/null << EOF
ODDS_API_KEY=e9b92b60bc4085d52d1d5f8c5b33bd4c
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
CORS_ORIGIN=https://${DOMAIN}
NODE_ENV=production
EOF

# 8. Configurar Nginx
echo "⚙️ Configurando Nginx..."
sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        root /var/www/parlay-betting-platform/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }

    location /api/ {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# 9. Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 10. Iniciar aplicación con PM2
echo "🚀 Iniciando aplicación..."
cd /var/www/parlay-betting-platform
pm2 start backend/server.js --name "parlay-api"
pm2 startup
pm2 save

# 11. Instalar SSL
echo "🔒 Instalando certificado SSL (Let's Encrypt)..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ${DOMAIN} -n --agree-tos --email admin@${DOMAIN} || true

echo ""
echo "✅ ¡Deployment completado!"
echo ""
echo "📍 Tu aplicación está en: https://${DOMAIN}"
echo "🔑 API disponible en: https://${DOMAIN}/api"
echo ""
echo "Comandos útiles:"
echo "  pm2 status          - Ver estado de la aplicación"
echo "  pm2 logs            - Ver logs en tiempo real"
echo "  pm2 restart all     - Reiniciar aplicación"
echo "  sudo systemctl restart nginx - Reiniciar Nginx"

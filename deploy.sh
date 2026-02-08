#!/bin/bash
# Deploy script para DigitalOcean/VPS

set -e

echo "🚀 Iniciando deployment..."

# 1. Actualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar Nginx
sudo apt-get install -y nginx

# 4. Instalar PM2
sudo npm install -g pm2

# 5. Clonar repositorio
cd /home/ubuntu
git clone https://github.com/fjchmoron17/parlay-betting-platform.git
cd parlay-betting-platform

# 6. Instalar dependencias
npm install
cd backend && npm install && cd ..

# 7. Build frontend
npm run build

# 8. Crear archivo .env para backend
cat > backend/.env << EOF
ODDS_API_KEY=${ODDS_API_KEY}
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
CORS_ORIGIN=https://$(hostname -I | awk '{print $1}')
NODE_ENV=production
EOF

# 9. Iniciar backend con PM2
pm2 start backend/server.js --name "parlay-api"
pm2 startup
pm2 save

# 10. Configurar Nginx
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Frontend (React)
    location / {
        root /home/ubuntu/parlay-betting-platform/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 11. Reiniciar Nginx
sudo systemctl restart nginx

echo "✅ ¡Deployment completado!"
echo "📍 Tu aplicación está en: http://$(hostname -I | awk '{print $1}')"

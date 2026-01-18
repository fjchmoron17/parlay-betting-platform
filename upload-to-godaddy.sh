#!/bin/bash
# Cargar archivos frontend a GoDaddy via FTP

FTP_HOST="your-godaddy-ftp-server.com"
FTP_USER="tu_usuario_ftp"
FTP_PASS="tu_contraseña_ftp"
FTP_REMOTE_DIR="/public_html/"
LOCAL_DIR="./dist"

echo "📤 Subiendo archivos a GoDaddy..."

# Crear .htaccess
cat > "${LOCAL_DIR}/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# Usar lftp para subir
lftp << FTP_COMMANDS
open -u ${FTP_USER},${FTP_PASS} ${FTP_HOST}
cd ${FTP_REMOTE_DIR}
mirror -R --delete ${LOCAL_DIR}/* .
quit
FTP_COMMANDS

echo "✅ ¡Subida completada!"
echo "📍 Tu sitio está en: https://tu_dominio.com"

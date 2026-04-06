#!/bin/bash
# EdgeBalancer Server Setup Script
# Run this ONCE on your Ubuntu VPS to configure sudo-free deployments
# Usage: bash server-setup.sh

set -e

echo "🚀 EdgeBalancer Server Setup"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}ERROR: Please run as regular user, not root!${NC}"
   echo "This script will use sudo when needed."
   exit 1
fi

echo -e "${GREEN}Step 1: Creating nginx config directory${NC}"
mkdir -p ~/nginx-configs
echo "✓ Created ~/nginx-configs"

echo ""
echo -e "${GREEN}Step 2: Creating nginx reload script${NC}"
cat > ~/nginx-reload.sh << 'EOF'
#!/bin/bash
# Nginx reload script - called by GitHub Actions
# This script signals nginx to reload without needing sudo

# Copy config from user directory to nginx config directory (via symlink)
echo "Nginx config updated via symlink"

# Signal nginx to reload using the wrapper service
systemctl --user start nginx-reload.service

echo "Nginx reload triggered successfully"
EOF

chmod +x ~/nginx-reload.sh
echo "✓ Created ~/nginx-reload.sh"

echo ""
echo -e "${GREEN}Step 3: Creating systemd user service for nginx reload${NC}"
mkdir -p ~/.config/systemd/user/

# Create systemd service that calls sudo (this is the only place sudo is configured)
cat > ~/.config/systemd/user/nginx-reload.service << 'EOF'
[Unit]
Description=Reload nginx configuration
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/sudo /bin/systemctl reload nginx

[Install]
WantedBy=default.target
EOF

echo "✓ Created systemd user service"

echo ""
echo -e "${GREEN}Step 4: Creating polkit rule for nginx reload${NC}"
sudo tee /etc/polkit-1/localauthority/50-local.d/nginx-reload.pkla > /dev/null << EOF
[Allow $USER to reload nginx]
Identity=unix-user:$USER
Action=org.freedesktop.systemd1.manage-units
ResultActive=yes
EOF

echo "✓ Created polkit rule"

echo ""
echo -e "${GREEN}Step 5: Configuring passwordless sudo for nginx reload${NC}"
echo -e "${YELLOW}Adding sudoers rule for nginx reload only...${NC}"
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx, /bin/systemctl restart nginx" | sudo tee /etc/sudoers.d/nginx-reload > /dev/null
sudo chmod 0440 /etc/sudoers.d/nginx-reload
echo "✓ Configured passwordless sudo for nginx reload"

echo ""
echo -e "${GREEN}Step 6: Creating symlink for nginx config${NC}"
# Create initial config if it doesn't exist
if [ ! -f ~/nginx-configs/edgebalancer.conf ]; then
    cat > ~/nginx-configs/edgebalancer.conf << 'EOF'
server {
    listen 80;
    server_name apiedge.nexoral.in;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    echo "✓ Created initial nginx config"
fi

# Create symlink (requires sudo)
if [ -f /etc/nginx/conf.d/edgebalancer.conf ]; then
    sudo rm /etc/nginx/conf.d/edgebalancer.conf
fi
sudo ln -s ~/nginx-configs/edgebalancer.conf /etc/nginx/conf.d/edgebalancer.conf
echo "✓ Created symlink: /etc/nginx/conf.d/edgebalancer.conf -> ~/nginx-configs/edgebalancer.conf"

echo ""
echo -e "${GREEN}Step 7: Testing nginx configuration${NC}"
sudo nginx -t
echo "✓ Nginx configuration is valid"

echo ""
echo -e "${GREEN}Step 8: Reloading nginx${NC}"
sudo systemctl reload nginx
echo "✓ Nginx reloaded"

echo ""
echo -e "${GREEN}Step 9: Reloading systemd user services${NC}"
systemctl --user daemon-reload
echo "✓ Systemd user services reloaded"

echo ""
echo -e "${GREEN}Step 10: Installing PM2 globally (if not installed)${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
    echo "✓ PM2 installed"
else
    echo "✓ PM2 already installed"
fi

echo ""
echo -e "${GREEN}Step 11: Configuring PM2 startup${NC}"
pm2 startup | tail -n 1 | bash || true
echo "✓ PM2 startup configured"

echo ""
echo -e "${GREEN}Step 12: Installing Certbot for SSL certificates${NC}"
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    echo "✓ Certbot installed"
else
    echo "✓ Certbot already installed"
fi

echo ""
echo -e "${GREEN}Step 13: Configuring Certbot auto-renewal${NC}"
# Create systemd timer for certificate renewal (more reliable than cron)
sudo tee /etc/systemd/system/certbot-renew.timer > /dev/null << 'EOF'
[Unit]
Description=Run Certbot renewal twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/certbot-renew.service > /dev/null << 'EOF'
[Unit]
Description=Certbot Renewal Service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

# Enable and start the timer
sudo systemctl daemon-reload
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
echo "✓ Certbot auto-renewal configured (runs twice daily)"

# Add passwordless sudo for certbot (needed by CI/CD)
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/certbot" | sudo tee -a /etc/sudoers.d/nginx-reload > /dev/null
sudo chmod 0440 /etc/sudoers.d/nginx-reload
echo "✓ Configured passwordless sudo for certbot"

echo ""
echo "=============================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=============================="
echo ""
echo "Your server is now configured for sudo-free deployments with automatic SSL!"
echo ""
echo "How it works:"
echo "  1. GitHub Actions copies nginx config to ~/nginx-configs/edgebalancer.conf"
echo "  2. Symlink automatically reflects changes in /etc/nginx/conf.d/"
echo "  3. Deployment calls ~/nginx-reload.sh to reload nginx (no sudo in CI/CD)"
echo "  4. PM2 manages the Node.js application"
echo "  5. Certbot automatically obtains and renews SSL certificates"
echo ""
echo "SSL Certificate Info:"
echo "  - Certbot auto-renewal runs twice daily (00:00 and 12:00)"
echo "  - Certificates auto-renew 30 days before expiration"
echo "  - GitHub Actions will obtain SSL cert on first config deployment"
echo ""
echo "Next steps:"
echo "  1. Ensure DNS A record points to this server (required for SSL)"
echo "  2. Configure GitHub Actions Variables (see DEPLOYMENT.md)"
echo "  3. Push changes to trigger deployment"
echo "  4. SSL certificate will be obtained automatically on first deployment"
echo "  5. Monitor deployment at: https://github.com/your-repo/actions"
echo ""
echo "Check certificate status:"
echo "  sudo certbot certificates"
echo ""
echo "Check auto-renewal timer:"
echo "  sudo systemctl status certbot-renew.timer"
echo ""

#!/bin/bash

# Social Media Video Downloader - DigitalOcean Droplet Setup Script
# Run this script on your DigitalOcean droplet to set up the environment

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up environment for Social Media Video Downloader...${NC}"

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
echo -e "${YELLOW}Installing Node.js...${NC}"
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v

# Install PM2 globally
echo -e "${YELLOW}Installing PM2...${NC}"
sudo npm install -g pm2

# Install Git
echo -e "${YELLOW}Installing Git...${NC}"
sudo apt-get install -y git

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install dependencies for Puppeteer
echo -e "${YELLOW}Installing dependencies for Puppeteer...${NC}"
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p ~/videodownloader

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/videodownloader > /dev/null << EOF
server {
    listen 80;
    server_name 139.59.15.4;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the Nginx configuration
sudo ln -s /etc/nginx/sites-available/videodownloader /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}Environment setup completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Clone your repository: ${GREEN}git clone https://github.com/yourusername/videodownloader.git ~/videodownloader${NC}"
echo -e "2. Install dependencies: ${GREEN}cd ~/videodownloader && npm install${NC}"
echo -e "3. Start the application: ${GREEN}pm2 start server.js --name videodownloader${NC}"
echo -e "4. Configure PM2 to start on boot: ${GREEN}pm2 startup && pm2 save${NC}"

exit 0 
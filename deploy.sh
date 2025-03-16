#!/bin/bash

# Social Media Video Downloader Deployment Script
# This script helps deploy the application to a DigitalOcean droplet

# Configuration - Change these variables
DROPLET_IP="139.59.15.4"
SSH_USER="Namir-AI"
APP_DIR="/home/Namir-AI/videodownloader"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to DigitalOcean droplet...${NC}"

# 1. Push changes to GitHub
echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
git add .
git commit -m "Deployment update $(date)"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push changes to GitHub. Aborting deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully pushed changes to GitHub.${NC}"

# 2. SSH into the droplet and pull changes
echo -e "${YELLOW}Connecting to droplet and updating application...${NC}"
ssh $SSH_USER@$DROPLET_IP << EOF
    cd $APP_DIR
    echo "Pulling latest changes from GitHub..."
    git pull origin main
    
    echo "Installing dependencies..."
    npm install
    
    echo "Restarting application with PM2..."
    pm2 restart videodownloader || pm2 start server.js --name videodownloader
    
    echo "Checking application status..."
    pm2 status videodownloader
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. Check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Your application should now be running at http://$DROPLET_IP${NC}"
echo -e "${YELLOW}To check logs, SSH into your droplet and run: pm2 logs videodownloader${NC}"

exit 0 
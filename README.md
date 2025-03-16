# Social Media Video Downloader

A web application for downloading videos from various social media platforms including Facebook, Instagram, and X (formerly Twitter).

## Features
- Support for multiple social media platforms:
  - Facebook
  - Instagram
  - Twitter/X
- Video thumbnail preview
- Progress tracking
- Responsive design
- Ad-ready spaces for monetization
- SEO optimized

## Local Development Setup
1. Install Node.js if you haven't already (https://nodejs.org/) - version 16 or higher
2. Clone this repository:
```bash
git clone https://github.com/yourusername/videodownloader.git
cd videodownloader
```
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm run dev
```
5. Open http://localhost:3000 in your browser

## Deployment to DigitalOcean Droplet

### Current Deployment
This application is currently deployed on a DigitalOcean droplet with the following details:
- IP Address: 139.59.15.4
- Username: Namir-AI

### Prerequisites
- A DigitalOcean account
- A Droplet with Ubuntu 20.04 or newer
- Domain name (optional but recommended)

### Initial Server Setup
1. SSH into your Droplet:
```bash
ssh Namir-AI@139.59.15.4
```

2. Create a new user with sudo privileges (optional but recommended):
```bash
adduser username
usermod -aG sudo username
```

3. Switch to the new user:
```bash
su - username
```

4. Install Node.js and npm:
```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

5. Install PM2 globally (for process management):
```bash
sudo npm install -g pm2
```

6. Install Git:
```bash
sudo apt-get install git
```

### Deploying the Application
1. Clone the repository:
```bash
git clone https://github.com/yourusername/videodownloader.git
cd videodownloader
```

2. Install dependencies:
```bash
npm install
```

3. Start the application with PM2:
```bash
pm2 start server.js --name videodownloader
```

4. Configure PM2 to start on system boot:
```bash
pm2 startup
```
(Follow the instructions provided by the command)

5. Save the PM2 process list:
```bash
pm2 save
```

### Setting up Nginx as a Reverse Proxy
1. Install Nginx:
```bash
sudo apt-get install nginx
```

2. Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/videodownloader
```

3. Add the following configuration (replace yourdomain.com with your domain or server IP):
```nginx
server {
    listen 80;
    server_name 139.59.15.4;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Create a symbolic link to enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/videodownloader /etc/nginx/sites-enabled/
```

5. Test Nginx configuration:
```bash
sudo nginx -t
```

6. Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Setting up SSL with Let's Encrypt (Optional but Recommended)
1. Install Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. Follow the prompts to complete the setup.

### Updating the Application
To update the application with the latest changes from GitHub:

1. Navigate to the application directory:
```bash
cd ~/videodownloader
```

2. Pull the latest changes:
```bash
git pull origin main
```

3. Install any new dependencies:
```bash
npm install
```

4. Restart the application:
```bash
pm2 restart videodownloader
```

### Quick Deployment
You can also use the included deployment script to quickly deploy changes:

1. Update the configuration in `deploy.sh` with your GitHub repository information
2. Run the deployment script:
```bash
./deploy.sh
```

## Ad Integration
The website includes multiple ad placement zones:
- Header ad section
- Sidebar ad section
- Content bottom ad section
- Footer ad section

The Google AdSense code is already integrated. Make sure to update the ad slot IDs with your actual ad slot IDs.

## Project Structure
```
videodownloader/
├── css/
│   └── style.css
├── js/
│   └── main.js
├── logs/
│   └── access.log
├── index.html
├── server.js
├── package.json
└── README.md
```

## Troubleshooting
- If the application doesn't work, check the logs:
```bash
pm2 logs videodownloader
```

- If you encounter issues with Puppeteer on the server, you might need to install additional dependencies:
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

# Deployment Guide for Social Media Video Downloader

This guide will help you deploy your Social Media Video Downloader application to GitHub and then to your DigitalOcean droplet.

## 1. Deploying to GitHub

### If you don't have a GitHub repository yet:

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name your repository (e.g., "videodownloader")
   - Choose public or private visibility
   - Click "Create repository"

2. Initialize your local repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/videodownloader.git
   git push -u origin main
   ```

### If you already have a GitHub repository:

1. Add your changes:
   ```bash
   git add .
   ```

2. Commit your changes:
   ```bash
   git commit -m "Updated video downloader application"
   ```

3. Push to GitHub:
   ```bash
   git push origin main
   ```

## 2. Deploying to DigitalOcean Droplet

### First-time setup:

1. SSH into your DigitalOcean droplet:
   ```bash
   ssh Namir-AI@139.59.15.4
   ```

2. Upload the setup script to your droplet:
   ```bash
   # From your local machine
   scp setup-droplet.sh Namir-AI@139.59.15.4:~/
   ```

3. Run the setup script on your droplet:
   ```bash
   # On your droplet
   chmod +x ~/setup-droplet.sh
   ~/setup-droplet.sh
   ```

4. Clone your GitHub repository:
   ```bash
   git clone https://github.com/yourusername/videodownloader.git ~/videodownloader
   ```

5. Install dependencies:
   ```bash
   cd ~/videodownloader
   npm install
   ```

6. Start the application with PM2:
   ```bash
   pm2 start server.js --name videodownloader
   ```

7. Configure PM2 to start on boot:
   ```bash
   pm2 startup
   # Run the command that PM2 outputs
   pm2 save
   ```

### Updating the application:

#### Method 1: Using the deployment script

1. Update the `deploy.sh` script with your GitHub repository URL
2. Run the deployment script from your local machine:
   ```bash
   ./deploy.sh
   ```

#### Method 2: Manual update

1. SSH into your DigitalOcean droplet:
   ```bash
   ssh Namir-AI@139.59.15.4
   ```

2. Navigate to your application directory:
   ```bash
   cd ~/videodownloader
   ```

3. Pull the latest changes:
   ```bash
   git pull origin main
   ```

4. Install any new dependencies:
   ```bash
   npm install
   ```

5. Restart the application:
   ```bash
   pm2 restart videodownloader
   ```

## 3. Troubleshooting

### Check application logs:
```bash
pm2 logs videodownloader
```

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Check if the application is running:
```bash
pm2 status
```

### Test the application:
Open your browser and navigate to http://139.59.15.4

## 4. Additional Configuration

### Setting up a domain name:

1. Update your Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/videodownloader
   ```

2. Change the server_name to your domain:
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

3. Save and exit, then restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ``` 
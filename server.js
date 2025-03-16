const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Create a write stream for logging
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// Custom logger middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.url}\n`;
    accessLogStream.write(logMessage);
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let browser = null;
let browserStartAttempts = 0;
const MAX_BROWSER_START_ATTEMPTS = 3;

// Initialize browser with proper configuration for server environment
async function initBrowser() {
    if (browser) {
        try {
            // Check if browser is still usable
            const pages = await browser.pages();
            return browser;
        } catch (error) {
            console.log('Browser instance crashed, restarting...');
            browser = null;
        }
    }
    
    if (browserStartAttempts >= MAX_BROWSER_START_ATTEMPTS) {
        console.error('Maximum browser start attempts reached. Waiting before trying again.');
        browserStartAttempts = 0;
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
    }
    
    try {
        browserStartAttempts++;
        console.log(`Starting browser (attempt ${browserStartAttempts})...`);
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        
        // Reset attempts counter on success
        browserStartAttempts = 0;
        
        // Set up browser close handler
        browser.on('disconnected', () => {
            console.log('Browser disconnected');
            browser = null;
        });
        
        return browser;
    } catch (error) {
        console.error('Failed to start browser:', error);
        throw error;
    }
}

// Custom headers for requests
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive'
};

async function extractFacebookVideo(url) {
    let page = null;
    try {
        console.log('Extracting Facebook video from:', url);
        const browser = await initBrowser();
        page = await browser.newPage();
        
        // Set user agent and viewport
        await page.setUserAgent(headers['User-Agent']);
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Enable request interception to capture video URLs
        await page.setRequestInterception(true);
        
        let videoUrl = null;
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('.mp4') && url.includes('fbcdn.net')) {
                videoUrl = url;
                console.log('Found Facebook video URL:', videoUrl);
            }
            request.continue();
        });
        
        // Navigate to the Facebook video page with timeout
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for video element or fallback to meta tags
        try {
            await page.waitForSelector('video', { timeout: 5000 });
        } catch (err) {
            console.log('Video element not found, trying alternative methods');
        }
        
        // Extract video information
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            const videoSrc = video ? video.src : null;
            
            // Try to get title from various elements
            let title = document.querySelector('title')?.innerText || 'Facebook Video';
            
            // Try to get thumbnail from meta tags
            const thumbnail = document.querySelector('meta[property="og:image"]')?.content || '';
            
            return {
                url: videoSrc,
                title: title,
                thumbnail: thumbnail
            };
        });
        
        // If we found a video URL through request interception, use that
        if (videoUrl) {
            videoData.url = videoUrl;
        }
        
        if (!videoData.url) {
            throw new Error('Could not extract video URL from Facebook');
        }
        
        console.log('Successfully extracted Facebook video data');
        return videoData;
    } catch (error) {
        console.error('Facebook extraction error:', error);
        throw error;
    } finally {
        if (page) {
            await page.close().catch(err => console.error('Error closing page:', err));
        }
    }
}

async function extractInstagramVideo(url) {
    let page = null;
    try {
        console.log('Extracting Instagram video from:', url);
        const browser = await initBrowser();
        page = await browser.newPage();
        
        // Set user agent and viewport
        await page.setUserAgent(headers['User-Agent']);
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Enable request interception to capture video URLs
        await page.setRequestInterception(true);
        
        let videoUrl = null;
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('.mp4') && url.includes('cdninstagram.com')) {
                videoUrl = url;
                console.log('Found Instagram video URL:', videoUrl);
            }
            request.continue();
        });
        
        // Navigate to the Instagram post with timeout
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for video element or fallback
        try {
            await page.waitForSelector('video', { timeout: 5000 });
        } catch (err) {
            console.log('Video element not found, trying alternative methods');
        }
        
        // Extract video information
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            const videoSrc = video ? video.src : null;
            
            // Try to get thumbnail from meta tags
            const thumbnail = document.querySelector('meta[property="og:image"]')?.content || '';
            
            return {
                url: videoSrc,
                title: 'Instagram Video',
                thumbnail: thumbnail
            };
        });
        
        // If we found a video URL through request interception, use that
        if (videoUrl) {
            videoData.url = videoUrl;
        }
        
        if (!videoData.url) {
            throw new Error('Could not extract video URL from Instagram');
        }
        
        console.log('Successfully extracted Instagram video data');
        return videoData;
    } catch (error) {
        console.error('Instagram extraction error:', error);
        throw error;
    } finally {
        if (page) {
            await page.close().catch(err => console.error('Error closing page:', err));
        }
    }
}

async function extractTwitterVideo(url) {
    let page = null;
    try {
        console.log('Extracting Twitter/X video from:', url);
        const browser = await initBrowser();
        page = await browser.newPage();
        
        // Set user agent and viewport
        await page.setUserAgent(headers['User-Agent']);
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Enable request interception to capture video URLs
        await page.setRequestInterception(true);
        
        let videoUrl = null;
        
        page.on('request', request => {
            const url = request.url();
            if (url.includes('.mp4') && (url.includes('video.twimg.com') || url.includes('video.x.com'))) {
                videoUrl = url;
                console.log('Found Twitter/X video URL:', videoUrl);
            }
            request.continue();
        });
        
        // Navigate to the Twitter post with timeout
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for video element or fallback
        try {
            await page.waitForSelector('video', { timeout: 5000 });
        } catch (err) {
            console.log('Video element not found, trying alternative methods');
        }
        
        // Extract video information
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            const videoSrc = video ? video.src : null;
            
            // Try to get thumbnail from meta tags
            const thumbnail = document.querySelector('meta[property="og:image"]')?.content || '';
            
            return {
                url: videoSrc,
                title: 'X Video',
                thumbnail: thumbnail
            };
        });
        
        // If we found a video URL through request interception, use that
        if (videoUrl) {
            videoData.url = videoUrl;
        }
        
        if (!videoData.url) {
            throw new Error('Could not extract video URL from Twitter/X');
        }
        
        console.log('Successfully extracted Twitter/X video data');
        return videoData;
    } catch (error) {
        console.error('Twitter/X extraction error:', error);
        throw error;
    } finally {
        if (page) {
            await page.close().catch(err => console.error('Error closing page:', err));
        }
    }
}

// Routes
app.post('/api/parse', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('Parsing URL:', url);
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        let videoInfo = {
            title: 'Unknown',
            duration: 'Unknown',
            quality: 'HD',
            url: url
        };

        if (url.includes('facebook.com')) {
            try {
                const data = await extractFacebookVideo(url);
                videoInfo = {
                    ...videoInfo,
                    title: data.title || 'Facebook Video',
                    platform: 'facebook',
                    directUrl: data.url,
                    thumbnail: data.thumbnail
                };
            } catch (err) {
                console.error('Facebook parse error:', err.message);
                return res.status(500).json({ error: 'Failed to parse Facebook video: ' + err.message });
            }
        } else if (url.includes('instagram.com')) {
            try {
                const data = await extractInstagramVideo(url);
                videoInfo = {
                    ...videoInfo,
                    title: data.title || 'Instagram Video',
                    platform: 'instagram',
                    directUrl: data.url,
                    thumbnail: data.thumbnail
                };
            } catch (err) {
                console.error('Instagram parse error:', err.message);
                return res.status(500).json({ error: 'Failed to parse Instagram video: ' + err.message });
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                const data = await extractTwitterVideo(url);
                videoInfo = {
                    ...videoInfo,
                    title: data.title || 'X Video',
                    platform: 'twitter',
                    directUrl: data.url,
                    thumbnail: data.thumbnail
                };
            } catch (err) {
                console.error('Twitter parse error:', err.message);
                return res.status(500).json({ error: 'Failed to parse Twitter/X video: ' + err.message });
            }
        } else {
            return res.status(400).json({ error: 'Unsupported platform. We currently support Facebook, Instagram, and Twitter/X.' });
        }

        console.log('Video info:', videoInfo);
        res.json(videoInfo);
    } catch (error) {
        console.error('Parse error:', error.message);
        res.status(500).json({ error: 'Failed to parse video information: ' + error.message });
    }
});

app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('Download request for URL:', url);
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        let videoUrl = null;
        let filename = 'video.mp4';
        
        if (url.includes('facebook.com')) {
            try {
                const data = await extractFacebookVideo(url);
                videoUrl = data.url;
                filename = 'facebook_video.mp4';
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }
            } catch (err) {
                console.error('Facebook download error:', err.message);
                return res.status(500).json({ error: 'Failed to download Facebook video: ' + err.message });
            }
        } else if (url.includes('instagram.com')) {
            try {
                const data = await extractInstagramVideo(url);
                videoUrl = data.url;
                filename = 'instagram_video.mp4';
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }
            } catch (err) {
                console.error('Instagram download error:', err.message);
                return res.status(500).json({ error: 'Failed to download Instagram video: ' + err.message });
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                const data = await extractTwitterVideo(url);
                videoUrl = data.url;
                filename = 'twitter_video.mp4';
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }
            } catch (err) {
                console.error('Twitter download error:', err.message);
                return res.status(500).json({ error: 'Failed to download Twitter/X video: ' + err.message });
            }
        } else {
            return res.status(400).json({ error: 'Unsupported platform' });
        }

        try {
            console.log('Downloading video from URL:', videoUrl);
            const response = await axios({
                method: 'GET',
                url: videoUrl,
                responseType: 'stream',
                headers: headers,
                timeout: 30000
            });

            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            response.data.pipe(res);
        } catch (err) {
            console.error('Download stream error:', err.message);
            return res.status(500).json({ error: 'Failed to download video stream: ' + err.message });
        }
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: 'Failed to download video: ' + error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Cleanup on server shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Closing browser and shutting down...');
    if (browser) {
        await browser.close().catch(err => console.error('Error closing browser:', err));
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Closing browser and shutting down...');
    if (browser) {
        await browser.close().catch(err => console.error('Error closing browser:', err));
    }
    process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).json({ error: 'Something broke! ' + err.message });
});

// Start server
app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    // Initialize browser on server start
    try {
        await initBrowser();
        console.log('Browser initialized successfully');
    } catch (error) {
        console.error('Failed to initialize browser:', error);
    }
});

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let browser = null;

// Initialize browser with proper configuration for server environment
async function initBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        });
    }
    return browser;
}

// Custom headers for requests
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive'
};

async function extractFacebookVideo(url) {
    try {
        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.setUserAgent(headers['User-Agent']);
        
        // Navigate to the Facebook video page
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        // Wait for video element
        await page.waitForSelector('video');
        
        // Extract video information
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            const videoUrl = video ? video.src : null;
            const title = document.querySelector('title').innerText;
            const thumbnail = document.querySelector('meta[property="og:image"]')?.content;
            
            return {
                url: videoUrl,
                title: title,
                thumbnail: thumbnail
            };
        });
        
        await page.close();
        return videoData;
    } catch (error) {
        console.error('Facebook extraction error:', error);
        throw error;
    }
}

async function extractInstagramVideo(url) {
    try {
        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.setUserAgent(headers['User-Agent']);
        
        // Navigate to the Instagram post
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        // Wait for video element
        await page.waitForSelector('video');
        
        // Extract video information
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            const videoUrl = video ? video.src : null;
            const thumbnail = document.querySelector('meta[property="og:image"]')?.content;
            
            return {
                url: videoUrl,
                title: 'Instagram Video',
                thumbnail: thumbnail
            };
        });
        
        await page.close();
        return videoData;
    } catch (error) {
        console.error('Instagram extraction error:', error);
        throw error;
    }
}

async function extractTwitterVideo(url) {
    try {
        const browser = await initBrowser();
        const page = await browser.newPage();
        await page.setUserAgent(headers['User-Agent']);
        
        // Navigate to the Twitter post
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        // Wait for video element
        await page.waitForSelector('video');
        
        // Extract video information
        const videoData = await page.evaluate(() => {
            const video = document.querySelector('video');
            const videoUrl = video ? video.src : null;
            const thumbnail = document.querySelector('meta[property="og:image"]')?.content;
            
            return {
                url: videoUrl,
                title: 'X Video',
                thumbnail: thumbnail
            };
        });
        
        await page.close();
        return videoData;
    } catch (error) {
        console.error('Twitter extraction error:', error);
        throw error;
    }
}

// Routes
app.post('/api/parse', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('Parsing URL:', url);
        
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
                videoInfo.title = 'Facebook Video';
                videoInfo.platform = 'facebook';
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
                videoInfo.title = 'Instagram Video';
                videoInfo.platform = 'instagram';
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
                videoInfo.title = 'X Video';
                videoInfo.platform = 'twitter';
            }
        }

        console.log('Video info:', videoInfo);
        res.json(videoInfo);
    } catch (error) {
        console.error('Parse error:', error.message);
        res.status(500).json({ error: 'Failed to parse video information' });
    }
});

app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('Download request for URL:', url);
        let videoUrl = null;
        
        if (url.includes('facebook.com')) {
            try {
                const data = await extractFacebookVideo(url);
                videoUrl = data.url;
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }

                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream',
                    headers: headers
                });

                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=facebook_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Facebook download error:', err.message);
                res.status(500).json({ error: 'Failed to download Facebook video' });
            }
        } else if (url.includes('instagram.com')) {
            try {
                const data = await extractInstagramVideo(url);
                videoUrl = data.url;
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }

                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream',
                    headers: headers
                });

                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=instagram_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Instagram download error:', err.message);
                res.status(500).json({ error: 'Failed to download Instagram video' });
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                const data = await extractTwitterVideo(url);
                videoUrl = data.url;
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }

                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream',
                    headers: headers
                });

                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=twitter_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Twitter download error:', err.message);
                res.status(500).json({ error: 'Failed to download Twitter video' });
            }
        } else {
            res.status(400).json({ error: 'Unsupported platform' });
        }
    } catch (error) {
        console.error('Download error:', error.message);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

// Cleanup on server shutdown
process.on('SIGINT', async () => {
    if (browser) {
        await browser.close();
    }
    process.exit();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).json({ error: 'Something broke!' });
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

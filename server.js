const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const instagramGetUrl = require("instagram-url-direct");
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Custom headers for requests
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

// Utility function to extract video URL from webpage
async function extractVideoUrl(url, platform) {
    try {
        console.log(`Attempting to extract ${platform} video from: ${url}`);
        const response = await axios.get(url, { headers });
        console.log(`Got response from ${platform}, status: ${response.status}`);
        
        const $ = cheerio.load(response.data);
        let videoUrl = '';

        if (platform === 'facebook') {
            // Try multiple selectors for Facebook videos
            videoUrl = $('meta[property="og:video:url"]').attr('content') ||
                      $('meta[property="og:video"]').attr('content') ||
                      $('meta[property="og:video:secure_url"]').attr('content') ||
                      $('video').attr('src');
                      
            console.log('Found Facebook video URL:', videoUrl);
        } else if (platform === 'twitter') {
            // Try multiple selectors for Twitter videos
            videoUrl = $('meta[property="og:video:url"]').attr('content') ||
                      $('meta[property="og:video"]').attr('content') ||
                      $('meta[property="twitter:player:stream"]').attr('content') ||
                      $('video').attr('src');
                      
            console.log('Found Twitter video URL:', videoUrl);
        }

        if (!videoUrl) {
            console.log(`No video URL found in ${platform} page`);
            // Log all meta tags for debugging
            $('meta').each((i, elem) => {
                console.log(`Meta tag: ${$(elem).attr('property')} = ${$(elem).attr('content')}`);
            });
        }

        return videoUrl;
    } catch (error) {
        console.error(`Error extracting ${platform} video URL:`, error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        return null;
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
                const videoUrl = await extractVideoUrl(url, 'facebook');
                videoInfo.title = 'Facebook Video';
                videoInfo.platform = 'facebook';
                videoInfo.directUrl = videoUrl;
                const $ = cheerio.load((await axios.get(url, { headers })).data);
                videoInfo.thumbnail = $('meta[property="og:image"]').attr('content');
            } catch (err) {
                console.error('Facebook parse error:', err.message);
                videoInfo.title = 'Facebook Video';
                videoInfo.platform = 'facebook';
            }
        } else if (url.includes('instagram.com')) {
            try {
                console.log('Fetching Instagram video info');
                const igResult = await instagramGetUrl(url);
                console.log('Instagram API response:', igResult);
                
                if (igResult.url_list && igResult.url_list.length > 0) {
                    videoInfo.title = 'Instagram Video';
                    videoInfo.platform = 'instagram';
                    videoInfo.directUrl = igResult.url_list[0];
                    videoInfo.thumbnail = igResult.thumbnail_url;
                    console.log('Found Instagram video URL:', videoInfo.directUrl);
                } else {
                    console.log('No Instagram video URLs found');
                }
            } catch (err) {
                console.error('Instagram parse error:', err.message);
                videoInfo.title = 'Instagram Video';
                videoInfo.platform = 'instagram';
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                const videoUrl = await extractVideoUrl(url, 'twitter');
                videoInfo.title = 'X Video';
                videoInfo.platform = 'twitter';
                videoInfo.directUrl = videoUrl;
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
                videoUrl = await extractVideoUrl(url, 'facebook');
                if (!videoUrl) {
                    console.error('No Facebook video URL found');
                    throw new Error('No downloadable URL found');
                }

                console.log('Attempting to download Facebook video from:', videoUrl);
                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream',
                    headers: headers,
                    maxRedirects: 5
                });

                console.log('Facebook video download response headers:', response.headers);
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=facebook_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Facebook download error:', err.message);
                if (err.response) {
                    console.error('Response status:', err.response.status);
                    console.error('Response headers:', err.response.headers);
                }
                res.status(500).json({ error: 'Failed to download Facebook video' });
            }
        } else if (url.includes('instagram.com')) {
            try {
                console.log('Fetching Instagram video URL');
                const igResult = await instagramGetUrl(url);
                if (igResult.url_list && igResult.url_list.length > 0) {
                    console.log('Found Instagram video URL:', igResult.url_list[0]);
                    const response = await axios({
                        method: 'GET',
                        url: igResult.url_list[0],
                        responseType: 'stream',
                        headers: headers,
                        maxRedirects: 5
                    });

                    console.log('Instagram video download response headers:', response.headers);
                    res.setHeader('Content-Type', 'video/mp4');
                    res.setHeader('Content-Disposition', 'attachment; filename=instagram_video.mp4');
                    response.data.pipe(res);
                } else {
                    console.error('No Instagram video URLs found');
                    throw new Error('No downloadable URL found');
                }
            } catch (err) {
                console.error('Instagram download error:', err.message);
                if (err.response) {
                    console.error('Response status:', err.response.status);
                    console.error('Response headers:', err.response.headers);
                }
                res.status(500).json({ error: 'Failed to download Instagram video' });
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                videoUrl = await extractVideoUrl(url, 'twitter');
                if (!videoUrl) {
                    console.error('No Twitter video URL found');
                    throw new Error('No downloadable URL found');
                }

                console.log('Attempting to download Twitter video from:', videoUrl);
                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream',
                    headers: headers,
                    maxRedirects: 5
                });

                console.log('Twitter video download response headers:', response.headers);
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=twitter_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Twitter download error:', err.message);
                if (err.response) {
                    console.error('Response status:', err.response.status);
                    console.error('Response headers:', err.response.headers);
                }
                res.status(500).json({ error: 'Failed to download Twitter video' });
            }
        } else {
            res.status(400).json({ error: 'Unsupported platform' });
        }
    } catch (error) {
        console.error('Download error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        res.status(500).json({ error: 'Failed to download video' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

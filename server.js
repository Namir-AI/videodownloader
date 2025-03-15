const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const instagramGetUrl = require("instagram-url-direct");
const fbDownloader = require('fb-video-downloader');
const twitterUrlDirect = require('twitter-url-direct');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.post('/api/parse', async (req, res) => {
    try {
        const { url } = req.body;
        
        // Basic video info object
        let videoInfo = {
            title: 'Unknown',
            duration: 'Unknown',
            quality: 'HD',
            url: url
        };

        if (url.includes('facebook.com')) {
            try {
                const fbInfo = await fbDownloader.getInfo(url);
                videoInfo.title = fbInfo.title || 'Facebook Video';
                videoInfo.platform = 'facebook';
                videoInfo.thumbnail = fbInfo.thumbnail;
                videoInfo.quality = fbInfo.quality || 'HD';
            } catch (err) {
                console.error('Facebook parse error:', err);
                videoInfo.title = 'Facebook Video';
                videoInfo.platform = 'facebook';
            }
        } else if (url.includes('instagram.com')) {
            try {
                const igResult = await instagramGetUrl(url);
                if (igResult.url_list.length > 0) {
                    videoInfo.title = 'Instagram Video';
                    videoInfo.platform = 'instagram';
                    videoInfo.directUrl = igResult.url_list[0];
                    videoInfo.thumbnail = igResult.thumbnail_url;
                }
            } catch (err) {
                console.error('Instagram parse error:', err);
                videoInfo.title = 'Instagram Video';
                videoInfo.platform = 'instagram';
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                const twitterInfo = await twitterUrlDirect(url);
                videoInfo.title = 'X Video';
                videoInfo.platform = 'twitter';
                videoInfo.quality = twitterInfo.quality || 'HD';
                videoInfo.thumbnail = twitterInfo.thumbnail;
            } catch (err) {
                console.error('Twitter parse error:', err);
                videoInfo.title = 'X Video';
                videoInfo.platform = 'twitter';
            }
        }

        res.json(videoInfo);
    } catch (error) {
        console.error('Parse error:', error);
        res.status(500).json({ error: 'Failed to parse video information' });
    }
});

app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (url.includes('facebook.com')) {
            try {
                const fbInfo = await fbDownloader.getInfo(url);
                const videoUrl = fbInfo.download_url || fbInfo.sd_url || fbInfo.hd_url;
                
                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }

                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream'
                });

                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=facebook_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Facebook download error:', err);
                res.status(500).json({ error: 'Failed to download Facebook video' });
            }
        } else if (url.includes('instagram.com')) {
            try {
                const igResult = await instagramGetUrl(url);
                if (igResult.url_list.length > 0) {
                    const response = await axios({
                        method: 'GET',
                        url: igResult.url_list[0],
                        responseType: 'stream'
                    });

                    res.setHeader('Content-Type', 'video/mp4');
                    res.setHeader('Content-Disposition', 'attachment; filename=instagram_video.mp4');
                    response.data.pipe(res);
                } else {
                    throw new Error('No downloadable URL found');
                }
            } catch (err) {
                console.error('Instagram download error:', err);
                res.status(500).json({ error: 'Failed to download Instagram video' });
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            try {
                const twitterInfo = await twitterUrlDirect(url);
                const videoUrl = twitterInfo.download_url;

                if (!videoUrl) {
                    throw new Error('No downloadable URL found');
                }

                const response = await axios({
                    method: 'GET',
                    url: videoUrl,
                    responseType: 'stream'
                });

                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', 'attachment; filename=twitter_video.mp4');
                response.data.pipe(res);
            } catch (err) {
                console.error('Twitter download error:', err);
                res.status(500).json({ error: 'Failed to download Twitter video' });
            }
        } else {
            res.status(400).json({ error: 'Unsupported platform' });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download video' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

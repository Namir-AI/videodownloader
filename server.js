const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const instagramGetUrl = require("instagram-url-direct");
const path = require('path');

const app = express();
const port = 3000;

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
            quality: 'HD'
        };

        if (url.includes('facebook.com')) {
            // Facebook video parsing logic
            videoInfo.title = 'Facebook Video';
            videoInfo.platform = 'facebook';
        } else if (url.includes('instagram.com')) {
            // Instagram video parsing logic
            const igResult = await instagramGetUrl(url);
            if (igResult.url_list.length > 0) {
                videoInfo.title = 'Instagram Video';
                videoInfo.platform = 'instagram';
                videoInfo.directUrl = igResult.url_list[0];
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            // X/Twitter video parsing logic
            videoInfo.title = 'X Video';
            videoInfo.platform = 'twitter';
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
        
        // Handle different platforms
        if (url.includes('facebook.com')) {
            // Facebook download logic
            // Note: Actual implementation would require Facebook API or a specialized library
            res.status(501).json({ error: 'Facebook downloads temporarily unavailable' });
        } else if (url.includes('instagram.com')) {
            // Instagram download logic
            const igResult = await instagramGetUrl(url);
            if (igResult.url_list.length > 0) {
                const videoResponse = await fetch(igResult.url_list[0]);
                const buffer = await videoResponse.buffer();
                res.send(buffer);
            } else {
                throw new Error('No downloadable URL found');
            }
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            // X/Twitter download logic
            // Note: Actual implementation would require Twitter API or a specialized library
            res.status(501).json({ error: 'X/Twitter downloads temporarily unavailable' });
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

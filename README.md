# Social Media Video Downloader

A web application for downloading videos from various social media platforms including Facebook, Instagram, and X (formerly Twitter).

## Features
- Support for multiple social media platforms
- Progress tracking
- Responsive design
- Ad-ready spaces for monetization
- SEO optimized

## Setup
1. Install Node.js if you haven't already (https://nodejs.org/)
2. Install dependencies:
```bash
npm install
```
3. Start the server:
```bash
npm start
```
4. Open http://localhost:3000 in your browser

## Project Structure
```
videodownloader/
├── css/
│   └── style.css
├── js/
│   └── main.js
├── index.html
├── server.js
├── package.json
└── README.md
```

## Dependencies
- Express.js - Web server framework
- CORS - Cross-origin resource sharing
- ytdl-core - Video downloading utility
- instagram-url-direct - Instagram video URL extractor
- node-fetch - Fetch API for Node.js

## Ad Integration
The website includes multiple ad placement zones:
- Header ad section
- Sidebar ad section
- Content bottom ad section
- Footer ad section

To integrate Google AdSense, replace the placeholder ad divs with your AdSense code.

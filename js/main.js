// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const parseBtn = document.getElementById('parseBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = progressSection.querySelector('.progress-bar');
const resultSection = document.getElementById('resultSection');
const videoDetails = document.getElementById('videoDetails');
const downloadBtn = document.getElementById('downloadBtn');
const buttonText = parseBtn.querySelector('.button-text');
const spinner = parseBtn.querySelector('.spinner-border');

// Event Listeners
parseBtn.addEventListener('click', handleParse);
downloadBtn.addEventListener('click', handleDownload);
videoUrlInput.addEventListener('input', validateInput);

// Validate URL input
function validateInput() {
    const url = videoUrlInput.value.trim();
    parseBtn.disabled = !isValidUrl(url);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return url.includes('facebook.com') || 
               url.includes('instagram.com') || 
               url.includes('twitter.com') ||
               url.includes('x.com');
    } catch {
        return false;
    }
}

// Handle Parse Button Click
async function handleParse() {
    const url = videoUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter a valid URL');
        return;
    }

    // Show loading state
    setLoadingState(true);
    progressSection.classList.remove('d-none');
    resultSection.classList.add('d-none');

    try {
        // Simulate progress (will be replaced with actual API calls)
        await simulateProgress();

        // Make API call to backend
        const response = await fetch('/api/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error('Failed to parse video');
        }

        const data = await response.json();
        showVideoDetails(data);
    } catch (error) {
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

// Handle Download Button Click
async function handleDownload() {
    try {
        const url = videoUrlInput.value.trim();
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'video.' + getVideoFormat(url);
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
    } catch (error) {
        showError('Failed to download video');
    }
}

// Helper Functions
function setLoadingState(isLoading) {
    parseBtn.disabled = isLoading;
    buttonText.textContent = isLoading ? 'Parsing...' : 'Parse Video';
    spinner.classList.toggle('d-none', !isLoading);
}

function showError(message) {
    videoDetails.innerHTML = `
        <div class="error-message">
            ${message}
        </div>
    `;
    resultSection.classList.remove('d-none');
}

function showVideoDetails(data) {
    videoDetails.innerHTML = `
        <div class="mb-3">
            <strong>Title:</strong> ${data.title}
        </div>
        <div class="mb-3">
            <strong>Duration:</strong> ${data.duration}
        </div>
        <div class="mb-3">
            <strong>Quality:</strong> ${data.quality}
        </div>
    `;
    resultSection.classList.remove('d-none');
}

function getVideoFormat(url) {
    return 'mp4'; // Default format, can be extended based on source
}

// Simulate progress for better UX
async function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }, 100);

    return new Promise(resolve => {
        setTimeout(() => {
            clearInterval(interval);
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
            resolve();
        }, 2000);
    });
}

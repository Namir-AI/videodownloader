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

// Store the current video data
let currentVideoData = null;

// Event Listeners
parseBtn.addEventListener('click', handleParse);
downloadBtn.addEventListener('click', handleDownload);
videoUrlInput.addEventListener('input', validateInput);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    validateInput();
});

// Validate URL input
function validateInput() {
    const url = videoUrlInput.value.trim();
    parseBtn.disabled = !isValidUrl(url);
    
    // Reset UI if input changes
    if (resultSection.classList.contains('d-none') === false) {
        resultSection.classList.add('d-none');
        progressSection.classList.add('d-none');
    }
}

function isValidUrl(url) {
    if (!url) return false;
    
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
    
    // Reset progress bar
    updateProgress(0);

    try {
        // Start progress animation
        startProgressAnimation();

        // Make API call to backend
        const response = await fetch('/api/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        // Complete progress animation
        updateProgress(100);
        
        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to parse video');
        }

        const data = await response.json();
        currentVideoData = data;
        showVideoDetails(data);
    } catch (error) {
        showError(error.message || 'An unexpected error occurred');
    } finally {
        setLoadingState(false);
    }
}

// Handle Download Button Click
async function handleDownload() {
    const url = videoUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter a valid URL');
        return;
    }
    
    // Disable download button and show loading state
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Downloading...';
    
    try {
        // If we have a direct URL from the parse step, we can try to download directly
        if (currentVideoData && currentVideoData.directUrl) {
            const a = document.createElement('a');
            a.href = currentVideoData.directUrl;
            a.download = getFilename(url);
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Show success message
            showMessage('Download started! If it doesn\'t work, try the server download method.', 'success');
            
            // Also try the server method as fallback
            serverDownload(url);
        } else {
            // Use server download method
            await serverDownload(url);
        }
    } catch (error) {
        showError('Failed to download video: ' + error.message);
    } finally {
        // Re-enable download button
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = 'Download Video';
    }
}

// Server-side download method
async function serverDownload(url) {
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Download failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = getFilename(url);
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        
        showMessage('Download completed successfully!', 'success');
    } catch (error) {
        throw error;
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
        <div class="alert alert-danger">
            <strong>Error:</strong> ${message}
        </div>
    `;
    resultSection.classList.remove('d-none');
}

function showMessage(message, type = 'info') {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-info';
    
    const messageElement = document.createElement('div');
    messageElement.className = `alert ${alertClass} mt-3`;
    messageElement.innerHTML = message;
    
    videoDetails.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

function showVideoDetails(data) {
    // Create thumbnail element if available
    let thumbnailHtml = '';
    if (data.thumbnail) {
        thumbnailHtml = `
            <div class="mb-3 text-center">
                <img src="${data.thumbnail}" alt="Video thumbnail" class="img-fluid rounded" style="max-height: 200px;">
            </div>
        `;
    }
    
    // Create platform badge
    let platformBadge = '';
    if (data.platform) {
        const badgeClass = data.platform === 'facebook' ? 'bg-primary' : 
                          data.platform === 'instagram' ? 'bg-danger' : 
                          'bg-dark';
        
        const platformName = data.platform === 'facebook' ? 'Facebook' : 
                            data.platform === 'instagram' ? 'Instagram' : 
                            'Twitter/X';
                            
        platformBadge = `<span class="badge ${badgeClass} mb-2">${platformName}</span>`;
    }
    
    videoDetails.innerHTML = `
        ${thumbnailHtml}
        ${platformBadge}
        <div class="mb-3">
            <strong>Title:</strong> ${data.title || 'Unknown'}
        </div>
        <div class="mb-3">
            <strong>Quality:</strong> ${data.quality || 'HD'}
        </div>
    `;
    
    resultSection.classList.remove('d-none');
    downloadBtn.disabled = false;
}

function getFilename(url) {
    let platform = '';
    if (url.includes('facebook.com')) platform = 'facebook';
    else if (url.includes('instagram.com')) platform = 'instagram';
    else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'twitter';
    
    return `${platform}_video.mp4`;
}

function updateProgress(value) {
    progressBar.style.width = value + '%';
    progressBar.setAttribute('aria-valuenow', value);
}

// Progress animation
let progressInterval = null;

function startProgressAnimation() {
    let progress = 0;
    clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress <= 90) {
            updateProgress(progress);
        }
    }, 300);
}

function stopProgressAnimation() {
    clearInterval(progressInterval);
    updateProgress(100);
}

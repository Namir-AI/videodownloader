document.getElementById('downloadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value;
    // Add your video download logic here
    alert('Downloading video from: ' + videoUrl);
});

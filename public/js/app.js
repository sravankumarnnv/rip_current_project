document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const openCameraBtn = document.getElementById('openCameraBtn');
    const cameraContainer = document.getElementById('cameraContainer');
    const cameraFeed = document.getElementById('cameraFeed');
    const captureCameraBtn = document.getElementById('captureCameraBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');
    const imagePreview = document.getElementById('imagePreview');
    const processImageBtn = document.getElementById('processImageBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCanvas = document.getElementById('resultCanvas');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Global variables
    let capturedImage = null;
    let stream = null;
    let imageFile = null;

    // File upload event
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            imageFile = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                processImageBtn.disabled = false;
                capturedImage = null;
            };
            
            reader.readAsDataURL(imageFile);
        }
    });

    // Camera functionality
    openCameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 } 
                } 
            });
            cameraFeed.srcObject = stream;
            cameraContainer.classList.add('active');
        } catch (err) {
            alert('Error accessing camera: ' + err.message);
            console.error('Error accessing camera:', err);
        }
    });

    closeCameraBtn.addEventListener('click', () => {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            stream = null;
            cameraContainer.classList.remove('active');
        }
    });

    captureCameraBtn.addEventListener('click', () => {
        if (stream) {
            // Create a canvas element to capture the frame
            const canvas = document.createElement('canvas');
            canvas.width = cameraFeed.videoWidth;
            canvas.height = cameraFeed.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
            
            // Convert to data URL
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // Update preview
            imagePreview.src = imageDataUrl;
            imagePreview.style.display = 'block';
            processImageBtn.disabled = false;
            
            // Save captured image data
            capturedImage = imageDataUrl;
            imageFile = null;
            
            // Close camera
            closeCameraBtn.click();
        }
    });

    // Process Image Button
    processImageBtn.addEventListener('click', async () => {
        loadingOverlay.style.display = 'flex';
        
        try {
            let response;
            
            if (imageFile) {
                // If using file upload
                const formData = new FormData();
                formData.append('image', imageFile);
                
                response = await fetch('/process-image', {
                    method: 'POST',
                    body: formData
                });
            } else if (capturedImage) {
                // If using captured image from camera
                response = await fetch('/process-camera-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ image: capturedImage })
                });
            } else {
                throw new Error('No image available for processing');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log("API Response received:", result);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Load the original image and display the detection
            loadAndDisplayDetection(result);
            
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image: ' + error.message);
            loadingOverlay.style.display = 'none';
        }
    });
    
    // Load the image and display the most accurate detection
    function loadAndDisplayDetection(result) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            // Set canvas dimensions to match the image
            resultCanvas.width = img.width;
            resultCanvas.height = img.height;
            
            // Draw the original image on the canvas
            const ctx = resultCanvas.getContext('2d');
            ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Get predictions and find the most confident one
            let predictions = [];
            if (result.rawResponse && result.rawResponse.predictions) {
                predictions = result.rawResponse.predictions;
            } else if (Array.isArray(result.predictions)) {
                predictions = result.predictions;
            }
            
            // Sort predictions by confidence and get the most confident one
            if (predictions.length > 0) {
                predictions.sort((a, b) => b.confidence - a.confidence);
                const bestPrediction = predictions[0];
                
                // Draw the bounding box for the most confident prediction
                drawDetection(ctx, bestPrediction);
                
                // Show results container
                resultsContainer.style.display = 'block';
            } else {
                // No rip currents detected
                resultsContainer.style.display = 'block';
            }
            
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        };
        
        img.onerror = () => {
            console.error("Failed to load the image:", result.original);
            alert('Error loading the processed image. Please try again.');
            loadingOverlay.style.display = 'none';
        };
        
        img.src = result.original;
    }
    
    // Draw a single detection bounding box
    function drawDetection(ctx, prediction) {
        // Extract coordinates
        const x = prediction.x;
        const y = prediction.y;
        const width = prediction.width;
        const height = prediction.height;
        
        // Calculate box coordinates (handle Roboflow's center point format)
        const boxX = x - width / 2;
        const boxY = y - height / 2;
        
        // Draw rectangle with a noticeable red color
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';  // Bright red
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, width, height);
        
        // Draw "RIP CURRENT" label without percentage
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY - 25, 120, 25);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText("RIP CURRENT", boxX + 5, boxY - 5);
    }
});
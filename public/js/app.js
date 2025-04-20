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
    const detectionInfo = document.getElementById('detectionInfo');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const confidenceSlider = document.getElementById('confidenceSlider');
    const confidenceValue = document.getElementById('confidenceValue');

    // Global variables
    let capturedImage = null;
    let stream = null;
    let imageFile = null;
    let currentPredictions = [];
    let originalImage = null;

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

    // Confidence slider functionality
    confidenceSlider.addEventListener('input', function() {
        const threshold = parseInt(this.value);
        confidenceValue.textContent = threshold;
        
        // If we have predictions, re-render them with the new threshold
        if (currentPredictions.length > 0 && originalImage) {
            renderPredictions(currentPredictions, originalImage, threshold / 100);
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
            
            // Store the predictions for later use with the slider
            if (result.rawResponse && result.rawResponse.predictions) {
                currentPredictions = result.rawResponse.predictions;
            } else if (Array.isArray(result.predictions)) {
                currentPredictions = result.predictions;
            } else {
                currentPredictions = [];
            }
            
            // Show results container
            resultsContainer.style.display = 'block';
            
            // Load the original image
            loadOriginalImage(result.original);
            
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image: ' + error.message);
            loadingOverlay.style.display = 'none';
        }
    });
    
    // Load the original image and then render predictions
    function loadOriginalImage(imageSrc) {
        originalImage = new Image();
        originalImage.crossOrigin = "Anonymous";
        originalImage.onload = () => {
            // Set canvas dimensions to match the image
            resultCanvas.width = originalImage.width;
            resultCanvas.height = originalImage.height;
            
            // Get current confidence threshold
            const threshold = parseInt(confidenceSlider.value) / 100;
            
            // Render predictions with the current threshold
            renderPredictions(currentPredictions, originalImage, threshold);
            
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        };
        
        originalImage.onerror = () => {
            console.error("Failed to load the image:", imageSrc);
            detectionInfo.innerHTML = '<p>Error loading the processed image. Please try again.</p>';
            resultsContainer.style.display = 'block';
            loadingOverlay.style.display = 'none';
        };
        
        originalImage.src = imageSrc;
    }

    // Render predictions based on confidence threshold
    function renderPredictions(predictions, image, confidenceThreshold) {
        // Clear canvas and draw original image
        const ctx = resultCanvas.getContext('2d');
        ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
        ctx.drawImage(image, 0, 0);
        
        // Filter predictions based on confidence threshold
        const filteredPredictions = predictions.filter(pred => 
            pred.confidence >= confidenceThreshold
        );
        
        console.log(`Displaying ${filteredPredictions.length} predictions with confidence >= ${confidenceThreshold * 100}%`);
        
        if (filteredPredictions.length > 0) {
            let infoHTML = '<ul class="detection-list">';
            
            // Sort by confidence descending
            filteredPredictions.sort((a, b) => b.confidence - a.confidence);
            
            filteredPredictions.forEach((pred, index) => {
                // Extract coordinates
                const x = pred.x;
                const y = pred.y;
                const width = pred.width;
                const height = pred.height;
                const confidence = pred.confidence;
                const className = pred.class || 'rip';
                
                // Calculate box coordinates (handle Roboflow's center point format)
                const boxX = x - width / 2;
                const boxY = y - height / 2;
                
                // Set color based on confidence level
                let strokeColor, fillColor;
                
                if (confidence >= 0.7) { // High confidence (70%+)
                    strokeColor = 'rgba(0, 200, 0, 0.9)'; // Green
                    fillColor = 'rgba(0, 200, 0, 0.7)';
                } else if (confidence >= 0.3) { // Medium confidence (30-70%)
                    strokeColor = 'rgba(200, 200, 0, 0.9)'; // Yellow
                    fillColor = 'rgba(200, 200, 0, 0.7)';
                } else { // Low confidence (below 30%)
                    strokeColor = 'rgba(200, 100, 0, 0.9)'; // Orange
                    fillColor = 'rgba(200, 100, 0, 0.7)';
                }
                
                // Draw thicker rectangle for better visibility
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 4;
                ctx.strokeRect(boxX, boxY, width, height);
                
                // Add crosshair at center point for clearer identification
                ctx.beginPath();
                ctx.moveTo(x - 10, y);
                ctx.lineTo(x + 10, y);
                ctx.moveTo(x, y - 10);
                ctx.lineTo(x, y + 10);
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw label with confidence
                const labelText = `${className} ${Math.round(confidence * 100)}%`;
                ctx.font = 'bold 16px Arial';
                const textWidth = ctx.measureText(labelText).width + 10;
                
                // Semi-transparent background for the label
                ctx.fillStyle = fillColor;
                ctx.fillRect(boxX, boxY - 25, textWidth, 25);
                
                // White text
                ctx.fillStyle = 'white';
                ctx.fillText(labelText, boxX + 5, boxY - 5);
                
                // Add to info list
                infoHTML += `
                    <li style="border-left-color: ${strokeColor};">
                        <strong>Rip Current #${index + 1}</strong><br>
                        Confidence: ${(confidence * 100).toFixed(1)}%<br>
                        Location: X=${Math.round(x)}, Y=${Math.round(y)}<br>
                        Size: ${Math.round(width)}×${Math.round(height)} pixels
                    </li>
                `;
            });
            
            infoHTML += '</ul>';
            detectionInfo.innerHTML = infoHTML;
        } else {
            detectionInfo.innerHTML = `
                <div class="no-detections">
                    <p>No rip currents detected above ${Math.round(confidenceThreshold * 100)}% confidence.</p>
                    <p class="tip">Try lowering the confidence threshold using the slider above to detect more potential rip currents.</p>
                    <p class="tip">Extremely subtle rip currents might only be visible at very low confidence levels (1-5%).</p>
                </div>
            `;
        }
    }
});
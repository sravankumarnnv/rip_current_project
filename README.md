# Rip Current Detection Application

## Overview

This web application allows users to detect rip currents in beach images using computer vision technology. The application leverages a pre-trained machine learning model from Roboflow to identify potentially dangerous rip currents in uploaded photos or images captured directly from a camera. Rip currents are powerful, narrow channels of fast-moving water that can be hazardous to swimmers.

## Features

- **Dual Image Input Methods**:
  - Upload existing images from a device
  - Capture images in real-time using device camera

- **Advanced Detection Technology**:
  - Integrates with Roboflow's pre-trained "Rip Currents" model (version 3)
  - Detects rip currents with varying confidence levels (from 1% to 95%)
  - Shows precise location and dimensions of detected rip currents

- **Interactive User Interface**:
  - Real-time confidence threshold adjustment slider
  - Color-coded detection boxes (green for high confidence, yellow for medium, orange for low)
  - Detailed information panel for each detected rip current
  - Visual confidence level legend

- **Responsive Design**:
  - Works on desktop and mobile devices
  - Adapts to different screen sizes

## Technology Stack

- **Frontend**:
  - HTML5 for structure
  - CSS3 for styling and responsive design
  - JavaScript (vanilla) for interactive functionality

- **Backend**:
  - Node.js runtime environment
  - Express.js web framework
  - Multer for handling file uploads
  - Axios for API requests

- **API Integration**:
  - Roboflow API for rip current detection

## Installation

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd rip_current_project
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Start the application**:
   - For development with auto-restart:
     ```
     npm run dev
     ```
   - For production:
     ```
     npm start
     ```

4. **Access the application**:
   - Open a web browser and navigate to: `http://localhost:3000`

## Usage Instructions

### Uploading an Image

1. **Select the upload method**:
   - Option 1: Click "Select Image" to upload an image from your device
   - Option 2: Click "Open Camera" to capture an image using your device camera

2. **Process the image**:
   - Once an image is selected or captured, click "Detect Rip Currents"
   - The system will process the image and display the results

3. **View and interpret results**:
   - The processed image will show colored boxes around detected rip currents
   - Each box is color-coded by confidence level:
     - Green: High confidence (70-100%)
     - Yellow: Medium confidence (30-70%)
     - Orange: Low confidence (5-30%)
   - The information panel shows details about each detection

4. **Adjust confidence threshold**:
   - Use the slider to filter detections based on confidence level
   - Moving the slider left shows more potential detections (may include false positives)
   - Moving the slider right shows only high-confidence detections

## API Configuration

The application uses Roboflow's API for rip current detection. The API key and configuration are set in `src/server.js`:

- **API endpoint**: `https://detect.roboflow.com/rip-currents/3`
- **Default confidence threshold**: 5% (adjustable through the UI)
- **Overlap threshold**: 50%

## Project Structure

```
rip_current_project/
├── package.json          # Project dependencies and scripts
├── README.md             # Project documentation
├── public/               # Static assets
│   ├── index.html        # Main HTML file
│   ├── css/              # Stylesheets
│   │   └── styles.css    # Main CSS file
│   └── js/               # Client-side JavaScript
│       └── app.js        # Main JavaScript file
├── src/                  # Server-side code
│   └── server.js         # Express server and API integration
└── uploads/              # Temporary storage for uploaded images
```

## Safety Note

This application is intended for educational and informational purposes only. Always follow local beach safety guidelines and heed the advice of lifeguards and safety officials. The application's detection capabilities may vary based on image quality, environmental conditions, and other factors. Never rely solely on this tool for water safety decisions.

## License

[MIT License](LICENSE)

## Acknowledgments

- Rip current detection model provided by Roboflow
- Built with Express.js and Node.js
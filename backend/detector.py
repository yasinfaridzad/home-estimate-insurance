import cv2
import numpy as np
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io

app = Flask(__name__)
CORS(app)

# Load YOLOv3 model
def load_model():
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s')
    model.conf = 0.25  # confidence threshold
    return model

model = load_model()

def process_image(image_data):
    # Decode base64 image
    nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Run YOLOv3 detection
    results = model(img)
    
    # Process results
    detections = []
    for *box, conf, cls in results.xyxy[0].cpu().numpy():
        x1, y1, x2, y2 = box
        class_name = results.names[int(cls)]
        detections.append({
            'class': class_name,
            'confidence': float(conf),
            'bbox': [float(x1), float(y1), float(x2), float(y2)]
        })
    
    return detections

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.json
        image_data = data['image'].split(',')[1]  # Remove data URL prefix
        
        detections = process_image(image_data)
        return jsonify({'detections': detections})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 
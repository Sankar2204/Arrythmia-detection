# Cardiac Arrhythmia Detection

A full-stack deep learning application built to analyze ECG signals and predict cardiac arrhythmias using a CNN+LSTM model backend, served through an intuitive and modern Web UI.

## Overview
This project takes a comma-separated value sequence of ECG signal points as input, processes it through a Machine Learning model (built with TensorFlow/Keras), and outputs a prediction across 5 classes (Normal, AFib, PVC, PAC, Other) with a confidence score.

## Directory Structure
- `backend/` - Flask API application serving HTML and handling ML Model inference.
- `frontend/` - Static files (JS, CSS) and HTML templates providing the user interface.
- `src/` - Core Python modules for data preprocessing, training, and model definition.
- `models/` - Directory to store custom-trained `.h5` Keras models.

## Usage

1. Create a Python Virtual Environment & Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate or Place an ML Model in `models/cnn_lstm_model.h5`. By default, if the model is absent, the backend will return a mocked prediction result for UX testing purposes.

3. Run the Flask Server:
```bash
cd backend
python app.py
```

4. Navigate to `http://127.0.0.1:5000` in your browser.

5. Select an ECG signal CSV file, and click **Predict Arrhythmia**.

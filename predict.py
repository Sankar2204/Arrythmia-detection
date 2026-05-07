import numpy as np

def predict_ecg(model, signal: np.ndarray):
    """
    Predict arrhythmia class from a preprocessed ECG signal.
    """
    # Reshape signal for model input (batch_size, sequence_length, features)
    # Ensure it's the correct length. Here we assume length is handled by preprocessing.
    # In a real scenario, you'd pad/truncate to the expected `input_shape` of the model (e.g., 187).
    
    # Just a mock reshape if signal length is dynamic, but usually it's fixed.
    try:
        signal_reshaped = signal.reshape(1, -1, 1)
        prediction_probs = model.predict(signal_reshaped)
        
        classes = ['Normal', 'AFib', 'PVC', 'PAC', 'Other']
        predicted_idx = prediction_probs.argmax()
        
        return {
            "prediction": classes[predicted_idx],
            "confidence": float(prediction_probs[0][predicted_idx]),
            "probabilities": {classes[i]: float(prediction_probs[0][i]) for i in range(len(classes))}
        }
    except Exception as e:
        return {"error": str(e)}

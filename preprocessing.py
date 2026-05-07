import numpy as np
from scipy.signal import butter, filtfilt

def bandpass_filter(signal: np.ndarray, lowcut=0.5, highcut=40.0, fs=100.0, order=3):
    """
    Apply a bandpass filter to the ECG signal to remove baseline wander and high-frequency noise.
    """
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, signal)

def preprocess_ecg(signal: list) -> np.ndarray:
    """
    Preprocess raw ECG signal list to numpy array and apply filtering.
    """
    signal_arr = np.array(signal)
    
    # Check if signal is long enough for scipy filtfilt
    # Default padlen for order=3 bandpass is 33
    if len(signal_arr) > 33:
        filtered = bandpass_filter(signal_arr)
    else:
        filtered = signal_arr
        
    # Further processing like normalization can be added here
    return filtered

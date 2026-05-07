import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout

def build_model(input_shape):
    """
    Build a CNN + LSTM model for 1D ECG signal classification.
    """
    model = Sequential()

    # CNN block
    model.add(Conv1D(32, kernel_size=3, activation='relu', input_shape=input_shape))
    model.add(MaxPooling1D(pool_size=2))

    # LSTM block
    model.add(LSTM(64, return_sequences=False))
    model.add(Dropout(0.5))

    # Dense layers
    model.add(Dense(32, activation='relu'))
    model.add(Dense(5, activation='softmax'))  # 5 arrhythmia classes (e.g., Normal, AFib, PVC, PAC, Other)

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    return model

if __name__ == '__main__':
    # Mock summary
    model = build_model((187, 1)) # standard MIT-BIH shape example
    model.summary()

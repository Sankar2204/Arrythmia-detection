from flask import Flask, request, jsonify, render_template
import numpy as np
import tensorflow as tf
import os
import sys

# Add project root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.preprocessing import preprocess_ecg
from src.predict import predict_ecg

app = Flask(__name__, 
            template_folder='../frontend/templates', 
            static_folder='../frontend/static')

# Initialize model variable
model = None

def load_ml_model():
    global model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'cnn_lstm_model.h5')
    if os.path.exists(model_path):
        try:
            model = tf.keras.models.load_model(model_path)
            print(f"Loaded model from {model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Model not found at {model_path}. Will use mock predictions.")

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/upload')
def upload():
    return render_template('index.html')

@app.route('/result')
def result():
    return render_template('result.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data or 'ecg_signal' not in data:
            return jsonify({"error": "No ecg_signal provided"}), 400
            
        signal_list = data['ecg_signal']
        
        # Preprocess
        processed_signal = preprocess_ecg(signal_list)
        
        if model is not None:
            # Requires signal to have specific length based on model training (e.g., 187)
            # If the length doesn't match, we need to pad or truncate. 
            # For this MVP, we assume the frontend sends the exact right shape, or we pad here:
            TARGET_LEN = 187 # typical for MIT-BIH
            if len(processed_signal) < TARGET_LEN:
                processed_signal = np.pad(processed_signal, (0, TARGET_LEN - len(processed_signal)))
            elif len(processed_signal) > TARGET_LEN:
                processed_signal = processed_signal[:TARGET_LEN]
                
            result = predict_ecg(model, processed_signal)
            signal_out = processed_signal.tolist()
            result["signal"] = signal_out[:1000] if len(signal_out) > 1000 else signal_out
            return jsonify(result)
        else:
            # Mock response if model is not loaded (for development)
            import random
            classes = ['Normal', 'AFib', 'PVC', 'PAC', 'Other']
            pred = random.choice(classes)
            signal_out = processed_signal.tolist()
            return jsonify({
                "prediction": pred,
                "confidence": random.uniform(0.6, 0.99),
                "mock": True,
                "signal": signal_out[:1000] if len(signal_out) > 1000 else signal_out
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Doctor Assistant Chatbot endpoint with rule-based medical guidance."""
    try:
        data = request.json
        user_message = data.get('message', '').strip().lower()
        diagnosis = data.get('diagnosis', 'Unknown')
        
        if not user_message:
            return jsonify({"reply": "Please type a message so I can assist you."})

        # Comprehensive medication & treatment knowledge base
        medication_db = {
            'Normal': {
                'medications': [],
                'overview': 'Your ECG results appear normal. No specific cardiac medications are indicated at this time.',
                'lifestyle': [
                    'Maintain a balanced diet rich in fruits, vegetables, and whole grains.',
                    'Exercise regularly — aim for 150 minutes of moderate activity per week.',
                    'Avoid excessive caffeine and alcohol intake.',
                    'Get 7–9 hours of quality sleep each night.',
                    'Manage stress through meditation or relaxation techniques.'
                ],
                'followup': 'Continue with annual health checkups. Maintain a heart-healthy lifestyle to keep your cardiac health optimal.'
            },
            'AFib': {
                'medications': [
                    {'name': 'Warfarin (Coumadin)', 'purpose': 'Blood thinner to prevent clot formation and reduce stroke risk.'},
                    {'name': 'Apixaban (Eliquis)', 'purpose': 'Newer oral anticoagulant (NOAC), often preferred for fewer dietary restrictions.'},
                    {'name': 'Rivaroxaban (Xarelto)', 'purpose': 'NOAC anticoagulant taken once daily.'},
                    {'name': 'Metoprolol (Lopressor)', 'purpose': 'Beta-blocker to control heart rate.'},
                    {'name': 'Diltiazem (Cardizem)', 'purpose': 'Calcium channel blocker for rate control.'},
                    {'name': 'Amiodarone (Cordarone)', 'purpose': 'Antiarrhythmic to restore and maintain normal rhythm.'},
                    {'name': 'Flecainide (Tambocor)', 'purpose': 'Antiarrhythmic for rhythm control in select patients.'}
                ],
                'overview': 'Atrial Fibrillation (AFib) is a serious condition that increases stroke risk by 5x. Treatment focuses on rate/rhythm control and anticoagulation.',
                'lifestyle': [
                    'Strictly limit alcohol — it is a known AFib trigger.',
                    'Reduce caffeine intake.',
                    'Monitor and manage blood pressure daily.',
                    'Maintain a healthy weight — obesity worsens AFib.',
                    'Report any episodes of racing heart, dizziness, or fainting immediately.'
                ],
                'followup': 'Schedule an urgent appointment with a cardiologist. You may need an echocardiogram and possibly a Holter monitor for 24-48 hour monitoring.'
            },
            'PVC': {
                'medications': [
                    {'name': 'Metoprolol (Lopressor)', 'purpose': 'Beta-blocker to reduce PVC frequency.'},
                    {'name': 'Atenolol (Tenormin)', 'purpose': 'Beta-blocker alternative for PVC suppression.'},
                    {'name': 'Verapamil (Calan)', 'purpose': 'Calcium channel blocker if beta-blockers are not tolerated.'},
                    {'name': 'Flecainide (Tambocor)', 'purpose': 'Antiarrhythmic for severe or symptomatic PVCs.'}
                ],
                'overview': 'Premature Ventricular Contractions (PVCs) are extra heartbeats originating in the ventricles. Occasional PVCs are common and often benign, but frequent PVCs (>10% of heartbeats) may need treatment.',
                'lifestyle': [
                    'Reduce or eliminate caffeine (coffee, energy drinks, tea).',
                    'Manage stress and anxiety — these are major PVC triggers.',
                    'Ensure adequate sleep and hydration.',
                    'Avoid decongestants and stimulant medications.',
                    'Regular moderate exercise can help, but avoid overexertion.'
                ],
                'followup': 'A Holter monitor test is recommended to assess PVC frequency over 24-48 hours. Follow up with your physician in 2-4 weeks.'
            },
            'PAC': {
                'medications': [
                    {'name': 'Metoprolol (Lopressor)', 'purpose': 'Beta-blocker to reduce PAC frequency if symptomatic.'},
                    {'name': 'Propranolol (Inderal)', 'purpose': 'Short-acting beta-blocker for episodic symptoms.'}
                ],
                'overview': 'Premature Atrial Contractions (PACs) are extra heartbeats from the upper chambers. They are usually harmless but can sometimes precede AFib in certain patients.',
                'lifestyle': [
                    'Reduce caffeine and stimulant intake.',
                    'Get adequate rest — fatigue can worsen PACs.',
                    'Practice stress-reduction techniques.',
                    'Stay well-hydrated and maintain electrolyte balance.'
                ],
                'followup': 'PACs are generally benign. Follow up with your physician if symptoms worsen or become more frequent.'
            },
            'Other': {
                'medications': [
                    {'name': 'Varies', 'purpose': 'Specific medications depend on the exact type of arrhythmia identified through further testing.'}
                ],
                'overview': 'An unclassified arrhythmia was detected. Further diagnostic testing is needed to determine the specific type and appropriate treatment plan.',
                'lifestyle': [
                    'Avoid stimulants until further evaluation.',
                    'Keep a symptom diary noting when irregular heartbeats occur.',
                    'Monitor your pulse daily and report irregularities.'
                ],
                'followup': 'Schedule a comprehensive cardiac evaluation including a 12-lead ECG, echocardiogram, and potentially an electrophysiology study.'
            }
        }
        
        condition = medication_db.get(diagnosis, medication_db['Other'])
        
        # Intent detection and response generation
        reply = ""
        
        if any(w in user_message for w in ['medication', 'medicine', 'drug', 'prescription', 'tablet', 'pill', 'treat']):
            if condition['medications']:
                med_lines = []
                for med in condition['medications']:
                    med_lines.append(f"💊 **{med['name']}** — {med['purpose']}")
                reply = f"Based on your **{diagnosis}** diagnosis, here are commonly prescribed medications:\n\n"
                reply += "\n".join(med_lines)
                reply += "\n\n⚠️ *These are informational only. Your cardiologist will determine the best treatment plan for you.*"
            else:
                reply = f"For a **{diagnosis}** result, no specific cardiac medications are typically required. Continue maintaining a heart-healthy lifestyle! 🎉"
        
        elif any(w in user_message for w in ['lifestyle', 'diet', 'exercise', 'food', 'habit', 'daily', 'routine', 'prevent']):
            tips = "\n".join([f"• {tip}" for tip in condition['lifestyle']])
            reply = f"Here are lifestyle recommendations for your **{diagnosis}** condition:\n\n{tips}"
        
        elif any(w in user_message for w in ['follow', 'appointment', 'doctor', 'visit', 'next step', 'what should', 'what do']):
            reply = f"📋 **Follow-up guidance for {diagnosis}:**\n\n{condition['followup']}"
        
        elif any(w in user_message for w in ['risk', 'danger', 'serious', 'worried', 'scary', 'fatal', 'die', 'death']):
            risk_info = {
                'Normal': "Great news — your results are normal! There's no immediate cardiac risk detected. Keep up the healthy habits! 😊",
                'AFib': "⚠️ AFib is a serious condition. It increases stroke risk significantly. However, with proper treatment and lifestyle changes, many patients live full, active lives. Timely medical intervention is key.",
                'PVC': "PVCs are very common and usually benign. However, if they are very frequent (>10,000/day), they can weaken the heart over time. Most cases are manageable with lifestyle changes and medication.",
                'PAC': "PACs are generally harmless and quite common. They rarely require aggressive treatment. However, frequent PACs should be monitored as they can occasionally progress to AFib.",
                'Other': "Since the specific arrhythmia type is unclassified, it's important to get further testing. Many arrhythmias are manageable once properly diagnosed."
            }
            reply = risk_info.get(diagnosis, risk_info['Other'])
        
        elif any(w in user_message for w in ['emergency', 'urgent', 'chest pain', 'faint', 'unconscious', 'call 911', 'ambulance']):
            reply = "🚨 **EMERGENCY GUIDANCE:**\n\n"
            reply += "If you or someone is experiencing:\n"
            reply += "• Severe chest pain or pressure\n"
            reply += "• Difficulty breathing\n"
            reply += "• Loss of consciousness\n"
            reply += "• Sudden severe dizziness\n\n"
            reply += "**Call emergency services (911) immediately.** Do not wait.\n\n"
            reply += "While waiting: Have the person sit or lie down comfortably. Loosen tight clothing. If trained, be prepared to perform CPR if needed."

        elif any(w in user_message for w in ['hello', 'hi', 'hey', 'greet', 'good morning', 'good evening']):
            reply = f"Hello! 👋 I'm your HeartCare Virtual Doctor Assistant. I'm here to help you understand your **{diagnosis}** diagnosis.\n\nYou can ask me about:\n• 💊 Medications & treatments\n• 🏃 Lifestyle recommendations\n• 📋 Follow-up steps\n• ⚠️ Risk assessment\n• 🚨 Emergency guidance\n\nWhat would you like to know?"
        
        elif any(w in user_message for w in ['explain', 'what is', 'tell me', 'about', 'mean', 'condition', 'diagnosis']):
            reply = f"📖 **About {diagnosis}:**\n\n{condition['overview']}"
        
        elif any(w in user_message for w in ['thank', 'thanks', 'bye', 'goodbye']):
            reply = "You're welcome! 😊 Take care of your heart. Remember, I'm here anytime you need cardiac health guidance. Wishing you good health! ❤️"
        
        else:
            reply = f"I'd be happy to help with your **{diagnosis}** diagnosis. Here's what I can assist with:\n\n"
            reply += "• Ask about **medications** prescribed for this condition\n"
            reply += "• Ask about **lifestyle** changes and diet tips\n"
            reply += "• Ask about **risk** level and prognosis\n"
            reply += "• Ask about **follow-up** steps and appointments\n"
            reply += "• Ask about **emergency** warning signs\n"
            reply += "• Ask me to **explain** the condition\n\n"
            reply += "Try typing something like *\"What medications are recommended?\"* or *\"What lifestyle changes should I make?\"*"
        
        return jsonify({"reply": reply})
        
    except Exception as e:
        return jsonify({"reply": f"I'm sorry, I encountered an issue processing your request. Please try again. (Error: {str(e)})"}), 500


if __name__ == "__main__":
    load_ml_model()
    app.run(host='0.0.0.0', debug=True, port=5000)

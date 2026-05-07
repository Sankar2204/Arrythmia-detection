document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Data
    const patientStr = sessionStorage.getItem('patientData');
    const predStr = sessionStorage.getItem('predictionData');
    
    if (!predStr) {
        if(window.showToast) window.showToast('No prediction data found. Redirecting to upload.', 'error');
        setTimeout(() => window.location.href = '/upload', 1500);
        return;
    }

    const patientData = patientStr ? JSON.parse(patientStr) : null;
    const predData = JSON.parse(predStr);

    // 2. Populate Patient Info
    const infoGrid = document.getElementById('patientInfoGrid');
    if (patientData) {
        infoGrid.innerHTML = `
            <div class="info-item"><span>Name</span><strong>${patientData.fullName}</strong></div>
            <div class="info-item"><span>Age</span><strong>${patientData.age}</strong></div>
            <div class="info-item"><span>Gender</span><strong>${patientData.gender}</strong></div>
            <div class="info-item"><span>Heart Rate</span><strong>${patientData.heartRate} BPM</strong></div>
            <div class="info-item"><span>Blood Pressure</span><strong>${patientData.bloodPressure}</strong></div>
            <div class="info-item" style="grid-column: 1 / -1;"><span>Symptoms</span><strong>${patientData.symptoms && patientData.symptoms.length > 0 ? patientData.symptoms.join(', ') : 'None reported'}</strong></div>
        `;
    } else {
        infoGrid.innerHTML = `<p style="color:var(--text-secondary);">No patient profile provided.</p>`;
    }

    // 3. Populate Prediction Card
    const pred = predData.prediction; // e.g., "Normal", "AFib", etc.
    const conf = predData.confidence || 0;
    const confPct = Math.round(conf * 100);
    const mock = predData.mock;

    const predText = document.getElementById('predText');
    const riskBadge = document.getElementById('riskBadge');
    
    predText.innerText = mock ? `${pred} (Simulate)` : pred;
    document.getElementById('confText').innerText = `${confPct}%`;
    
    setTimeout(() => {
        document.getElementById('confFill').style.width = `${confPct}%`;
    }, 500); // Wait for the entrance animation

    // Clinical Knowledge Base Mapping (Kept identical for backend compatibility)
    const medicalInsights = {
        'Normal': {
            risk: 'Low',
            color: 'var(--success)',
            desc: 'The ECG trace shows a normal sinus rhythm with regular electrical activity.',
            causes: ['Healthy lifestyle', 'Good cardiovascular fitness'],
            recs: ['Maintain healthy diet', 'Routine checkups', 'Regular exercise']
        },
        'AFib': {
            risk: 'High',
            color: 'var(--danger)',
            desc: 'Atrial Fibrillation detected. Characterized by irregular and often very rapid heart rhythm.',
            causes: ['High blood pressure', 'Heart attacks', 'Coronary artery disease', 'Sleep apnea'],
            recs: ['Consult cardiologist immediately', 'Avoid caffeine and alcohol', 'Discuss blood thinners with doctor']
        },
        'PVC': {
            risk: 'Medium',
            color: 'var(--warning)',
            desc: 'Premature Ventricular Contractions. Extra heartbeats that begin in the ventricles.',
            causes: ['Caffeine or alcohol excess', 'Stress or anxiety', 'Electrolyte imbalances'],
            recs: ['Limit caffeine intake', 'Manage stress', 'Holter monitor test may be recommended']
        },
        'PAC': {
            risk: 'Low',
            color: 'var(--accent-primary)',
            desc: 'Premature Atrial Contractions. Extra heartbeats starting in the atria.',
            causes: ['Fatigue', 'Stress', 'Caffeine intake'],
            recs: ['Get adequate sleep', 'Reduce stimulants intake']
        },
        'Other': {
            risk: 'Medium',
            color: 'var(--warning)',
            desc: 'An unclassified arrhythmia was detected. The rhythm deviates from normal sinus rhythm.',
            causes: ['Various underlying conditions', 'Medication side effects'],
            recs: ['Schedule clinical ECG review', 'Monitor symptoms', 'Keep a symptom diary']
        }
    };

    const insight = medicalInsights[pred] || medicalInsights['Other'];

    // Setup Risk Badge and colors
    riskBadge.innerText = `${insight.risk} Risk`;
    riskBadge.style.backgroundColor = 'transparent'; 
    riskBadge.style.color = insight.color;
    riskBadge.style.borderColor = insight.color;

    document.getElementById('confFill').style.background = `linear-gradient(90deg, ${insight.color}, ${insight.color})`;
    predText.style.color = insight.color;
    
    // Add tooltip
    predText.setAttribute('data-tooltip', insight.desc);

    // 4. Populate Insights
    document.getElementById('descText').innerText = insight.desc;
    document.getElementById('causesList').innerHTML = insight.causes.map(c => `<li>${c}</li>`).join('');
    document.getElementById('recsList').innerHTML = insight.recs.map(r => `<li>${r}</li>`).join('');

    // 5. Render Chart
    let ecgChartInstance = null;
    
    if (predData.signal && Array.isArray(predData.signal) && predData.signal.length > 0) {
        ecgChartInstance = renderChart(predData.signal, insight.color);
    } else {
        document.getElementById('ecgChart').parentElement.innerHTML = '<div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-secondary);"><p>No signal data available to visualize.</p></div>';
    }

    function renderChart(signalData, color) {
        const ctx = document.getElementById('ecgChart').getContext('2d');
        const labels = Array.from({length: signalData.length}, (_, i) => i);
        
        // Define theme-aware colors
        const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
        const gridColor = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const textColor = isLightMode ? '#64748b' : '#94a3b8';

        Chart.defaults.color = textColor;

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ECG Amplitude (mV)',
                    data: signalData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue(color.replace(/var\(|\)/g, '')).trim() || '#3b82f6',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.1, 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Listen for custom theme change to update the chart dynamically
    window.addEventListener('themeChanged', (e) => {
        if (!ecgChartInstance) return;
        
        const isLightMode = e.detail.theme === 'light';
        const gridColor = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const textColor = isLightMode ? '#64748b' : '#94a3b8';
        
        // Resolve actual computed color if it's a CSS variable
        const actualColor = getComputedStyle(document.documentElement).getPropertyValue(insight.color.replace(/var\(|\)/g, '')).trim() || '#3b82f6';
        
        ecgChartInstance.data.datasets[0].borderColor = actualColor;
        ecgChartInstance.options.scales.x.grid.color = gridColor;
        ecgChartInstance.options.scales.x.ticks.color = textColor;
        ecgChartInstance.options.scales.y.grid.color = gridColor;
        ecgChartInstance.options.scales.y.ticks.color = textColor;
        
        ecgChartInstance.update();
    });

    // 6. Bonus: Print/PDF (Simple window.print)
    document.getElementById('downloadPdf').addEventListener('click', () => {
        window.print();
    });

    // ===== CHATBOT CONTROLLER =====
    const chatFab = document.getElementById('chatFab');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    let chatInitialized = false;

    // Get current diagnosis for context
    const currentDiagnosis = pred || 'Unknown';

    // Toggle chat window
    chatFab.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
            if (!chatInitialized) {
                chatInitialized = true;
                // Auto-greet with diagnosis context
                const patientName = patientData ? patientData.fullName.split(' ')[0] : 'there';
                addBotMessage(`Hello ${patientName}! 👋 I'm your Heart Factory Virtual Doctor Assistant.\n\nYour diagnosis: **${currentDiagnosis}**\n\nI can help you with:\n• 💊 Medications & treatments\n• 🏃 Lifestyle recommendations\n• 📋 Follow-up steps\n• ⚠️ Risk assessment\n• 🚨 Emergency guidance\n\nWhat would you like to know?`);
            }
        }
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // Send message
    function sendMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        addUserMessage(msg);
        chatInput.value = '';

        // Show typing indicator
        const typingEl = showTyping();

        // Call backend (Endpoint untouched!)
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, diagnosis: currentDiagnosis })
        })
        .then(res => res.json())
        .then(data => {
            removeTyping(typingEl);
            addBotMessage(data.reply || "I'm sorry, I couldn't process that.");
        })
        .catch(err => {
            removeTyping(typingEl);
            addBotMessage("⚠️ Connection error. Please try again.");
            if(window.showToast) window.showToast('Chatbot connection error', 'error');
        });
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // DOM helpers
    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-msg user';
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        // Simple markdown-like rendering for bold and line breaks
        div.innerHTML = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    function removeTyping(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }
});

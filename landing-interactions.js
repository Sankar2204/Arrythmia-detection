document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Interactive Symptom Checker ---
    const symptomChecks = document.querySelectorAll('.symptom-check');
    const riskScoreEl = document.getElementById('risk-score');
    const riskTitleEl = document.getElementById('risk-title');
    const riskDescEl = document.getElementById('risk-desc');
    const riskDial = document.getElementById('risk-dial');
    const symptomCta = document.getElementById('symptom-cta');
    const emergencyCta = document.getElementById('emergency-cta');

    function calculateRisk() {
        let totalScore = 0;
        let hasCritical = false;

        symptomChecks.forEach(check => {
            if (check.checked) {
                totalScore += parseInt(check.value);
                if (check.classList.contains('critical')) {
                    hasCritical = true;
                }
            }
        });

        // Max possible score is 4 (basic) + 15 (critical) = 19
        // Convert to percentage approximation
        let percentage = Math.min(Math.round((totalScore / 19) * 100), 100);
        
        let riskLevel = 'Low';
        let dialColor = 'border-emerald-500';
        let textColor = 'text-emerald-500';

        if (hasCritical || percentage > 60) {
            riskLevel = 'Critical';
            dialColor = 'border-red-600';
            textColor = 'text-red-600';
            percentage = Math.max(percentage, 80); // ensure critical shows high %
        } else if (percentage > 20) {
            riskLevel = 'Moderate';
            dialColor = 'border-orange-500';
            textColor = 'text-orange-500';
        }

        // Update UI
        riskScoreEl.textContent = `${percentage}%`;
        riskScoreEl.className = `text-3xl font-bold ${textColor}`;
        
        // Reset Dial classes and set new ones
        riskDial.className = `w-32 h-32 rounded-full border-8 flex items-center justify-center mb-6 transition-colors duration-500 ${dialColor}`;

        if (riskLevel === 'Low') {
            riskTitleEl.textContent = 'Low Risk';
            riskTitleEl.className = 'text-2xl font-bold mb-3 text-emerald-500';
            riskDescEl.textContent = 'Your symptoms suggest low immediate risk. Routine monitoring is recommended.';
            symptomCta.classList.add('hidden');
            emergencyCta.classList.add('hidden');
            if(totalScore > 0) symptomCta.classList.remove('hidden');
        } else if (riskLevel === 'Moderate') {
            riskTitleEl.textContent = 'Moderate Risk';
            riskTitleEl.className = 'text-2xl font-bold mb-3 text-orange-500';
            riskDescEl.textContent = 'You are experiencing noticeable symptoms. We recommend running our AI Diagnosis tool for an initial assessment.';
            symptomCta.classList.remove('hidden');
            emergencyCta.classList.add('hidden');
        } else {
            riskTitleEl.textContent = 'CRITICAL RISK';
            riskTitleEl.className = 'text-2xl font-bold mb-3 text-red-600 animate-pulse';
            riskDescEl.textContent = 'DO NOT WAIT. You have selected critical emergency symptoms. Seek medical help immediately.';
            symptomCta.classList.add('hidden');
            emergencyCta.classList.remove('hidden');
        }
    }

    symptomChecks.forEach(check => {
        check.addEventListener('change', calculateRisk);
    });

    // --- 2. Chart.js Data Visualization ---
    let chartsRendered = false;
    const renderCharts = () => {
        if(chartsRendered) return;
        
        const accuracyCtx = document.getElementById('accuracyChart');
        const riskCtx = document.getElementById('riskChart');

        if(accuracyCtx && riskCtx) {
            chartsRendered = true;

            // Accuracy Bar Chart
            new Chart(accuracyCtx, {
                type: 'bar',
                data: {
                    labels: ['Traditional ECG Read', 'Rule-based Algorithm', 'Our CNN-LSTM Model'],
                    datasets: [{
                        label: 'Diagnostic Accuracy (%)',
                        data: [75, 82, 98.5],
                        backgroundColor: [
                            'rgba(148, 163, 184, 0.6)', 
                            'rgba(168, 85, 247, 0.6)', 
                            'rgba(59, 130, 246, 0.8)'
                        ],
                        borderColor: [
                            'rgb(148, 163, 184)',
                            'rgb(168, 85, 247)',
                            'rgb(59, 130, 246)'
                        ],
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });

            // Demographics Donut Chart
            new Chart(riskCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Normal Rhythm', 'AFib Detection', 'PVC/PAC', 'Other Critical'],
                    datasets: [{
                        data: [55, 25, 15, 5],
                        backgroundColor: [
                            'rgb(16, 185, 129)',
                            'rgb(239, 68, 68)',
                            'rgb(245, 158, 11)',
                            'rgb(99, 102, 241)'
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutBounce'
                    }
                }
            });
        }
    };

    // Intersection Observer to trigger charts when scrolled in view
    const chartSection = document.getElementById('accuracyChart');
    if (chartSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    renderCharts();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(chartSection);
    }

    // --- 3. Scroll Animations (Fade in up) ---
    const animatedElements = document.querySelectorAll('.animate-fade-in-up');
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Tailwind class to trigger animation if not using pure CSS animation
                // But we define it in home.css, so just adding a visible class if needed
                // Actually they are already animated on load. Let's make them animate on scroll.
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        scrollObserver.observe(el);
    });

    // --- 4. Floating Assistant Modal ---
    const assistantBtn = document.getElementById('floatingAssistantBtn');
    const assistantModal = document.getElementById('assistantModal');
    const closeAssistant = document.getElementById('closeAssistant');

    if (assistantBtn && assistantModal) {
        assistantBtn.addEventListener('click', () => {
            assistantModal.classList.remove('hidden');
            // Small delay to allow display block to apply before opacity transition
            setTimeout(() => {
                assistantModal.classList.remove('opacity-0');
                assistantModal.children[0].classList.remove('scale-95');
                assistantModal.children[0].classList.add('scale-100');
            }, 10);
            
            // Stop bouncing once opened
            assistantBtn.classList.remove('animate-bounce');
        });

        const closeModal = () => {
            assistantModal.classList.add('opacity-0');
            assistantModal.children[0].classList.remove('scale-100');
            assistantModal.children[0].classList.add('scale-95');
            setTimeout(() => {
                assistantModal.classList.add('hidden');
            }, 300);
        };

        closeAssistant.addEventListener('click', closeModal);
        
        // Close on outside click
        assistantModal.addEventListener('click', (e) => {
            if (e.target === assistantModal) {
                closeModal();
            }
        });
    }

    // --- 5. Smooth Scrolling for Internal Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('patient-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Gather data
        const formData = new FormData(form);
        const symptoms = form.querySelectorAll('input[name="symptoms"]:checked');
        const symptomArray = Array.from(symptoms).map(cb => cb.value);

        const patientData = {
            fullName: formData.get('fullName'),
            age: formData.get('age'),
            gender: formData.get('gender'),
            medicalHistory: formData.get('medicalHistory'),
            symptoms: symptomArray,
            heartRate: formData.get('heartRate'),
            bloodPressure: formData.get('bloodPressure')
        };

        // Store in sessionStorage
        sessionStorage.setItem('patientData', JSON.stringify(patientData));
        
        // Add submitting animation to button
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<span class="spinner" style="margin-right:8px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; width:16px; height:16px; display:inline-block; animation:spin 1s linear infinite;"></span> Saving Profile...';
        btn.disabled = true;

        if(window.showToast) {
            window.showToast('Profile saved successfully! Proceeding to upload.', 'success');
        }

        // Redirect to upload page
        setTimeout(() => {
            window.location.href = '/upload';
        }, 1500);
    });
});

// Add keyframe for spinner since it's inline logic
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

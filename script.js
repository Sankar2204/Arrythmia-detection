document.addEventListener("DOMContentLoaded", () => {
    // Check if patientData exists
    const patientStr = sessionStorage.getItem('patientData');
    if (patientStr) {
        const patient = JSON.parse(patientStr);
        document.getElementById('patientNameHeader').innerText = `Welcome, ${patient.fullName.split(' ')[0]}`;
    }

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const predictBtn = document.getElementById('predictBtn');
    const filePreview = document.getElementById('filePreview');
    const fileNameDisplay = document.querySelector('#fileNameDisplay span');
    const fileSizeDisplay = document.getElementById('fileSizeDisplay');
    const previewData = document.getElementById('previewData');

    let selectedFile = null;

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('highlight'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }, false);

    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            if (selectedFile.name.endsWith('.csv')) {
                showPreview(selectedFile);
                predictBtn.removeAttribute('disabled');
                if(window.showToast) window.showToast('File attached successfully.', 'success');
            } else {
                if(window.showToast) window.showToast('Please upload a valid .csv file only.', 'error');
                selectedFile = null;
                predictBtn.setAttribute('disabled', 'true');
                filePreview.style.display = 'none';
            }
        }
    }

    function showPreview(file) {
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = (file.size / 1024).toFixed(2) + " KB";
        filePreview.style.display = 'block';

        // Read first few values for preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = text.split(/[\n,]/).filter(val => val.trim() !== '').map(Number).filter(n => !isNaN(n));
            const previewVals = data.slice(0, 5).map(n => n.toFixed(3)).join(', ');
            previewData.textContent = `Preview: [${previewVals} ...]`;
        };
        // Read just a chunk to be safe
        reader.readAsText(file);
    }

    predictBtn.addEventListener('click', () => {
        if (!selectedFile) return;

        const uploadSection = document.getElementById('uploadSection');
        const loaderContainer = document.getElementById('loaderContainer');
        const loaderText = document.getElementById('loaderText');
        const stage1 = document.getElementById('stage1');
        const stage2 = document.getElementById('stage2');
        const stage3 = document.getElementById('stage3');

        uploadSection.style.display = 'none';
        loaderContainer.style.display = 'flex';

        const reader = new FileReader();
        reader.onload = function(e) {
            stage1.classList.remove('active');
            stage1.classList.add('completed');
            stage2.classList.add('active');
            loaderText.innerText = "Processing Data...";

            const text = e.target.result;
            let data = text.split(/[\n,]/).filter(val => val.trim() !== '').map(Number).filter(n => !isNaN(n));

            if (data.length === 0) {
                if(window.showToast) window.showToast('No valid data found in CSV.', 'error');
                setTimeout(()=> window.location.reload(), 2000);
                return;
            }

            setTimeout(() => {
                stage2.classList.remove('active');
                stage2.classList.add('completed');
                stage3.classList.add('active');
                loaderText.innerText = "Predicting Results...";

                fetch('/predict', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ecg_signal: data})
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        if(window.showToast) window.showToast(data.error, 'error');
                        setTimeout(()=> window.location.reload(), 2500);
                        return;
                    }

                    // Save prediction data to sessionStorage
                    sessionStorage.setItem('predictionData', JSON.stringify(data));
                    
                    if(window.showToast) window.showToast('Analysis Complete', 'success');

                    setTimeout(() => {
                        window.location.href = '/result';
                    }, 800); 
                })
                .catch(err => {
                    if(window.showToast) window.showToast('Prediction failed: ' + err.message, 'error');
                    console.error("Fetch/Script Error:", err);
                    setTimeout(()=> window.location.reload(), 2500);
                });

            }, 1000); // Fake delay for visualization effect
        };
        reader.readAsText(selectedFile);
    });
});

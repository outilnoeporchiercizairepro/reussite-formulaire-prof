document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recruitmentForm');
    const telephoneInput = document.getElementById('telephone');
    const successModal = document.getElementById('successModal');

    // Phone formatting
    telephoneInput.addEventListener('input', (e) => {
        let value = e.target.value;
        if (!value.startsWith('+33')) {
            e.target.value = '+33' + value.replace(/[^0-9]/g, '');
        } else {
            e.target.value = '+33' + value.substring(3).replace(/[^0-9]/g, '');
        }
        if (e.target.value.length > 12) {
            e.target.value = e.target.value.substring(0, 12);
        }
    });

    // --- Stepper Logic ---
    window.nextStep = (currentStep) => {
        // Validation check for the current step
        const currentStepEl = document.getElementById(`step${currentStep}`);
        const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });

        if (isValid) {
            // Check radio button groups manually if needed (not captured by reportValidity on individual radio if none selected)
            const radioGroups = new Set();
            currentStepEl.querySelectorAll('input[type="radio"][required]').forEach(r => radioGroups.add(r.name));
            for (let name of radioGroups) {
                if (!currentStepEl.querySelector(`input[name="${name}"]:checked`)) {
                    alert('Veuillez sélectionner une option pour continuer.');
                    isValid = false;
                    break;
                }
            }
        }

        if (isValid) {
            goToStep(currentStep + 1);
        }
    };

    window.prevStep = (currentStep) => {
        goToStep(currentStep - 1);
    };

    function goToStep(stepNumber) {
        // Update Steps Visibility
        document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
        document.getElementById(`step${stepNumber}`).classList.add('active');

        // Update Stepper Progress UI
        const indicators = document.querySelectorAll('.step-indicator');
        const lines = document.querySelectorAll('.step-line');

        indicators.forEach((ind, index) => {
            const stepNum = index + 1;
            ind.classList.remove('active', 'completed');
            if (stepNum === stepNumber) {
                ind.classList.add('active');
            } else if (stepNum < stepNumber) {
                ind.classList.add('completed');
            }
        });

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            line.classList.remove('completed');
            if (lineNum < stepNumber) {
                line.classList.add('completed');
            }
        });

        // Scroll to top of form
        document.querySelector('.hero').scrollIntoView({ behavior: 'smooth' });
    }

    // --- Original Event Listeners ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (form.checkValidity()) {
            const formData = new FormData(form);
            const data = {};

            // Show loading state if desired
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = "Envoi en cours...";

            // Process FormData
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    if (value.size > 0) {
                        try {
                            data[key + '_base64'] = await toBase64(value);
                            data[key + '_name'] = value.name;
                            data[key + '_type'] = value.type;
                        } catch (err) {
                            console.error("Base64 conversion error", err);
                        }
                    }
                } else {
                    if (data[key]) {
                        if (!Array.isArray(data[key])) {
                            data[key] = [data[key]];
                        }
                        data[key].push(value);
                    } else {
                        data[key] = value;
                    }
                }
            }

            try {
                const response = await fetch('https://n8n.prcz.fr/webhook-test/reussite-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    successModal.style.display = 'flex';
                } else {
                    alert("Une erreur est survenue lors de l'envoi du formulaire. Veuillez réessayer.");
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert("Une erreur de réseau est survenue. Veuillez vérifier votre connexion.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        } else {
            form.reportValidity();
        }
    });

    // --- Test Auto-fill Logic ---
    window.fillTestData = () => {
        const dummyData = {
            'email': 'test.candidat@example.com',
            'nom': 'Dupont',
            'prenom': 'Jean',
            'adresse': '123 Rue de la République',
            'cp': '34000',
            'ville': 'Montpellier',
            'telephone': '+33612345678',
            'contact': 'Indeed',
            'activite': 'Étudiant en Master',
            'herault': ['Mauguio', 'Lunel'],
            'gard': ['Nîmes'],
            'transport': 'Voiture/Moto',
            'dispo_juillet': 'Oui',
            'dispo_16h': 'Oui',
            'heures': '5h à 15h',
            'anglais[]': ['Collège', 'Lycée'],
            'maths[]': ['Primaire', 'Collège'],
            'spec': ['AMC', 'Philosophie'],
            'raisons': 'Je souhaite partager mes connaissances et aider les élèves à progresser.',
            'difference': 'Le soutien scolaire est un accompagnement global, tandis que l\'aide aux devoirs est plus ponctuelle sur des tâches précises.',
            'competences': 'Pédagogie, patience, rigueur et empathie.',
            'attentes': 'Une structure sérieuse et un accompagnement de qualité.',
            'exp_aucune': 'Ponctuel', // Selection for one of the experience radios
            'troubles': 'Déjà entendu parler'
        };

        // Reset all inputs first
        form.reset();
        document.querySelectorAll('.checkbox-item').forEach(parent => {
            parent.style.borderColor = 'transparent';
            parent.style.background = '#F9F9F9';
        });

        // Fill text, email, tel, textarea
        for (const [key, value] of Object.entries(dummyData)) {
            const elements = form.elements[key];
            if (elements) {
                if (elements.nodeName === 'INPUT' || elements.nodeName === 'TEXTAREA') {
                    if (elements.type === 'radio' || elements.type === 'checkbox') {
                        // handled later
                    } else {
                        elements.value = value;
                    }
                } else if (elements instanceof RadioNodeList || elements.length > 0) {
                    // Handled later
                }
            }
        }

        // Handle specific groups
        Object.entries(dummyData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(val => {
                    const cb = form.querySelector(`input[name="${key}"][value="${val}"]`) ||
                        form.querySelector(`input[name="${key.replace('[]', '')}[]"][value="${val}"]`);
                    if (cb) cb.checked = true;
                });
            } else {
                const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
            }
        });

        // Trigger events to update UI and formatters
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        console.log("Test data filled.");
    };

    // Checkboxes & Radios feedback
    document.querySelectorAll('.checkbox-item input').forEach(cb => {
        cb.addEventListener('change', () => {
            const parent = cb.parentElement;
            if (cb.type === 'radio') {
                const name = cb.name;
                document.querySelectorAll(`input[name="${name}"]`).forEach(peer => {
                    peer.parentElement.style.borderColor = 'transparent';
                    peer.parentElement.style.background = '#F9F9F9';
                });
            }
            if (cb.checked) {
                parent.style.borderColor = 'var(--primary-color)';
                parent.style.background = 'rgba(217, 83, 79, 0.05)';
            } else {
                parent.style.borderColor = 'transparent';
                parent.style.background = '#F9F9F9';
            }
        });
    });

    document.querySelectorAll('.teaching-table input').forEach(input => {
        input.addEventListener('change', () => {
            const row = input.closest('tr');
            if (input.checked) {
                row.style.background = 'rgba(217, 83, 79, 0.02)';
            } else {
                const isAnyChecked = Array.from(row.querySelectorAll('input')).some(i => i.checked);
                if (!isAnyChecked) { row.style.background = 'transparent'; }
            }
        });
    });
});

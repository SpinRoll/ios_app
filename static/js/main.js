document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements object
    let elements = {
        modalContainer: null,
        screens: [],
        dots: [],
        buttons: [],
        backButton: null,
        cancelButton: null,
        businessCardForm: null,
        generateCardButton: null,
        downloadQRButton: null,
        qrCodeContainer: null,
        loadingSpinner: null,
        timeElement: null,
        toggles: []
    };

    // State management
    let state = {
        currentScreen: 0,
        startY: 0,
        currentY: 0,
        isDragging: false,
        isAnimating: false,
        cardData: null,
        lastTap: 0,
        darkMode: false,
        hapticsEnabled: true
    };

    // iOS-style haptic feedback (if available)
    function hapticFeedback(style = 'medium') {
        if ('vibrate' in navigator && state.hapticsEnabled) {
            switch(style) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(15);
                    break;
                case 'heavy':
                    navigator.vibrate([20, 10, 20]);
                    break;
            }
        }
    }

    function showIOSAlert(message) {
        hapticFeedback('medium');
        
        const alertEl = document.createElement('div');
        alertEl.className = 'ios-alert';
        alertEl.innerHTML = `
            <div class="ios-alert-content">
                <h3>Alert</h3>
                <p>${message}</p>
                <button class="ios-alert-button">OK</button>
            </div>
        `;
        document.body.appendChild(alertEl);

        // Add show class after a brief delay for animation
        requestAnimationFrame(() => alertEl.classList.add('show'));

        const button = alertEl.querySelector('.ios-alert-button');
        button?.addEventListener('click', () => {
            hapticFeedback('light');
            alertEl.classList.remove('show');
            setTimeout(() => alertEl.remove(), 300);
        });
    }

    function initializeElements() {
        try {
            // Critical elements
            const modalContainer = document.querySelector('.modal-container');
            const screens = Array.from(document.querySelectorAll('.screen'));
            
            if (!modalContainer || screens.length === 0) {
                console.error('Critical elements missing');
                return false;
            }

            // Initialize all elements
            elements = {
                modalContainer,
                screens,
                dots: Array.from(document.querySelectorAll('.dot')),
                buttons: Array.from(document.querySelectorAll('.ios-button')),
                backButton: document.querySelector('.back-button'),
                cancelButton: document.querySelector('.cancel-button'),
                businessCardForm: document.querySelector('#businessCardForm'),
                generateCardButton: document.querySelector('#generateCard'),
                downloadQRButton: document.querySelector('#downloadQR'),
                qrCodeContainer: document.querySelector('#qrCode'),
                loadingSpinner: document.querySelector('.loading-spinner'),
                timeElement: document.querySelector('.time'),
                toggles: Array.from(document.querySelectorAll('.ios-toggle input'))
            };

            // Set initial states
            if (elements.screens[0]?.style) {
                elements.screens[0].style.display = 'block';
                elements.screens[0].classList.add('active');
            }

            // Initialize navigation buttons
            if (elements.backButton?.style) {
                elements.backButton.style.display = 'none';
            }
            if (elements.cancelButton?.style) {
                elements.cancelButton.style.display = 'none';
            }

            // Initialize toggles
            elements.toggles?.forEach(toggle => {
                if (toggle?.parentElement) {
                    const wrapper = toggle.parentElement;
                    wrapper.addEventListener('click', (e) => {
                        e.preventDefault();
                        hapticFeedback('light');
                        toggle.checked = !toggle.checked;
                        
                        if (toggle.id === 'darkModeToggle') {
                            state.darkMode = toggle.checked;
                            document.body.classList.toggle('dark-mode', state.darkMode);
                            localStorage.setItem('darkMode', state.darkMode);
                        } else if (toggle.id === 'hapticsToggle') {
                            state.hapticsEnabled = toggle.checked;
                            localStorage.setItem('hapticsEnabled', state.hapticsEnabled);
                        }
                    });
                }
            });

            return true;
        } catch (error) {
            console.error('Error initializing elements:', error);
            return false;
        }
    }

    function setupEventListeners() {
        try {
            // Modal container touch events
            elements.modalContainer?.addEventListener('touchstart', handleTouchStart, { passive: false });
            elements.modalContainer?.addEventListener('touchmove', handleTouchMove, { passive: false });
            elements.modalContainer?.addEventListener('touchend', handleTouchEnd);

            // Button event listeners
            elements.buttons?.forEach(button => {
                if (!button) return;
                
                button.addEventListener('touchstart', () => {
                    hapticFeedback('light');
                    button.classList?.add('touch-active');
                });
                
                button.addEventListener('touchend', () => {
                    button.classList?.remove('touch-active');
                });

                button.addEventListener('click', () => {
                    hapticFeedback('medium');
                    if (button.id === 'generateCard') {
                        handleFormSubmit();
                    } else if (button.id === 'downloadQR') {
                        downloadQRCode();
                    } else {
                        updateScreen('next');
                    }
                });
            });

            // Navigation buttons
            elements.backButton?.addEventListener('click', () => {
                hapticFeedback('medium');
                if (state.currentScreen > 0) {
                    updateScreen('prev');
                }
            });

            elements.cancelButton?.addEventListener('click', () => {
                hapticFeedback('medium');
                while (state.currentScreen > 0) {
                    updateScreen('prev');
                }
            });

            // Form submission
            elements.businessCardForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                handleFormSubmit();
            });

            // Double tap prevention
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (state.lastTap && (now - state.lastTap) < 300) {
                    e.preventDefault();
                }
                state.lastTap = now;
            });

        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    // Initialize the application
    try {
        if (initializeElements()) {
            setupEventListeners();
            setupFormInputs();
            updateTime();
            setInterval(updateTime, 60000);
        }
    } catch (error) {
        console.error('Application initialization error:', error);
    }

    function showFormError(input, message) {
        if (!input) return;
        
        const wrapper = input.closest('.ios-input-wrapper');
        if (wrapper) {
            hapticFeedback('light');
            wrapper.classList.add('error');
            const errorEl = wrapper.querySelector('.error-message') || document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.textContent = message;
            if (!wrapper.querySelector('.error-message')) {
                wrapper.appendChild(errorEl);
            }
        }
    }

    function clearFormErrors() {
        document.querySelectorAll('.ios-input-wrapper.error').forEach(wrapper => {
            wrapper.classList.remove('error');
            const errorEl = wrapper.querySelector('.error-message');
            if (errorEl) errorEl.remove();
        });
    }

    function updateTime() {
        if (elements.timeElement) {
            const now = new Date();
            elements.timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    }

    function generateVCard(formData) {
        const vCard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${formData.surname};${formData.name}`,
            `FN:${formData.name} ${formData.surname}`,
            `TEL:${formData.phone}`,
            formData.notes ? `NOTE:${formData.notes}` : '',
            'END:VCARD'
        ].filter(Boolean).join('\n');

        return vCard;
    }

    function generateQRCode(vCardData) {
        if (!elements.qrCodeContainer) return;
        
        const container = elements.qrCodeContainer.parentElement;
        if (!container) return;

        elements.qrCodeContainer.innerHTML = '';
        container.classList.add('loading');
        
        setTimeout(() => {
            try {
                const qr = qrcode(0, 'M');
                qr.addData(vCardData);
                qr.make();
                
                elements.qrCodeContainer.innerHTML = qr.createImgTag(5);
                container.classList.remove('loading');
                hapticFeedback('light');

                // Add success feedback
                const successEl = document.createElement('div');
                successEl.className = 'success-message';
                successEl.textContent = 'QR Code generated successfully!';
                container.appendChild(successEl);
                setTimeout(() => successEl.remove(), 3000);
            } catch (error) {
                console.error('Error generating QR code:', error);
                elements.qrCodeContainer.innerHTML = '<p class="error-text">Error generating QR code</p>';
                container.classList.remove('loading');
                showIOSAlert('Failed to generate QR code. Please try again.');
            }
        }, 500);
    }

    function setupFormInputs() {
        const inputs = document.querySelectorAll('.ios-input, .ios-textarea');
        inputs.forEach(input => {
            if (input instanceof HTMLElement) {
                input.setAttribute('placeholder', ' ');
                
                // Add touch feedback
                input.addEventListener('touchstart', () => {
                    hapticFeedback('light');
                    input.classList.add('touch-active');
                });
                
                input.addEventListener('touchend', () => {
                    input.classList.remove('touch-active');
                });

                // Clear error on input
                input.addEventListener('input', () => {
                    const wrapper = input.closest('.ios-input-wrapper');
                    if (wrapper) {
                        wrapper.classList.remove('error');
                        const errorEl = wrapper.querySelector('.error-message');
                        if (errorEl) errorEl.remove();
                    }
                });
            }
        });
    }

    function validateForm() {
        clearFormErrors();
        let isValid = true;

        const nameInput = elements.businessCardForm?.querySelector('#name');
        const surnameInput = elements.businessCardForm?.querySelector('#surname');
        const phoneInput = elements.businessCardForm?.querySelector('#phone');

        if (!nameInput?.value) {
            showFormError(nameInput, 'Please enter your first name');
            isValid = false;
        }

        if (!surnameInput?.value) {
            showFormError(surnameInput, 'Please enter your last name');
            isValid = false;
        }

        if (!phoneInput?.value) {
            showFormError(phoneInput, 'Please enter your phone number');
            isValid = false;
        } else if (!/^\+?\d{10,}$/.test(phoneInput.value)) {
            showFormError(phoneInput, 'Please enter a valid phone number');
            isValid = false;
        }

        return isValid;
    }

    function handleFormSubmit(e) {
        if (e) e.preventDefault();
        
        if (!validateForm()) {
            hapticFeedback('heavy');
            showIOSAlert('Please correct the errors in the form.');
            return;
        }

        hapticFeedback('medium');

        const formData = {
            name: elements.businessCardForm?.querySelector('#name')?.value || '',
            surname: elements.businessCardForm?.querySelector('#surname')?.value || '',
            phone: elements.businessCardForm?.querySelector('#phone')?.value || '',
            notes: elements.businessCardForm?.querySelector('#notes')?.value || ''
        };

        const vCardData = generateVCard(formData);
        state.cardData = vCardData;
        
        updateScreen('next');
        generateQRCode(vCardData);
    }

    function downloadQRCode() {
        const qrImage = elements.qrCodeContainer?.querySelector('img');
        if (!qrImage) {
            showIOSAlert('No QR code available to download');
            return;
        }

        hapticFeedback('medium');

        const link = document.createElement('a');
        link.download = 'business-card-qr.png';
        link.href = qrImage.src;
        link.click();

        showIOSAlert('QR code downloaded successfully!');
    }

    function updateScreen(direction = 'next') {
        if (state.isAnimating || !elements.screens) return;
        
        try {
            state.isAnimating = true;

            const currentScreen = elements.screens[state.currentScreen];
            const nextScreenIndex = direction === 'next' ? 
                state.currentScreen + 1 : 
                state.currentScreen - 1;

            if (!currentScreen?.style || nextScreenIndex < 0 || nextScreenIndex >= elements.screens.length) {
                state.isAnimating = false;
                return;
            }

            const nextScreen = elements.screens[nextScreenIndex];
            if (!nextScreen?.style) {
                state.isAnimating = false;
                return;
            }

            // Update screen display
            nextScreen.style.display = 'block';
            currentScreen.classList.remove('active');
            currentScreen.classList.add('exit');
            nextScreen.classList.add('active');

            // Update dots
            elements.dots?.forEach((dot, index) => {
                if (!dot?.classList) return;
                dot.classList.toggle('active', index === nextScreenIndex);
            });

            // Update navigation
            if (elements.backButton?.style) {
                elements.backButton.style.display = nextScreenIndex > 0 ? 'flex' : 'none';
            }
            if (elements.cancelButton?.style) {
                elements.cancelButton.style.display = nextScreenIndex > 0 ? 'flex' : 'none';
            }

            // Reset after animation
            setTimeout(() => {
                if (currentScreen?.style) {
                    currentScreen.classList.remove('exit');
                    currentScreen.style.display = 'none';
                }
                state.currentScreen = nextScreenIndex;
                state.isAnimating = false;
            }, 500);

        } catch (error) {
            console.error('Error updating screen:', error);
            state.isAnimating = false;
        }
    }

    function handleTouchStart(e) {
        if (!e.touches) return;
        state.isDragging = true;
        state.startY = e.touches[0].clientY;
        state.currentY = state.startY;
    }

    function handleTouchMove(e) {
        if (!state.isDragging || !e.touches) return;
        e.preventDefault();
        state.currentY = e.touches[0].clientY;

        const diff = state.currentY - state.startY;
        const currentScreen = elements.screens[state.currentScreen];
        
        // Safe style update with null check
        if (currentScreen?.style) {
            currentScreen.style.transform = `translateY(${diff}px)`;
        }
    }

    function handleTouchEnd() {
        if (!state.isDragging) return;
        
        state.isDragging = false;
        const diff = state.currentY - state.startY;
        const threshold = window.innerHeight * 0.2;

        const currentScreen = elements.screens[state.currentScreen];
        if (currentScreen?.style) {
            currentScreen.style.transform = '';
        }

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && state.currentScreen > 0) {
                hapticFeedback('medium');
                updateScreen('prev');
            } else if (diff < 0 && state.currentScreen < elements.screens.length - 1) {
                hapticFeedback('medium');
                updateScreen('next');
            }
        }
    }

    // Initialize when DOM is ready
    function init() {
        try {
            // Initialize elements
            if (!initializeElements()) {
                console.error('Failed to initialize elements');
                return;
            }

            // Setup event listeners and start the app
            setupEventListeners();
            setupFormInputs();
            updateTime();
            setInterval(updateTime, 60000);

            // Initialize dark mode from localStorage
            const savedDarkMode = localStorage.getItem('darkMode') === 'true';
            if (savedDarkMode) {
                const darkModeToggle = document.getElementById('darkModeToggle');
                if (darkModeToggle) {
                    darkModeToggle.checked = true;
                    document.body.classList.add('dark-mode');
                }
            }

            // Initialize haptics from localStorage
            const savedHaptics = localStorage.getItem('hapticsEnabled') !== 'false';
            const hapticsToggle = document.getElementById('hapticsToggle');
            if (hapticsToggle) {
                hapticsToggle.checked = savedHaptics;
                state.hapticsEnabled = savedHaptics;
            }

        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    // Call init to start the application
    init();
});
document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements object with proper null checks
    const elements = {
        modalContainer: document.querySelector('.modal-container'),
        screens: Array.from(document.querySelectorAll('.screen') || []),
        dots: Array.from(document.querySelectorAll('.dot') || []),
        buttons: Array.from(document.querySelectorAll('.ios-button') || []),
        backButton: document.querySelector('.back-button'),
        cancelButton: document.querySelector('.cancel-button'),
        businessCardForm: document.getElementById('businessCardForm'),
        generateCardButton: document.getElementById('generateCard'),
        downloadQRButton: document.getElementById('downloadQR'),
        qrCodeContainer: document.getElementById('qrCode'),
        loadingSpinner: document.querySelector('.loading-spinner'),
        toggles: Array.from(document.querySelectorAll('.ios-toggle input') || [])
    };

    // Validate critical elements
    if (!elements.modalContainer || elements.screens.length === 0) {
        console.error('Critical elements missing');
        return;
    }

    // State management with persistent storage
    const state = {
        currentScreen: 0,
        startY: 0,
        currentY: 0,
        isDragging: false,
        isAnimating: false,
        cardData: null,
        lastTap: 0,
        darkMode: localStorage.getItem('darkMode') === 'true',
        hapticsEnabled: localStorage.getItem('hapticsEnabled') !== 'false'
    };

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

    // Initialize the application
    function init() {
        try {
            // Set initial screen state with proper visibility
            elements.screens.forEach((screen, index) => {
                if (!screen) return;
                
                if (index === 0) {
                    screen.style.visibility = 'visible';
                    screen.classList.add('active');
                    screen.style.opacity = '1';
                } else {
                    screen.style.visibility = 'hidden';
                    screen.classList.remove('active');
                    screen.style.opacity = '0';
                }
            });

            // Initialize navigation buttons
            if (elements.backButton) {
                elements.backButton.style.display = 'none';
                elements.backButton.style.visibility = 'visible';
            }
            if (elements.cancelButton) {
                elements.cancelButton.style.display = 'none';
                elements.cancelButton.style.visibility = 'visible';
            }

            // Setup event listeners
            setupEventListeners();
            setupFormInputs();

            // Initialize dark mode
            if (state.darkMode) {
                const darkModeToggle = document.getElementById('darkModeToggle');
                if (darkModeToggle) {
                    darkModeToggle.checked = true;
                    document.body.classList.add('dark-mode');
                }
            }

            // Initialize haptics
            const hapticsToggle = document.getElementById('hapticsToggle');
            if (hapticsToggle) {
                hapticsToggle.checked = state.hapticsEnabled;
            }

        } catch (error) {
            console.error('Initialization error:', error);
            // Recovery attempt
            const firstScreen = elements.screens[0];
            if (firstScreen) {
                firstScreen.style.visibility = 'visible';
                firstScreen.classList.add('active');
                firstScreen.style.opacity = '1';
            }
        }
    }

    function setupEventListeners() {
        // Modal container touch events with null checks
        if (elements.modalContainer) {
            elements.modalContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            elements.modalContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            elements.modalContainer.addEventListener('touchend', handleTouchEnd);
        }

        // Button event listeners with null checks
        elements.buttons.forEach(button => {
            if (!button) return;
            
            button.addEventListener('touchstart', () => {
                hapticFeedback('light');
                button.classList.add('touch-active');
            });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('touch-active');
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

        // Navigation buttons with null checks
        if (elements.backButton) {
            elements.backButton.addEventListener('click', () => {
                hapticFeedback('medium');
                if (state.currentScreen > 0) {
                    updateScreen('prev');
                }
            });
        }

        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', () => {
                hapticFeedback('medium');
                while (state.currentScreen > 0) {
                    updateScreen('prev');
                }
            });
        }

        // Form submission with null check
        if (elements.businessCardForm) {
            elements.businessCardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleFormSubmit();
            });
        }

        // Toggle switches with null checks
        elements.toggles.forEach(toggle => {
            if (!toggle || !toggle.parentElement) return;
            
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
        });
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
        const timeElement = document.querySelector('.time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', {
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

            if (!currentScreen || nextScreenIndex < 0 || nextScreenIndex >= elements.screens.length) {
                state.isAnimating = false;
                console.error('Invalid screen transition attempted');
                return;
            }

            const nextScreen = elements.screens[nextScreenIndex];
            if (!nextScreen) {
                state.isAnimating = false;
                console.error('Next screen element not found');
                return;
            }

            // Reset any existing transitions
            elements.screens.forEach(screen => {
                if (screen && screen !== currentScreen && screen !== nextScreen) {
                    screen.style.visibility = 'hidden';
                    screen.classList.remove('active', 'exit');
                }
            });

            // Setup next screen
            nextScreen.style.visibility = 'visible';
            nextScreen.style.opacity = '0';

            // Start transition
            requestAnimationFrame(() => {
                currentScreen.classList.remove('active');
                currentScreen.classList.add('exit');
                
                // Force a reflow to ensure the transition works
                void nextScreen.offsetWidth;
                
                nextScreen.classList.add('active');

                // Update dots
                elements.dots?.forEach((dot, index) => {
                    if (!dot?.classList) return;
                    dot.classList.toggle('active', index === nextScreenIndex);
                });

                // Update navigation
                if (elements.backButton) {
                    elements.backButton.style.display = nextScreenIndex > 0 ? 'flex' : 'none';
                }
                if (elements.cancelButton) {
                    elements.cancelButton.style.display = nextScreenIndex > 0 ? 'flex' : 'none';
                }

                // Reset after animation
                setTimeout(() => {
                    currentScreen.classList.remove('exit');
                    currentScreen.style.visibility = 'hidden';
                    state.currentScreen = nextScreenIndex;
                    state.isAnimating = false;
                }, 500);
            });

        } catch (error) {
            console.error('Error updating screen:', error);
            state.isAnimating = false;
            
            // Attempt to recover from error
            elements.screens.forEach(screen => {
                if (screen) {
                    screen.style.visibility = 'hidden';
                    screen.classList.remove('active', 'exit');
                }
            });

            const firstScreen = elements.screens[0];
            if (firstScreen) {
                firstScreen.style.visibility = 'visible';
                firstScreen.classList.add('active');
                state.currentScreen = 0;
            }
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

    // Add new UI component handlers
    function initializeIOSComponents() {
        // Bottom Sheet Modal
        const sheet = document.querySelector('.ios-sheet-modal');
        let startY = 0;
        let currentY = 0;
        let initialSheetHeight = 0;

        function handleSheetTouchStart(e) {
            startY = e.touches[0].clientY;
            initialSheetHeight = sheet.getBoundingClientRect().height;
            sheet.style.transition = 'none';
        }

        function handleSheetTouchMove(e) {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0) {
                sheet.style.transform = `translateY(${diff}px)`;
            }
        }

        function handleSheetTouchEnd() {
            sheet.style.transition = 'transform 0.3s ease';
            if (currentY - startY > initialSheetHeight * 0.3) {
                closeSheet();
            } else {
                sheet.style.transform = 'translateY(0)';
            }
        }

        if (sheet) {
            sheet.addEventListener('touchstart', handleSheetTouchStart);
            sheet.addEventListener('touchmove', handleSheetTouchMove);
            sheet.addEventListener('touchend', handleSheetTouchEnd);
        }

        // Action Sheet
        const actionSheet = document.querySelector('.ios-action-sheet');
        if (actionSheet) {
            actionSheet.addEventListener('click', (e) => {
                if (e.target === actionSheet) {
                    closeActionSheet();
                }
            });
        }

        // Segmented Control
        const segmentedControls = document.querySelectorAll('.ios-segmented-control');
        segmentedControls.forEach(control => {
            control.addEventListener('click', (e) => {
                if (e.target.classList.contains('segment-button')) {
                    const buttons = control.querySelectorAll('.segment-button');
                    buttons.forEach(button => button.classList.remove('selected'));
                    e.target.classList.add('selected');
                    hapticFeedback('light');
                }
            });
        });

        // Context Menu
        let activeContextMenu = null;
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('context-menu-trigger')) {
                e.preventDefault();
                showContextMenu(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (activeContextMenu && !e.target.closest('.ios-context-menu')) {
                closeContextMenu();
            }
        });
    }

    function showSheet() {
        const sheet = document.querySelector('.ios-sheet-modal');
        if (sheet) {
            sheet.classList.add('show');
            hapticFeedback('medium');
        }
    }

    function closeSheet() {
        const sheet = document.querySelector('.ios-sheet-modal');
        if (sheet) {
            sheet.classList.remove('show');
            hapticFeedback('light');
        }
    }

    function showActionSheet(options) {
        const existingSheet = document.querySelector('.ios-action-sheet');
        if (existingSheet) {
            existingSheet.remove();
        }

        const sheet = document.createElement('div');
        sheet.className = 'ios-action-sheet';
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'action-sheet-button';
            if (option.destructive) {
                button.classList.add('destructive');
            }
            button.textContent = option.text;
            button.onclick = () => {
                option.action();
                closeActionSheet();
            };
            sheet.appendChild(button);
        });

        const cancelButton = document.createElement('button');
        cancelButton.className = 'action-sheet-button action-sheet-cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = closeActionSheet;
        sheet.appendChild(cancelButton);

        document.body.appendChild(sheet);
        requestAnimationFrame(() => {
            sheet.classList.add('show');
            hapticFeedback('medium');
        });
    }

    function closeActionSheet() {
        const sheet = document.querySelector('.ios-action-sheet');
        if (sheet) {
            sheet.classList.remove('show');
            hapticFeedback('light');
            setTimeout(() => sheet.remove(), 300);
        }
    }

    function showContextMenu(event) {
        closeContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'ios-context-menu';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        
        // Adjust position if menu would go off screen
        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = `${window.innerWidth - rect.width - 10}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = `${window.innerHeight - rect.height - 10}px`;
            }
        });

        document.body.appendChild(menu);
        activeContextMenu = menu;
        requestAnimationFrame(() => menu.classList.add('show'));
        hapticFeedback('light');
    }

    function closeContextMenu() {
        if (activeContextMenu) {
            activeContextMenu.classList.remove('show');
            setTimeout(() => {
                activeContextMenu.remove();
                activeContextMenu = null;
            }, 200);
            hapticFeedback('light');
        }
    }

    // Initialize components when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        init();
        initializeIOSComponents();
        
        // Update time every minute
        updateTime();
        setInterval(updateTime, 60000);
    });
});
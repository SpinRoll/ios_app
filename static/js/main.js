document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements with error handling
    let elements = {
        modalContainer: null,
        modal: null,
        modalContent: null,
        screens: [],
        dots: [],
        buttons: [],
        backButton: null,
        cancelButton: null,
        toggleSwitch: null,
        closeButton: null
    };

    // State management
    let state = {
        currentScreen: 0,
        startY: 0,
        currentY: 0,
        isDragging: false,
        isAnimating: false
    };

    function initializeElements() {
        try {
            // Query all required elements
            elements.modalContainer = document.querySelector('.modal-container');
            elements.modal = document.querySelector('.modal');
            elements.modalContent = document.querySelector('.modal-content');
            elements.screens = Array.from(document.querySelectorAll('.screen'));
            elements.dots = Array.from(document.querySelectorAll('.dot'));
            elements.buttons = Array.from(document.querySelectorAll('.ios-button'));
            elements.backButton = document.querySelector('.back-button');
            elements.cancelButton = document.querySelector('.cancel-button');
            elements.toggleSwitch = document.querySelector('.ios-toggle input');
            elements.closeButton = document.querySelector('.close-button');

            // Validate required elements
            if (!elements.modalContainer) throw new Error('Modal container not found');
            if (elements.screens.length === 0) throw new Error('No screen elements found');
            if (elements.dots.length === 0) throw new Error('No dot elements found');

            // Set initial states
            const firstScreen = elements.screens[0];
            if (firstScreen) {
                firstScreen.classList.add('active');
            }
            
            if (elements.backButton) {
                elements.backButton.style.display = 'none';
            }

            return true;
        } catch (error) {
            console.warn('Error initializing elements:', error);
            return false;
        }
    }

    function updateScreen(direction = 'next') {
        if (state.isAnimating) return;
        
        try {
            state.isAnimating = true;
            const currentScreen = elements.screens[state.currentScreen];
            const nextScreenIndex = direction === 'next' ? 
                state.currentScreen + 1 : 
                state.currentScreen - 1;
            
            if (nextScreenIndex < 0 || nextScreenIndex >= elements.screens.length) {
                state.isAnimating = false;
                return;
            }

            const nextScreen = elements.screens[nextScreenIndex];
            
            if (!currentScreen || !nextScreen) {
                state.isAnimating = false;
                return;
            }

            // Update screens
            currentScreen.classList.remove('active');
            currentScreen.classList.add('exit');
            nextScreen.classList.add('active');

            // Update dots
            elements.dots.forEach((dot, index) => {
                if (dot) {
                    dot.classList.toggle('active', index === nextScreenIndex);
                }
            });

            // Update back button visibility
            if (elements.backButton) {
                elements.backButton.style.display = nextScreenIndex > 0 ? 'flex' : 'none';
            }

            // Update state after animation
            setTimeout(() => {
                if (currentScreen) {
                    currentScreen.classList.remove('exit');
                }
                state.currentScreen = nextScreenIndex;
                state.isAnimating = false;
            }, 500);
        } catch (error) {
            console.warn('Error updating screen:', error);
            state.isAnimating = false;
        }
    }

    function setupEventListeners() {
        try {
            if (!elements.modalContainer) return;

            // Touch events for modal container
            elements.modalContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            elements.modalContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            elements.modalContainer.addEventListener('touchend', handleTouchEnd);

            // Continue buttons
            elements.buttons.forEach((button, index) => {
                if (button && index < elements.screens.length - 1) {
                    button.addEventListener('click', () => {
                        if (button) {
                            button.style.transform = 'scale(0.98)';
                            button.style.opacity = '0.9';

                            setTimeout(() => {
                                if (button) {
                                    button.style.transform = '';
                                    button.style.opacity = '';
                                    updateScreen('next');
                                }
                            }, 150);
                        }
                    });
                }
            });

            // Back button
            if (elements.backButton) {
                elements.backButton.addEventListener('click', () => {
                    if (state.currentScreen > 0) {
                        updateScreen('prev');
                    }
                });
            }

            // Cancel button
            if (elements.cancelButton) {
                elements.cancelButton.addEventListener('click', () => {
                    while (state.currentScreen > 0) {
                        updateScreen('prev');
                    }
                });
            }

            // Close button
            if (elements.closeButton) {
                elements.closeButton.addEventListener('click', () => {
                    if (elements.modal) {
                        elements.modal.classList.remove('active');
                        elements.modal.classList.add('exit');
                        setTimeout(() => {
                            if (elements.modal) {
                                elements.modal.classList.remove('exit');
                            }
                        }, 500);
                    }
                });
            }

            // Toggle switch animation
            if (elements.toggleSwitch) {
                const settingOption = elements.toggleSwitch.closest('.setting-option');
                if (settingOption) {
                    elements.toggleSwitch.addEventListener('change', () => {
                        settingOption.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            if (settingOption) {
                                settingOption.style.transform = '';
                            }
                        }, 150);
                    });
                }
            }

            // Prevent default touch behavior
            if (document.body) {
                document.body.addEventListener('touchmove', (e) => {
                    if (state.isDragging) {
                        e.preventDefault();
                    }
                }, { passive: false });
            }

        } catch (error) {
            console.warn('Error setting up event listeners:', error);
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
    }

    function handleTouchEnd() {
        if (!state.isDragging) return;
        
        state.isDragging = false;
        const diff = state.currentY - state.startY;
        const threshold = window.innerHeight * 0.2;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && state.currentScreen > 0) {
                updateScreen('prev');
            } else if (diff < 0 && state.currentScreen < elements.screens.length - 1) {
                updateScreen('next');
            }
        }
    }

    // Initialize and setup
    if (initializeElements()) {
        setupEventListeners();
    }
});

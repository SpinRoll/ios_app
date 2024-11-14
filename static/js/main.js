document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements with error handling
    let elements = {
        modalContainer: null,
        screens: [],
        dots: [],
        buttons: [],
        backButton: null,
        cancelButton: null,
        toggleSwitch: null
    };

    try {
        // Query all required elements
        elements = {
            modalContainer: document.querySelector('.modal-container'),
            screens: Array.from(document.querySelectorAll('.screen') || []),
            dots: Array.from(document.querySelectorAll('.dot') || []),
            buttons: Array.from(document.querySelectorAll('.ios-button') || []),
            backButton: document.querySelector('.back-button'),
            cancelButton: document.querySelector('.cancel-button'),
            toggleSwitch: document.querySelector('.ios-toggle input')
        };

        // Validate required elements
        if (!elements.modalContainer) {
            throw new Error('Modal container element not found');
        }
        if (elements.screens.length === 0) {
            throw new Error('No screen elements found');
        }
        if (elements.dots.length === 0) {
            throw new Error('No dot elements found');
        }
    } catch (error) {
        console.warn('Error initializing DOM elements:', error);
        return;
    }

    // State management
    let state = {
        currentScreen: 0,
        startY: 0,
        currentY: 0,
        isDragging: false,
        isAnimating: false
    };

    // Set initial states
    try {
        elements.screens[0]?.classList.add('active');
        if (elements.backButton) {
            elements.backButton.style.display = 'none';
        }
    } catch (error) {
        console.warn('Error setting initial states:', error);
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
                currentScreen.classList.remove('exit');
                state.currentScreen = nextScreenIndex;
                state.isAnimating = false;
            }, 500);
        } catch (error) {
            console.warn('Error updating screen:', error);
            state.isAnimating = false;
        }
    }

    function handleTouchStart(e) {
        try {
            if (!e.touches) return;
            state.isDragging = true;
            state.startY = e.touches[0].clientY;
            state.currentY = state.startY;
        } catch (error) {
            console.warn('Error handling touch start:', error);
        }
    }

    function handleTouchMove(e) {
        try {
            if (!state.isDragging || !e.touches) return;
            e.preventDefault();
            state.currentY = e.touches[0].clientY;
        } catch (error) {
            console.warn('Error handling touch move:', error);
        }
    }

    function handleTouchEnd() {
        try {
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
        } catch (error) {
            console.warn('Error handling touch end:', error);
        }
    }

    // Add event listeners with error handling
    try {
        // Touch events for modal container
        if (elements.modalContainer) {
            elements.modalContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            elements.modalContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            elements.modalContainer.addEventListener('touchend', handleTouchEnd);
        }

        // Continue buttons
        elements.buttons.forEach((button, index) => {
            if (button && index < elements.screens.length - 1) {
                button.addEventListener('click', () => {
                    try {
                        button.style.transform = 'scale(0.98)';
                        button.style.opacity = '0.9';

                        setTimeout(() => {
                            button.style.transform = '';
                            button.style.opacity = '';
                            updateScreen('next');
                        }, 150);
                    } catch (error) {
                        console.warn('Error handling button click:', error);
                    }
                });
            }
        });

        // Back button
        if (elements.backButton) {
            elements.backButton.addEventListener('click', () => {
                try {
                    if (state.currentScreen > 0) {
                        updateScreen('prev');
                    }
                } catch (error) {
                    console.warn('Error handling back button:', error);
                }
            });
        }

        // Cancel button
        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', () => {
                try {
                    while (state.currentScreen > 0) {
                        updateScreen('prev');
                    }
                } catch (error) {
                    console.warn('Error handling cancel button:', error);
                }
            });
        }

        // Toggle switch
        if (elements.toggleSwitch) {
            const settingOption = elements.toggleSwitch.closest('.setting-option');
            if (settingOption) {
                elements.toggleSwitch.addEventListener('change', () => {
                    try {
                        settingOption.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            settingOption.style.transform = '';
                        }, 150);
                    } catch (error) {
                        console.warn('Error handling toggle switch:', error);
                    }
                });
            }
        }

        // Prevent default touch behavior
        document.body.addEventListener('touchmove', (e) => {
            if (state.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });

    } catch (error) {
        console.warn('Error setting up event listeners:', error);
    }
});

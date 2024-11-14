document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements with error handling
    let elements = {
        carousel: null,
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
            carousel: document.querySelector('.carousel'),
            screens: Array.from(document.querySelectorAll('.screen') || []),
            dots: Array.from(document.querySelectorAll('.dot') || []),
            buttons: Array.from(document.querySelectorAll('.ios-button') || []),
            backButton: document.querySelector('.back-button'),
            cancelButton: document.querySelector('.cancel-button'),
            toggleSwitch: document.querySelector('.ios-toggle input')
        };

        // Validate required elements
        if (!elements.carousel) {
            throw new Error('Carousel element not found');
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
        startX: 0,
        currentX: 0,
        isDragging: false
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

    function updateCarousel(animate = true) {
        try {
            if (!elements.carousel) return;

            // Update carousel transform
            elements.carousel.style.transition = animate ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
            elements.carousel.style.transform = `translateX(-${state.currentScreen * 100}%)`;

            // Update screen states
            elements.screens.forEach((screen, index) => {
                if (screen) {
                    screen.classList.toggle('active', index === state.currentScreen);
                }
            });

            // Update dot states
            elements.dots.forEach((dot, index) => {
                if (dot) {
                    dot.classList.toggle('active', index === state.currentScreen);
                }
            });

            // Update back button visibility
            if (elements.backButton) {
                elements.backButton.style.display = state.currentScreen > 0 ? 'flex' : 'none';
            }
        } catch (error) {
            console.warn('Error updating carousel:', error);
        }
    }

    function handleTouchStart(e) {
        try {
            if (!e.touches || !elements.carousel) return;
            state.isDragging = true;
            state.startX = e.touches[0].clientX;
            state.currentX = state.startX;
            elements.carousel.style.transition = 'none';
        } catch (error) {
            console.warn('Error handling touch start:', error);
        }
    }

    function handleTouchMove(e) {
        try {
            if (!state.isDragging || !elements.carousel || !e.touches) return;

            e.preventDefault();
            state.currentX = e.touches[0].clientX;
            const diff = state.currentX - state.startX;
            const translateX = (-state.currentScreen * 100) + (diff / window.innerWidth * 100);

            // Add resistance at edges
            if (translateX > 0) {
                elements.carousel.style.transform = `translateX(${translateX * 0.3}%)`;
            } else if (translateX < -((elements.screens.length - 1) * 100)) {
                const overscroll = translateX + ((elements.screens.length - 1) * 100);
                elements.carousel.style.transform = `translateX(${-((elements.screens.length - 1) * 100) + (overscroll * 0.3)}%)`;
            } else {
                elements.carousel.style.transform = `translateX(${translateX}%)`;
            }
        } catch (error) {
            console.warn('Error handling touch move:', error);
        }
    }

    function handleTouchEnd() {
        try {
            if (!state.isDragging || !elements.carousel) return;

            state.isDragging = false;
            const diff = state.currentX - state.startX;
            const threshold = window.innerWidth * 0.2;

            if (Math.abs(diff) > threshold) {
                if (diff > 0 && state.currentScreen > 0) {
                    state.currentScreen--;
                } else if (diff < 0 && state.currentScreen < elements.screens.length - 1) {
                    state.currentScreen++;
                }
            }

            updateCarousel(true);
        } catch (error) {
            console.warn('Error handling touch end:', error);
        }
    }

    // Add event listeners with error handling
    try {
        // Touch events for carousel
        if (elements.carousel) {
            elements.carousel.addEventListener('touchstart', handleTouchStart, { passive: false });
            elements.carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
            elements.carousel.addEventListener('touchend', handleTouchEnd);
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
                            state.currentScreen++;
                            updateCarousel(true);
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
                        state.currentScreen--;
                        updateCarousel(true);
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
                    state.currentScreen = 0;
                    updateCarousel(true);
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

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            try {
                const currentScreenEl = elements.screens[state.currentScreen];
                if (!document.hidden && currentScreenEl) {
                    currentScreenEl.classList.add('active');
                }
            } catch (error) {
                console.warn('Error handling visibility change:', error);
            }
        });
    } catch (error) {
        console.warn('Error setting up event listeners:', error);
    }
});

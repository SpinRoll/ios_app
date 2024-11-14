document.addEventListener('DOMContentLoaded', () => {
    // Initialize all DOM elements
    const carousel = document.querySelector('.carousel');
    const screens = Array.from(document.querySelectorAll('.screen'));
    const dots = Array.from(document.querySelectorAll('.dot'));
    const buttons = Array.from(document.querySelectorAll('.ios-button'));
    const backButton = document.querySelector('.back-button');
    const cancelButton = document.querySelector('.cancel-button');
    const toggleSwitch = document.querySelector('.ios-toggle input');

    // Only proceed if required elements exist
    if (!carousel || screens.length === 0 || dots.length === 0) {
        console.warn('Required carousel elements not found');
        return;
    }

    let currentScreen = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Set initial active screen and button states
    screens[0]?.classList.add('active');
    if (backButton) {
        backButton.style.display = 'none';
    }

    function updateCarousel(animate = true) {
        if (!carousel) return;

        carousel.style.transition = animate ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        carousel.style.transform = `translateX(-${currentScreen * 100}%)`;
        
        // Update active states and animations
        screens.forEach((screen, index) => {
            if (screen) {
                screen.classList.toggle('active', index === currentScreen);
            }
        });

        dots.forEach((dot, index) => {
            if (dot) {
                dot.classList.toggle('active', index === currentScreen);
            }
        });

        // Show/hide back button based on screen
        if (backButton) {
            backButton.style.display = currentScreen > 0 ? 'flex' : 'none';
        }
    }

    function handleTouchStart(e) {
        if (!e.touches || !carousel) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        currentX = startX;
        carousel.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging || !carousel || !e.touches) return;
        
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const translateX = (-currentScreen * 100) + (diff / window.innerWidth * 100);
        
        // Add resistance at the edges
        if (translateX > 0) {
            carousel.style.transform = `translateX(${translateX * 0.3}%)`;
        } else if (translateX < -((screens.length - 1) * 100)) {
            const overscroll = translateX + ((screens.length - 1) * 100);
            carousel.style.transform = `translateX(${-((screens.length - 1) * 100) + (overscroll * 0.3)}%)`;
        } else {
            carousel.style.transform = `translateX(${translateX}%)`;
        }
    }

    function handleTouchEnd() {
        if (!isDragging || !carousel) return;
        
        isDragging = false;
        const diff = currentX - startX;
        const threshold = window.innerWidth * 0.2;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentScreen > 0) {
                currentScreen--;
            } else if (diff < 0 && currentScreen < screens.length - 1) {
                currentScreen++;
            }
        }
        
        updateCarousel(true);
    }

    // Add touch event listeners to carousel
    if (carousel) {
        carousel.addEventListener('touchstart', handleTouchStart, { passive: false });
        carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
        carousel.addEventListener('touchend', handleTouchEnd);
    }

    // Add click handlers to buttons
    buttons.forEach((button, index) => {
        if (button && index < screens.length - 1) {
            button.addEventListener('click', () => {
                button.style.transform = 'scale(0.98)';
                button.style.opacity = '0.9';
                
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.opacity = '';
                    currentScreen++;
                    updateCarousel(true);
                }, 150);
            });
        }
    });

    // Add click handler to back button
    if (backButton) {
        backButton.addEventListener('click', () => {
            if (currentScreen > 0) {
                currentScreen--;
                updateCarousel(true);
            }
        });
    }

    // Add click handler to cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            currentScreen = 0;
            updateCarousel(true);
        });
    }

    // Add change handler to toggle switch
    if (toggleSwitch) {
        const settingOption = toggleSwitch.closest('.setting-option');
        if (settingOption) {
            toggleSwitch.addEventListener('change', () => {
                settingOption.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    settingOption.style.transform = '';
                }, 150);
            });
        }
    }

    // Prevent default touch behavior on body
    document.body.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    }, { passive: false });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        const currentScreenEl = screens[currentScreen];
        if (!document.hidden && currentScreenEl) {
            currentScreenEl.classList.add('active');
        }
    });
});

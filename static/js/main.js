document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const screens = document.querySelectorAll('.screen');
    const dots = document.querySelectorAll('.dot');
    const buttons = document.querySelectorAll('.ios-button');

    let currentScreen = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Set initial active screen
    screens[0].classList.add('active');

    function updateCarousel(animate = true) {
        if (animate) {
            carousel.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            carousel.style.transition = 'none';
        }
        
        carousel.style.transform = `translateX(-${currentScreen * 100}%)`;
        
        // Update active states and animations
        screens.forEach((screen, index) => {
            if (index === currentScreen) {
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
            }
        });

        dots.forEach((dot, index) => {
            if (index === currentScreen) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function handleTouchStart(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        currentX = startX;
        carousel.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        
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
        if (!isDragging) return;
        
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

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (index < screens.length - 1) {
                // Add button press animation
                button.style.transform = 'scale(0.98)';
                button.style.opacity = '0.9';
                
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.opacity = '';
                    currentScreen++;
                    updateCarousel(true);
                }, 150);
            }
        });
    });

    // Add touch events
    carousel.addEventListener('touchstart', handleTouchStart);
    carousel.addEventListener('touchmove', handleTouchMove);
    carousel.addEventListener('touchend', handleTouchEnd);

    // Prevent default touch behavior
    document.body.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    }, { passive: false });

    // Handle visibility change to reset animations
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            screens[currentScreen].classList.add('active');
        }
    });
});

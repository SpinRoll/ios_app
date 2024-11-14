document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const screens = document.querySelectorAll('.screen');
    const dots = document.querySelectorAll('.dot');
    const buttons = document.querySelectorAll('.ios-button');

    let currentScreen = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    function updateCarousel() {
        carousel.style.transform = `translateX(-${currentScreen * 100}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentScreen);
        });
    }

    function handleTouchStart(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        carousel.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const translateX = (-currentScreen * 100) + (diff / window.innerWidth * 100);
        
        if (translateX <= 0 && translateX >= -((screens.length - 1) * 100)) {
            carousel.style.transform = `translateX(${translateX}%)`;
        }
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        
        isDragging = false;
        carousel.style.transition = 'transform 0.3s ease-out';
        
        const diff = currentX - startX;
        const threshold = window.innerWidth * 0.2;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentScreen > 0) {
                currentScreen--;
            } else if (diff < 0 && currentScreen < screens.length - 1) {
                currentScreen++;
            }
        }
        
        updateCarousel();
    }

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (index < screens.length - 1) {
                currentScreen++;
                updateCarousel();
            }
        });
    });

    carousel.addEventListener('touchstart', handleTouchStart);
    carousel.addEventListener('touchmove', handleTouchMove);
    carousel.addEventListener('touchend', handleTouchEnd);

    // Prevent default touch behavior to avoid iOS rubber-banding
    document.body.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
});

document.addEventListener('DOMContentLoaded', () => {
    
   // 1. Sticky Navbar Effect on Scroll
    const navbar = document.getElementById('navbar');
    
    // Throttle function for performance optimization
    const throttle = (fn, wait) => {
        let time = Date.now();
        return () => {
            if ((time + wait - Date.now()) < 0) {
                fn();
                time = Date.now();
            }
        }
    }

    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    // Apply throttled scroll event
    window.addEventListener('scroll', throttle(handleScroll, 100));

    // 2. Mobile Menu Toggle Logic
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            console.log('Menu toggled');
            // Framework prepared for mobile off-canvas menu
        });
    }
});

// 2. Product Slider Horizontal Scroll Logic
    const slider = document.getElementById('productSlider');
    const slideLeftBtn = document.getElementById('slideLeft');
    const slideRightBtn = document.getElementById('slideRight');

    if (slider && slideLeftBtn && slideRightBtn) {
        // Scroll distance is roughly one card width + gap
        const scrollAmount = 340; 

        slideLeftBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        slideRightBtn.addEventListener('click', () => {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    // 3. Simple Tab Switching Logic
    const filterTabs = document.querySelectorAll('.filter-btn');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            tab.classList.add('active');
            
            // Note: In a real app, this would filter the products.
            // For now, it just resets the scroll position to simulate change.
            if(slider) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            }
        });
    });
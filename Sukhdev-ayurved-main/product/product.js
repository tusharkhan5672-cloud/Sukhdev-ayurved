document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sticky Navbar Logic ---
    const navbar = document.getElementById('navbar');
    
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
    window.addEventListener('scroll', throttle(handleScroll, 100));

    // --- Mobile Menu Toggle ---
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            console.log('Mobile menu opened');
            // Toggle active class on #nav-links for mobile menu here
        });
    }

    // --- Product Image Gallery Swapper ---
    const mainImage = document.getElementById('main-product-img');
    const thumbnails = document.querySelectorAll('.pdp-thumb');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Remove active class from all
            thumbnails.forEach(t => t.classList.remove('active'));
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Swap main image source with a fade effect
            mainImage.style.opacity = 0;
            setTimeout(() => {
                mainImage.src = this.src;
                mainImage.style.opacity = 1;
            }, 150);
        });
    });

    // --- Quantity Selector Logic ---
    const qtyInput = document.getElementById('qty-input');
    const btnMinus = document.getElementById('qty-minus');
    const btnPlus = document.getElementById('qty-plus');

    if (btnMinus && btnPlus && qtyInput) {
        btnMinus.addEventListener('click', () => {
            let currentValue = parseInt(qtyInput.value);
            if (currentValue > 1) {
                qtyInput.value = currentValue - 1;
            }
        });

        btnPlus.addEventListener('click', () => {
            let currentValue = parseInt(qtyInput.value);
            // Optional: Add max inventory logic here
            qtyInput.value = currentValue + 1;
        });

        // Prevent typing non-numbers or 0
        qtyInput.addEventListener('change', () => {
            if (qtyInput.value < 1 || isNaN(qtyInput.value)) {
                qtyInput.value = 1;
            }
        });
    }

    // --- Accordion / Tabs Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Find matching content pane and activate it
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

});
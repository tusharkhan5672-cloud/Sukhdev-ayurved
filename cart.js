document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sticky Navbar Logic ---
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    };
    window.addEventListener('scroll', handleScroll);

    // --- Core Cart Logic ---
    const cartItemsContainer = document.getElementById('cart-items-container');
    const layoutContainer = document.getElementById('cart-layout');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const cartBadge = document.getElementById('cart-count');
    
    const shippingThreshold = 75.00; // Amount needed for free shipping
    const shippingText = document.getElementById('shipping-text');
    const shippingFill = document.getElementById('shipping-fill');

    // Function to calculate and update all totals
    function updateCartTotals() {
        let items = document.querySelectorAll('.cart-item');
        let subtotal = 0;
        let totalItems = 0;

        items.forEach(item => {
            let basePrice = parseFloat(item.getAttribute('data-price'));
            let qty = parseInt(item.querySelector('.qty-input').value);
            
            // Calculate line item total
            let lineTotal = basePrice * qty;
            item.querySelector('.line-total').innerText = lineTotal.toFixed(2);
            
            subtotal += lineTotal;
            totalItems += qty;
        });

        // Update Summary DOM
        summarySubtotal.innerText = subtotal.toFixed(2);
        summaryTotal.innerText = subtotal.toFixed(2);
        cartBadge.innerText = totalItems;

        // Handle Free Shipping Progress
        if (subtotal >= shippingThreshold) {
            shippingText.innerHTML = "<strong>Congratulations!</strong> You get Free Shipping.";
            shippingFill.style.width = "100%";
            shippingFill.style.backgroundColor = "#8A9A5B"; // A nice green
        } else {
            let amountLeft = (shippingThreshold - subtotal).toFixed(2);
            let percentage = (subtotal / shippingThreshold) * 100;
            shippingText.innerHTML = `You are <strong>$${amountLeft}</strong> away from Free Shipping!`;
            shippingFill.style.width = `${percentage}%`;
            shippingFill.style.backgroundColor = "var(--clr-primary)";
        }

        // Handle Empty Cart State
        if (items.length === 0) {
            layoutContainer.classList.add('hidden');
            emptyMsg.classList.remove('hidden');
            cartBadge.innerText = "0";
            cartBadge.style.display = "none";
        } else {
            cartBadge.style.display = "flex";
        }
    }

    // --- Attach Event Listeners to Items ---
    function attachItemListeners() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        cartItems.forEach(item => {
            const input = item.querySelector('.qty-input');
            const btnMinus = item.querySelector('.minus');
            const btnPlus = item.querySelector('.plus');
            const btnRemove = item.querySelector('.remove-btn');

            // Prevent attaching multiple listeners if function is re-run
            btnMinus.replaceWith(btnMinus.cloneNode(true));
            btnPlus.replaceWith(btnPlus.cloneNode(true));
            btnRemove.replaceWith(btnRemove.cloneNode(true));
            
            const newMinus = item.querySelector('.minus');
            const newPlus = item.querySelector('.plus');
            const newRemove = item.querySelector('.remove-btn');

            // Quantity Minus
            newMinus.addEventListener('click', () => {
                let currentVal = parseInt(input.value);
                if (currentVal > 1) {
                    input.value = currentVal - 1;
                    updateCartTotals();
                }
            });

            // Quantity Plus
            newPlus.addEventListener('click', () => {
                let currentVal = parseInt(input.value);
                input.value = currentVal + 1;
                updateCartTotals();
            });

            // Remove Item
            newRemove.addEventListener('click', (e) => {
                e.preventDefault();
                // Add a quick fade out animation before removing
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                item.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    item.remove();
                    updateCartTotals();
                }, 300);
            });
        });
    }

    // Initialize Cart
    attachItemListeners();
    updateCartTotals();

});
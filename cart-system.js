document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. GLOBAL: Update Cart Badge Count
    // ========================================================
    function updateCartBadge() {
        let cart = JSON.parse(localStorage.getItem('sukhdev_cart')) || [];
        let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            badge.innerText = totalItems;
            badge.style.display = totalItems > 0 ? "flex" : "none";
        });
    }

    // Initialize badge immediately on every page
    updateCartBadge();

    // ========================================================
    // 2. SHOP & PRODUCT PAGES: Add to Cart Logic
    // ========================================================
    const addToCartButtons = document.querySelectorAll('.sd-btn-cart, .add-cart-btn');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Stop the button/link from jumping to another page immediately
            e.preventDefault(); 

            // Find the container holding the product details
            let productContainer = this.closest('.sd-product-card') || this.closest('.pdp-info');
            
            if (!productContainer) return; // Safety check

            // Safely extract product details
            let nameElement = productContainer.querySelector('h3, h1');
            let name = nameElement ? nameElement.innerText : 'Unknown Product';
            
            let priceElement = productContainer.querySelector('.sd-price, .pdp-price');
            let priceText = priceElement ? priceElement.innerText : '0';
            let price = parseFloat(priceText.replace(/[^0-9.]/g, '')); // Extracts just the numbers
            
            let catElement = productContainer.querySelector('.sd-cat, .sd-subtitle');
            let category = catElement ? catElement.innerText : 'Ayurvedic Blend';
            
            let imgElement = productContainer.querySelector('img') || document.getElementById('main-product-img');
            let imgUrl = imgElement ? imgElement.src : 'https://images.unsplash.com/photo-1627492271810-72120dbbb34b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';

            let qtyInput = productContainer.querySelector('.qty-input');
            let qty = qtyInput ? parseInt(qtyInput.value) : 1;

            // Create Product Object
            let product = {
                id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Creates a safe ID (e.g. "ashwagandha-calm")
                name: name,
                price: price,
                category: category,
                image: imgUrl,
                qty: qty
            };

            // Save to Local Storage
            let cart = JSON.parse(localStorage.getItem('sukhdev_cart')) || [];
            let existingItem = cart.find(item => item.id === product.id);

            if (existingItem) {
                existingItem.qty += product.qty;
            } else {
                cart.push(product);
            }

            localStorage.setItem('sukhdev_cart', JSON.stringify(cart));
            
            // Visual Feedback: Turn button green
            updateCartBadge();
            let originalText = this.innerHTML;
            this.innerHTML = "✓ ADDED TO CART";
            this.style.backgroundColor = "#8A9A5B"; 
            this.style.color = "#fff";
            
            // Check if this button was meant to redirect to the cart (like on the product page)
            let href = this.getAttribute('href');
            
            setTimeout(() => {
                // If it's a link to the cart page, navigate there now that data is safely saved
                if (href && href.includes('cart')) {
                    window.location.href = href;
                } else {
                    // Otherwise, just reset the button so they can keep shopping
                    this.innerHTML = originalText;
                    this.style.backgroundColor = ""; 
                    this.style.color = "";
                }
            }, 800); // 0.8 second delay so they see the success message
        });
    });

    // ========================================================
    // 3. CART PAGE: Render Cart & Calculate Totals
    // ========================================================
    const cartContainer = document.getElementById('cart-items-container');
    
    if (cartContainer) {
        const layoutContainer = document.getElementById('cart-layout');
        const emptyMsg = document.getElementById('empty-cart-msg');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        const shippingText = document.getElementById('shipping-text');
        const shippingFill = document.getElementById('shipping-fill');
        const shippingThreshold = 75.00;

        function renderCartPage() {
            let cart = JSON.parse(localStorage.getItem('sukhdev_cart')) || [];
            
            // If empty, show empty state
            if (cart.length === 0) {
                layoutContainer.classList.add('hidden');
                emptyMsg.classList.remove('hidden');
                return;
            }

            layoutContainer.classList.remove('hidden');
            emptyMsg.classList.add('hidden');
            cartContainer.innerHTML = '';
            
            let subtotal = 0;

            // Generate HTML for each item
            cart.forEach((item, index) => {
                let lineTotal = item.price * item.qty;
                subtotal += lineTotal;

                let itemHTML = `
                    <div class="cart-item" data-index="${index}">
                        <div class="cart-item-product">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="item-details">
                                <h3>${item.name}</h3>
                                <p class="sd-cat">${item.category}</p>
                                <button class="remove-btn" data-index="${index}">Remove</button>
                            </div>
                        </div>
                        <div class="cart-item-qty">
                            <div class="quantity-selector">
                                <button type="button" class="qty-btn minus" data-index="${index}">−</button>
                                <input type="number" class="qty-input" value="${item.qty}" readonly>
                                <button type="button" class="qty-btn plus" data-index="${index}">+</button>
                            </div>
                        </div>
                        <div class="cart-item-price">
                            ₹ <span class="line-total">${lineTotal.toFixed(2)}</span>
                        </div>
                    </div>
                `;
                cartContainer.insertAdjacentHTML('beforeend', itemHTML);
            });

            // Update Summary Totals
            summarySubtotal.innerText = subtotal.toFixed(2);
            summaryTotal.innerText = subtotal.toFixed(2);

            // Shipping Progress Bar
            if (subtotal >= shippingThreshold) {
                shippingText.innerHTML = "<strong>Congratulations!</strong> You get Free Shipping.";
                shippingFill.style.width = "100%";
                shippingFill.style.backgroundColor = "#8A9A5B"; 
            } else {
                let amountLeft = (shippingThreshold - subtotal).toFixed(2);
                let percentage = (subtotal / shippingThreshold) * 100;
                shippingText.innerHTML = `You are <strong>$${amountLeft}</strong> away from Free Shipping!`;
                shippingFill.style.width = `${percentage}%`;
                shippingFill.style.backgroundColor = "var(--clr-primary)";
            }

            attachCartPageListeners();
        }

        function attachCartPageListeners() {
            let cart = JSON.parse(localStorage.getItem('sukhdev_cart')) || [];

            document.querySelectorAll('.cart-item .plus').forEach(btn => {
                btn.addEventListener('click', function() {
                    let index = this.getAttribute('data-index');
                    cart[index].qty += 1;
                    localStorage.setItem('sukhdev_cart', JSON.stringify(cart));
                    renderCartPage();
                    updateCartBadge();
                });
            });

            document.querySelectorAll('.cart-item .minus').forEach(btn => {
                btn.addEventListener('click', function() {
                    let index = this.getAttribute('data-index');
                    if (cart[index].qty > 1) {
                        cart[index].qty -= 1;
                        localStorage.setItem('sukhdev_cart', JSON.stringify(cart));
                        renderCartPage();
                        updateCartBadge();
                    }
                });
            });

            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let index = this.getAttribute('data-index');
                    cart.splice(index, 1); 
                    localStorage.setItem('sukhdev_cart', JSON.stringify(cart));
                    renderCartPage();
                    updateCartBadge();
                });
            });
        }

        renderCartPage();
    }
});
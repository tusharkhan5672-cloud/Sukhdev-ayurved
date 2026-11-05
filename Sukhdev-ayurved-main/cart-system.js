document.addEventListener('DOMContentLoaded', () => {
    const ROOT = window.ROOT || '';
    const CART_KEY = 'sukhdev_cart';
    const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };

    // 1. Cart badge
    function updateCartBadge() {
        let totalItems = readCart().reduce((sum, item) => sum + item.qty, 0);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.innerText = totalItems;
            badge.style.display = totalItems > 0 ? "flex" : "none";
        });
    }
    updateCartBadge();

    // Account icon: goes to login or account dashboard
    document.querySelectorAll('[aria-label="Account"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = ROOT + (localStorage.getItem('sd_session') ? 'account.html' : 'login.html');
        });
    });

    // 2. Add to cart (shop + product pages)
    document.querySelectorAll('.sd-btn-cart, .add-cart-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            let productContainer = this.closest('.sd-product-card') || this.closest('.pdp-info');
            if (!productContainer) return;

            let nameElement = productContainer.querySelector('h3, h1');
            let name = nameElement ? nameElement.innerText : 'Unknown Product';
            let priceElement = productContainer.querySelector('.sd-price, .pdp-price');
            let price = parseFloat((priceElement ? priceElement.innerText : '0').replace(/[^0-9.]/g, ''));
            let catElement = productContainer.querySelector('.sd-cat, .sd-subtitle');
            let category = catElement ? catElement.innerText : 'Ayurvedic Blend';
            let imgElement = productContainer.querySelector('img') || document.getElementById('main-product-img');
            let imgUrl = imgElement ? imgElement.src : '';
            let qtyInput = productContainer.querySelector('.qty-input');
            let qty = qtyInput ? parseInt(qtyInput.value) : 1;

            let product = { id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'), name, price, category, image: imgUrl, qty };

            let cart = readCart();
            let existingItem = cart.find(item => item.id === product.id);
            if (existingItem) existingItem.qty += product.qty; else cart.push(product);
            localStorage.setItem(CART_KEY, JSON.stringify(cart));

            updateCartBadge();
            let originalText = this.innerHTML;
            this.innerHTML = "✓ ADDED TO CART";
            this.style.backgroundColor = "#8A9A5B";
            this.style.color = "#fff";
            let href = this.getAttribute('href');

            setTimeout(() => {
                if (href && href.includes('cart')) {
                    window.location.href = href;
                } else {
                    this.innerHTML = originalText;
                    this.style.backgroundColor = "";
                    this.style.color = "";
                }
            }, 800);
        });
    });

    // 3. Cart page
    const cartContainer = document.getElementById('cart-items-container');
    if (cartContainer) {
        const layoutContainer = document.getElementById('cart-layout');
        const emptyMsg = document.getElementById('empty-cart-msg');
        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        const shippingText = document.getElementById('shipping-text');
        const shippingFill = document.getElementById('shipping-fill');
        const shippingThreshold = 999; // free shipping above ₹999

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
            if (!readCart().length) return alert('Your cart is empty');
            window.location.href = ROOT + 'checkout.html';
        });

        function renderCartPage() {
            let cart = readCart();
            if (cart.length === 0) {
                layoutContainer.classList.add('hidden');
                emptyMsg.classList.remove('hidden');
                return;
            }
            layoutContainer.classList.remove('hidden');
            emptyMsg.classList.add('hidden');
            cartContainer.innerHTML = '';
            let subtotal = 0;

            cart.forEach((item, index) => {
                let lineTotal = item.price * item.qty;
                subtotal += lineTotal;
                cartContainer.insertAdjacentHTML('beforeend', `
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
                        <div class="cart-item-price">₹ <span class="line-total">${lineTotal.toFixed(2)}</span></div>
                    </div>`);
            });

            summarySubtotal.innerText = subtotal.toFixed(2);
            summaryTotal.innerText = subtotal.toFixed(2);

            if (subtotal >= shippingThreshold) {
                shippingText.innerHTML = "<strong>Congratulations!</strong> You get Free Shipping.";
                shippingFill.style.width = "100%";
                shippingFill.style.backgroundColor = "#8A9A5B";
            } else {
                let amountLeft = (shippingThreshold - subtotal).toFixed(2);
                shippingText.innerHTML = `You are <strong>₹ ${amountLeft}/-</strong> away from Free Shipping!`;
                shippingFill.style.width = `${(subtotal / shippingThreshold) * 100}%`;
                shippingFill.style.backgroundColor = "var(--clr-primary)";
            }
            attachCartPageListeners();
        }

        function attachCartPageListeners() {
            let cart = readCart();
            const save = () => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCartPage(); updateCartBadge(); };
            document.querySelectorAll('.cart-item .plus').forEach(btn => btn.addEventListener('click', function () {
                cart[this.getAttribute('data-index')].qty += 1; save();
            }));
            document.querySelectorAll('.cart-item .minus').forEach(btn => btn.addEventListener('click', function () {
                let i = this.getAttribute('data-index');
                if (cart[i].qty > 1) { cart[i].qty -= 1; save(); }
            }));
            document.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', function () {
                cart.splice(this.getAttribute('data-index'), 1); save();
            }));
        }
        renderCartPage();
    }
});
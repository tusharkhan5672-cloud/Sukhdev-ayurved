
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const $ = (selector) => document.querySelector(selector);

    const elements = {
        container: $('#cart-items-container'),
        layout: $('#cart-layout'),
        empty: $('#empty-cart-msg'),
        subtotal: $('#summary-subtotal'),
        total: $('#summary-total'),
        shipping: $('#summary-shipping'),
        badge: $('#cart-count'),
        shippingText: $('#shipping-text'),
        shippingFill: $('#shipping-fill'),
        checkout: $('#checkout-btn'),
        navbar: $('#navbar')
    };

    const FREE_SHIPPING_LIMIT = 999;
    const CHECKOUT_URL = 'checkout.html';
    const CART_KEY = 'sukhdev_cart';

    // Use the existing shared Sukhdev store.
    const StoreAPI = window.Store || window.S || {};

    const money = (value) => {
        const amount = Number(value) || 0;
        return amount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const escapeHTML = (value) => {
        if (StoreAPI.esc) return StoreAPI.esc(String(value ?? ''));

        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[char]);
    };

    const getCart = () => {
        try {
            if (typeof StoreAPI.cart === 'function') {
                const cart = StoreAPI.cart();
                if (Array.isArray(cart)) return cart;
            }

            const saved = localStorage.getItem(CART_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Could not read Sukhdev cart:', error);
            return [];
        }
    };

    const saveCart = (cart) => {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('sukhdev:cart-updated', {
                detail: { cart }
            }));
        } catch (error) {
            console.error('Could not save Sukhdev cart:', error);
            showToast('Unable to update your cart. Please try again.');
        }
    };

    const getPrice = (item) => {
        const price = Number(
            String(item.price ?? 0).replace(/[₹,\s]/g, '')
        );

        return Number.isFinite(price) ? price : 0;
    };

    const getQuantity = (item) => {
        const quantity = parseInt(item.qty, 10);
        return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    };

    const getImage = (item) => {
        const image = item.image || item.img || '';

        if (!image) return '';

        try {
            return StoreAPI.src
                ? StoreAPI.src(image)
                : image;
        } catch {
            return image;
        }
    };

    function showToast(message) {
        let toast = $('#cart-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cart-toast';
            toast.className = 'cart-toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2400);
    }

    function renderCart() {
        const cart = getCart();

        if (!Array.isArray(cart)) return;

        const validCart = cart.filter(item => item && item.id != null);
        const hasItems = validCart.length > 0;

        elements.layout.classList.toggle('hidden', !hasItems);
        elements.empty.classList.toggle('hidden', hasItems);

        elements.badge.textContent = validCart.reduce(
            (sum, item) => sum + getQuantity(item), 0
        );
        elements.badge.hidden = !hasItems;

        if (!hasItems) {
            elements.container.innerHTML = '';
            updateSummary([]);
            return;
        }

        elements.container.innerHTML = validCart.map(item => {
            const id = escapeHTML(item.id);
            const name = escapeHTML(item.name || 'Sukhdev Product');
            const category = escapeHTML(item.category || 'Ayurvedic Wellness');
            const price = getPrice(item);
            const qty = getQuantity(item);
            const image = getImage(item);

            return `
                <article class="cart-item" data-id="${id}">
                    <div class="cart-item-product">
                        <div class="cart-image-wrap">
                            ${image ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${name}"
                                    loading="lazy"
                                    onerror="this.style.display='none'"
                                >
                            ` : `
                                <div class="cart-image-placeholder">S</div>
                            `}
                        </div>

                        <div class="item-details">
                            <p class="sd-cat">${category}</p>
                            <h3>${name}</h3>
                            <p class="cart-unit-price">₹${money(price)}</p>

                            <button
                                type="button"
                                class="remove-btn"
                                data-action="remove"
                                aria-label="Remove ${name} from cart"
                            >
                                Remove
                            </button>
                        </div>
                    </div>

                    <div class="cart-item-qty">
                        <div class="quantity-selector">
                            <button
                                type="button"
                                class="qty-btn"
                                data-action="minus"
                                aria-label="Decrease quantity"
                                ${qty <= 1 ? 'disabled' : ''}
                            >−</button>

                            <span class="qty-input" aria-live="polite">${qty}</span>

                            <button
                                type="button"
                                class="qty-btn"
                                data-action="plus"
                                aria-label="Increase quantity"
                            >+</button>
                        </div>
                    </div>

                    <div class="cart-item-price">
                        ₹<span class="line-total">${money(price * qty)}</span>
                    </div>
                </article>
            `;
        }).join('');

        updateSummary(validCart);
    }

    function updateSummary(cart) {
        const subtotal = cart.reduce(
            (sum, item) => sum + getPrice(item) * getQuantity(item),
            0
        );

        const itemCount = cart.reduce(
            (sum, item) => sum + getQuantity(item),
            0
        );

        elements.subtotal.textContent = money(subtotal);
        elements.total.textContent = money(subtotal);
        elements.badge.textContent = itemCount;
        elements.badge.hidden = itemCount === 0;

        // Shipping is calculated at checkout.
        elements.shipping.textContent = subtotal >= FREE_SHIPPING_LIMIT
            ? 'Free'
            : 'Calculated at checkout';

        const progress = Math.min(
            (subtotal / FREE_SHIPPING_LIMIT) * 100,
            100
        );

        elements.shippingFill.style.width = `${progress}%`;

        if (subtotal >= FREE_SHIPPING_LIMIT) {
            elements.shippingText.innerHTML =
                '<strong>You have unlocked free shipping!</strong>';
        } else {
            elements.shippingText.innerHTML =
                `Add <strong>₹${money(FREE_SHIPPING_LIMIT - subtotal)}</strong> more for free shipping.`;
        }

        if (elements.checkout) {
            elements.checkout.disabled = cart.length === 0;
        }
    }

    // Event delegation: works for dynamically rendered cart items.
    elements.container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const itemElement = button.closest('.cart-item');
        if (!itemElement) return;

        const id = itemElement.dataset.id;
        const action = button.dataset.action;
        const cart = getCart();

        const index = cart.findIndex(
            item => String(item.id) === String(id)
        );

        if (index === -1) return;

        if (action === 'plus') {
            cart[index].qty = getQuantity(cart[index]) + 1;
        }

        if (action === 'minus') {
            cart[index].qty = Math.max(
                1,
                getQuantity(cart[index]) - 1
            );
        }

        if (action === 'remove') {
            cart.splice(index, 1);
            showToast('Product removed from your cart.');
        }

        saveCart(cart);
        renderCart();
    });

    // Checkout
    elements.checkout?.addEventListener('click', () => {
        const cart = getCart();

        if (!cart.length) {
            showToast('Your cart is empty.');
            return;
        }

        window.location.href = CHECKOUT_URL;
    });

    // Navbar scroll effect
    function handleScroll() {
        elements.navbar?.classList.toggle(
            'scrolled',
            window.scrollY > 30
        );
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Listen for cart changes from other parts of the site.
    window.addEventListener('sukhdev:cart-updated', renderCart);
    window.addEventListener('storage', (event) => {
        if (event.key === CART_KEY) renderCart();
    });

    // Initial render
    renderCart();
});

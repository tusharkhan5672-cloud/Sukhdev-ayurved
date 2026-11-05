(() => {
    'use strict';

    const $ = id => document.getElementById(id);
    const ROOT = '../../';                 // this page lives in navbar/shop/
    const SLUG = 'herbal-wellness-tea';    // same id Store.slug() makes from the product name
    const CART_KEY = 'sukhdev_cart';

    const FALLBACK = {
        name: 'Herbal Wellness Tea',
        desc: 'Calming Herbal Infusion',
        price: 399,
        mrp: 699,
        img: 'navbar/shop/product2.png'    // path relative to the site root (used inside the cart)
    };

    /* ---------- helpers ---------- */
    const money = n => '₹ ' + Number(n).toLocaleString('en-IN') + '/-';
    const slug = n => String(n).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const resolve = p => (!p ? '' : /^(https?:|data:|\/)/.test(p) ? p : ROOT + p);
    const getJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem('sd_' + k)); return v == null ? d : v; } catch (e) { return d; } };
    const readCart = () => { try { const c = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(c) ? c : []; } catch (e) { return []; } };
    const writeCart = c => localStorage.setItem(CART_KEY, JSON.stringify(c));

    /* ---------- product data (admin panel overrides the defaults) ---------- */
    const stored = (() => {
        try { return getJSON('products', []).find(p => slug(p.name) === SLUG) || null; } catch (e) { return null; }
    })();

    const product = {
        name: stored ? stored.name : FALLBACK.name,
        desc: (stored && stored.desc) || FALLBACK.desc,
        price: stored ? Number(stored.price) || 0 : FALLBACK.price,
        mrp: stored ? Number(stored.mrp) || 0 : FALLBACK.mrp,
        stock: stored && stored.stock != null ? Math.max(0, Number(stored.stock) || 0) : Infinity,
        badge: stored ? stored.badge || '' : '',
        visible: !stored || stored.visible !== false,
        cartImage: (stored && (stored.img || (stored.images && stored.images[0]))) || FALLBACK.img
    };
    const unavailable = !product.visible || product.stock < 1 || product.badge === 'Sold out';
    const maxQty = Number.isFinite(product.stock) ? Math.min(product.stock, 99) : 99;

    /* ---------- elements ---------- */
    const navbar = $('navbar');
    const qtyInput = $('qty-input');
    const btnMinus = $('qty-minus');
    const btnPlus = $('qty-plus');
    const addBtn = $('add-cart');
    const addLabel = $('add-label');
    const stickyBar = $('sticky-bar');
    const stickyAdd = $('sticky-add');

    /* ---------- toast ---------- */
    function toast(message, opts = {}) {
        const wrap = $('toast-wrap');
        wrap.innerHTML = '';
        const t = document.createElement('div');
        t.className = 'toast' + (opts.bad ? ' bad' : '');
        const s = document.createElement('span');
        s.textContent = message;
        t.appendChild(s);
        if (opts.link) {
            const a = document.createElement('a');
            a.href = opts.link.href;
            a.textContent = opts.link.text;
            t.appendChild(a);
        }
        wrap.appendChild(t);
        setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, opts.ms || 3200);
    }

    /* ---------- cart badge ---------- */
    function updateBadge() {
        const n = readCart().reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
        const badge = $('cart-count');
        badge.textContent = n > 99 ? '99+' : n;
        badge.hidden = n === 0;
    }
    window.addEventListener('storage', e => { if (e.key === CART_KEY) updateBadge(); });
    window.addEventListener('pageshow', updateBadge);

    /* ---------- navbar: scroll + mobile menu ---------- */
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const navToggle = $('nav-toggle');
    const navLinks = $('nav-links');
    function setMenu(open) {
        navLinks.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));

    /* ---------- price, badge, stock ---------- */
    function renderProductState() {
        $('price').textContent = money(product.price);

        const off = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
        const old = $('old-price');
        const badge = $('sale-badge');

        if (off) {
            old.textContent = money(product.mrp);
            old.hidden = false;
        } else {
            old.hidden = true;
        }

        badge.classList.remove('soldout');
        if (unavailable) {
            badge.textContent = 'SOLD OUT';
            badge.classList.add('soldout');
            badge.hidden = false;
        } else if (off) {
            badge.textContent = off + '% OFF';
            badge.hidden = false;
        } else if (product.badge) {
            badge.textContent = product.badge.toUpperCase();
            badge.hidden = false;
        } else {
            badge.hidden = true;
        }

        const stock = $('stock-msg');
        const text = $('stock-text');
        stock.classList.remove('low', 'out');
        if (unavailable) {
            stock.classList.add('out');
            text.textContent = product.visible ? 'Sold out' : 'Currently unavailable';
        } else if (Number.isFinite(product.stock) && product.stock <= 5) {
            stock.classList.add('low');
            text.textContent = 'Only ' + product.stock + ' left';
        } else {
            text.textContent = 'In stock';
        }

        qtyInput.max = maxQty;
        if (unavailable) {
            [addBtn, stickyAdd, btnMinus, btnPlus, qtyInput].forEach(el => el.disabled = true);
            addLabel.textContent = 'Sold out';
            $('add-sep').hidden = true;
            $('add-total').hidden = true;
            stickyAdd.textContent = 'Sold out';
        }

        const freeAbove = Number((getJSON('shipping', {}) || {}).freeAbove);
        const note = $('ship-note');
        if (freeAbove > 0) note.textContent = 'Free shipping on orders above ' + money(freeAbove).replace('/-', '');
        else if (getJSON('shipping', null) && freeAbove === 0) note.textContent = 'Fast, tracked delivery across India';
    }

    /* ---------- quantity ---------- */
    const clamp = n => Math.min(Math.max(parseInt(n, 10) || 1, 1), maxQty);

    function syncQty() {
        const qty = clamp(qtyInput.value);
        qtyInput.value = qty;
        btnMinus.disabled = unavailable || qty <= 1;
        btnPlus.disabled = unavailable || qty >= maxQty;
        if (!unavailable) {
            $('add-total').textContent = money(product.price * qty);
            $('sticky-price').textContent = money(product.price * qty);
        } else {
            $('sticky-price').textContent = money(product.price);
        }
    }

    btnMinus.addEventListener('click', () => { qtyInput.value = clamp(qtyInput.value) - 1; syncQty(); });
    btnPlus.addEventListener('click', () => {
        const cur = clamp(qtyInput.value);
        if (cur >= maxQty) { toast('Only ' + maxQty + ' available.', { bad: true }); return; }
        qtyInput.value = cur + 1;
        syncQty();
    });
    qtyInput.addEventListener('change', syncQty);
    qtyInput.addEventListener('blur', syncQty);
    qtyInput.addEventListener('input', () => {
        qtyInput.value = qtyInput.value.replace(/\D/g, '');
        if (qtyInput.value !== '') syncQty();
    });
    qtyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addToCart(); }
    });

    /* ---------- add to cart ---------- */
    let flashTimer;
    function flash() {
        clearTimeout(flashTimer);
        addBtn.classList.add('added');
        addLabel.textContent = 'Added ✓';
        stickyAdd.textContent = 'Added ✓';
        flashTimer = setTimeout(() => {
            addBtn.classList.remove('added');
            addLabel.textContent = 'Add to Cart';
            stickyAdd.textContent = 'Add to Cart';
        }, 1800);
    }

    function addToCart() {
        if (unavailable) return;

        const qty = clamp(qtyInput.value);
        const cart = readCart();
        const existing = cart.find(i => i.id === SLUG);
        const inCart = existing ? Number(existing.qty) || 0 : 0;
        const room = maxQty - inCart;

        if (room < 1) {
            toast('You already have the maximum available (' + maxQty + ') in your cart.', {
                bad: true, link: { href: ROOT + 'cart.html', text: 'View cart' }
            });
            return;
        }

        const add = Math.min(qty, room);
        if (existing) {
            existing.qty = inCart + add;
            existing.price = product.price;
        } else {
            cart.push({
                id: SLUG,
                name: product.name,
                price: product.price,
                category: product.desc,
                image: product.cartImage,
                qty: add
            });
        }

        try {
            writeCart(cart);
        } catch (e) {
            toast('Could not save your cart. Please allow site storage.', { bad: true });
            return;
        }

        updateBadge();
        flash();
        toast(
            add < qty
                ? 'Added ' + add + ' (stock limit reached).'
                : add + ' × ' + product.name + ' added to your cart.',
            { link: { href: ROOT + 'cart.html', text: 'View cart' } }
        );
    }

    addBtn.addEventListener('click', addToCart);
    stickyAdd.addEventListener('click', addToCart);

    /* ---------- sticky add-to-cart bar (mobile) ---------- */
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            stickyBar.classList.toggle('visible', !entry.isIntersecting);
        }, { threshold: 0 }).observe(addBtn);
    }

    /* ---------- gallery ---------- */
    const mainImg = $('main-product-img');
    const frame = $('pdp-main-image');
    const thumbsBox = $('pdp-thumbs');

    // Use images uploaded in the admin panel, if there are any
    if (stored && Array.isArray(stored.images) && stored.images.length) {
        thumbsBox.innerHTML = '';
        stored.images.forEach((p, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pdp-thumb' + (i ? '' : ' active');
            b.dataset.full = resolve(p);
            b.setAttribute('aria-label', 'View image ' + (i + 1));
            const im = document.createElement('img');
            im.src = resolve(p);
            im.alt = '';
            im.loading = 'lazy';
            b.appendChild(im);
            thumbsBox.appendChild(b);
        });
        mainImg.src = resolve(stored.images[0]);
    }
    thumbsBox.hidden = thumbsBox.children.length < 2;

    thumbsBox.addEventListener('click', e => {
        const thumb = e.target.closest('.pdp-thumb');
        if (!thumb) return;
        const full = thumb.dataset.full;

        thumbsBox.querySelectorAll('.pdp-thumb').forEach(t => {
            t.classList.remove('active');
            t.removeAttribute('aria-current');
        });
        thumb.classList.add('active');
        thumb.setAttribute('aria-current', 'true');

        if (mainImg.getAttribute('src') === full) return;
        mainImg.style.opacity = 0;
        mainImg.onload = () => { mainImg.style.opacity = 1; };
        setTimeout(() => { mainImg.src = full; }, 150);
    });

    // Hover zoom (mouse devices only)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        frame.addEventListener('mouseenter', () => frame.classList.add('zoom'));
        frame.addEventListener('mouseleave', () => frame.classList.remove('zoom'));
        frame.addEventListener('mousemove', e => {
            const r = frame.getBoundingClientRect();
            mainImg.style.transformOrigin =
                ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
        });
    }

    /* ---------- delivery check ---------- */
    $('pin-form').addEventListener('submit', e => {
        e.preventDefault();
        const msg = $('pin-msg');
        const pin = $('pin-input').value.trim();

        if (!/^\d{6}$/.test(pin)) {
            msg.textContent = 'Please enter a valid 6-digit PIN code.';
            msg.className = 'pin-msg bad';
            return;
        }

        const sh = { charge: 0, freeAbove: 999, zones: [], ...getJSON('shipping', {}) };
        const zone = (sh.zones || []).find(z => z.pin && pin.startsWith(String(z.pin)));
        const fee = zone ? Number(zone.charge) || 0 : Number(sh.charge) || 0;
        const days = zone && Number(zone.days) ? zone.days + ' days' : '3–7 business days';

        let text = 'Delivery available to ' + pin + '. Estimated ' + days + '. ';
        if (fee === 0) text += 'Shipping is free.';
        else {
            text += 'Shipping ' + money(fee).replace('/-', '');
            if (Number(sh.freeAbove) > 0) text += ' (free above ' + money(sh.freeAbove).replace('/-', '') + ')';
            text += '.';
        }
        msg.textContent = text;
        msg.className = 'pin-msg ok';
    });
    $('pin-input').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });

    /* ---------- tabs (with keyboard support) ---------- */
    const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));
    const tabPanels = Array.from(document.querySelectorAll('.tab-content'));

    function activateTab(btn, focus) {
        tabBtns.forEach(b => {
            const on = b === btn;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
            b.tabIndex = on ? 0 : -1;
        });
        tabPanels.forEach(p => {
            const on = p.id === btn.dataset.target;
            p.classList.toggle('active', on);
            p.hidden = !on;
        });
        if (focus) btn.focus();
    }

    tabBtns.forEach((btn, i) => {
        btn.addEventListener('click', () => activateTab(btn));
        btn.addEventListener('keydown', e => {
            let next = null;
            if (e.key === 'ArrowRight') next = tabBtns[(i + 1) % tabBtns.length];
            if (e.key === 'ArrowLeft') next = tabBtns[(i - 1 + tabBtns.length) % tabBtns.length];
            if (e.key === 'Home') next = tabBtns[0];
            if (e.key === 'End') next = tabBtns[tabBtns.length - 1];
            if (next) { e.preventDefault(); activateTab(next, true); }
        });
    });

    /* ---------- init ---------- */
    renderProductState();
    syncQty();
    updateBadge();
})();
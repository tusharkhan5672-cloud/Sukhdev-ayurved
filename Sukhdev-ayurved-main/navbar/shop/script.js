document.addEventListener('DOMContentLoaded', () => {
    const S = window.Store;
    const ROOT = '../../';
    const CART_KEY = 'sukhdev_cart';
    const $ = id => document.getElementById(id);

    /* ---------- Navbar: scroll effect ---------- */
    const navbar = $('navbar');
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    const navToggle = $('nav-toggle');
    const navLinks = $('nav-links');
    const setMenu = open => {
        navLinks.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
    };
    navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    const grid = $('shop-grid');
    if (!S) {
        grid.innerHTML = '<p class="shop-empty">Could not load products. Make sure store.js is in the site root.</p>';
        return;
    }

    /* ---------- Account links ---------- */
    const loggedIn = !!S.me();
    $('acct-link').href = ROOT + (loggedIn ? 'account.html' : 'login.html');
    $('foot-acct').href = ROOT + (loggedIn ? 'account.html' : 'login.html');
    $('foot-acct').textContent = loggedIn ? 'My Account' : 'Sign in';

    /* ---------- Site text from admin ---------- */
    S.site();

    /* ---------- Cart helpers ---------- */
    const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };
    const updateBadge = () => {
        const n = readCart().reduce((s, i) => s + i.qty, 0);
        const b = $('cart-count');
        b.textContent = n;
        b.style.display = n > 0 ? 'flex' : 'none';
    };
    const toast = msg => {
        const t = document.createElement('div');
        t.className = 'shop-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000);
    };
    updateBadge();

    /* ---------- State ---------- */
    const params = new URLSearchParams(location.search);
    const state = { cat: params.get('cat') || 'all', prices: [], sort: 'featured', q: '' };

    const visible = () => S.products().filter(p => !p.hidden);

    /* ---------- Categories (built from admin data) ---------- */
    function renderCategories() {
        const fromProducts = visible().map(p => p.cat).filter(Boolean);
        const cats = [...new Set([...fromProducts])];
        $('cat-list').innerHTML =
            `<li><a href="#" data-cat="all" class="${state.cat === 'all' ? 'active' : ''}">All Teas</a></li>` +
            cats.map(c => `<li><a href="#" data-cat="${S.esc(c)}" class="${state.cat === c ? 'active' : ''}">${S.esc(c)}</a></li>`).join('');
    }

    /* ---------- Products ---------- */
    function filtered() {
        const q = state.q.trim().toLowerCase();
        let list = visible().filter(p =>
            (state.cat === 'all' || p.cat === state.cat) &&
            (!state.prices.length || state.prices.some(r => p.price >= r[0] && p.price <= r[1])) &&
            (!q || (p.name + ' ' + (p.desc || '') + ' ' + (p.cat || '')).toLowerCase().includes(q))
        );
        const rank = p => (p.flag === 'featured' ? 0 : 1);
        if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
        else if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
        else if (state.sort === 'new') list.sort((a, b) => (b.flag === 'new') - (a.flag === 'new') || String(b.id).localeCompare(String(a.id)));
        else list.sort((a, b) => rank(a) - rank(b));
        return list;
    }

    function card(p) {
        const out = p.stock < 1 || p.flag === 'soldout';
        const sale = p.mrp > p.price;
        const flag = !out && (p.flag === 'new' || p.flag === 'featured') ? `<span class="sd-flag">${p.flag.toUpperCase()}</span>` : '';
        const id = S.slug(p.name);
        return `<div class="sd-product-card">
            ${sale ? '<span class="sd-sale-badge">SALE</span>' : ''}${flag}
            <a href="${ROOT}product/product.html?id=${encodeURIComponent(id)}">
                <img src="${S.src(p.img)}" alt="${S.esc(p.name)}" loading="lazy">
            </a>
            <h3>${S.esc(p.name)}</h3>
            <p class="sd-cat">${S.esc(p.desc || '')}</p>
            <p class="sd-price">${sale ? `<span class="old">${S.money(p.mrp)}/-</span>` : ''}${S.money(p.price)}/-</p>
            <button class="sd-btn-cart" data-add="${S.esc(p.id)}" ${out ? 'disabled' : ''}>${out ? 'SOLD OUT' : 'ADD TO CART'}</button>
        </div>`;
    }

    function render() {
        const all = visible(), list = filtered();
        $('product-count').textContent = `Showing ${list.length} of ${all.length} product${all.length === 1 ? '' : 's'}`;
        grid.innerHTML = list.length
            ? list.map(card).join('')
            : '<p class="shop-empty">No products match your filters. <a id="empty-clear">Clear filters</a></p>';
        renderCategories();
    }

    /* ---------- Events ---------- */
    $('cat-list').addEventListener('click', e => {
        const a = e.target.closest('[data-cat]');
        if (!a) return;
        e.preventDefault();
        state.cat = a.dataset.cat;
        render();
    });

    $('price-list').addEventListener('change', () => {
        state.prices = [...document.querySelectorAll('#price-list input:checked')]
            .map(i => [+i.dataset.min, +i.dataset.max]);
        render();
    });

    $('sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
    $('shop-search').addEventListener('input', e => { state.q = e.target.value; render(); });

    $('search-btn').addEventListener('click', () => {
        $('products-area').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => $('shop-search').focus(), 400);
    });

    const clearAll = () => {
        state.cat = 'all'; state.prices = []; state.q = ''; state.sort = 'featured';
        document.querySelectorAll('#price-list input').forEach(i => i.checked = false);
        $('shop-search').value = ''; $('sort').value = 'featured';
        render();
    };
    $('clear-filters').addEventListener('click', clearAll);

    grid.addEventListener('click', e => {
        if (e.target.id === 'empty-clear') return clearAll();
        const btn = e.target.closest('[data-add]');
        if (!btn || btn.disabled) return;

        const p = S.products().find(x => x.id === btn.dataset.add);
        if (!p) return;
        const id = S.slug(p.name);
        const cart = readCart();
        const line = cart.find(i => i.id === id);
        const have = line ? line.qty : 0;

        if (have + 1 > p.stock) return toast(`Only ${p.stock} in stock`);

        if (line) line.qty += 1;
        else cart.push({ id, name: p.name, price: p.price, category: p.desc || '', image: S.src(p.img), qty: 1 });
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateBadge();

        const original = btn.textContent;
        btn.textContent = '✓ ADDED TO CART';
        btn.style.backgroundColor = '#8A9A5B';
        btn.style.color = '#fff';
        setTimeout(() => {
            btn.textContent = original;
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }, 900);
    });

    window.addEventListener('storage', updateBadge);
    render();
});
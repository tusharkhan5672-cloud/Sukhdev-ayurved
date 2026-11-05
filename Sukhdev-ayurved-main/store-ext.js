/* store-ext.js — load AFTER store.js on index.html, checkout.html, cart.html, login.html, account.html
   Makes admin features (coupons, shipping rules, hidden/sold-out products, blocked accounts) work on the storefront. */
(function(){
const S=window.Store;if(!S)return;
const ship=()=>({charge:0,freeAbove:999,zones:[],...S.get('shipping',{})});

/* Price quote: subtotal, coupon discount, shipping, total */
S.quote=(code,address)=>{
 const sub=S.total(),sh=ship();let disc=0,c=null,err='';
 if(code){
  c=S.get('coupons',[]).find(x=>x.code===String(code).trim().toUpperCase());
  if(!c||c.on===false)err='Invalid coupon code';
  else if(c.exp&&new Date(c.exp).getTime()+864e5<Date.now())err='This coupon has expired';
  else if(c.limit&&(c.used||0)>=c.limit)err='This coupon has been fully used';
  else if(c.min&&sub<c.min)err='Minimum order for this coupon is ₹ '+c.min;
  else disc=c.type==='%'?Math.round(sub*c.value/100):Math.min(c.value,sub);
  if(err)c=null;
 }
 const pin=((address||'').match(/\b\d{6}\b/)||[''])[0],z=sh.zones.find(z=>pin&&pin.startsWith(z.pin));
 let fee=z?z.charge:sh.charge;
 if((sh.freeAbove&&sub-disc>=sh.freeAbove)||(c&&c.freeShip))fee=0;
 return{sub,disc,ship:fee,total:sub-disc+fee,coupon:c,err,days:z?z.days:0};
};

/* Place order with coupon + shipping applied */
const basePlace=S.place;
S.place=cu=>{
 const q=S.quote(cu.coupon,cu.address);if(q.err)return{err:q.err};
 const r=basePlace({name:cu.name,phone:cu.phone,address:cu.address});if(r.err)return r;
 const o=r.order;
 const extra={total:q.total,discount:q.disc,shipping:q.ship,coupon:q.coupon?q.coupon.code:'',pay:'COD',payStatus:'Pending'};
 S.set('orders',S.orders().map(x=>x.id===o.id?{...x,...extra}:x));
 if(q.coupon)S.set('coupons',S.get('coupons',[]).map(x=>x.code===q.coupon.code?{...x,used:(x.used||0)+1}:x));
 return{order:{...o,...extra}};
};

/* Blocked customers cannot sign in or keep a session */
const baseMe=S.me,baseLogin=S.login;
S.me=()=>{const m=baseMe();return m&&m.blocked?null:m};
S.login=(e,p)=>{const ok=baseLogin(e,p);if(ok&&S.me()===null){S.logout();return false}return ok};

/* Homepage grid: hides hidden products, shows labels and discounts */
S.grid=el=>{
 el.innerHTML=S.products().filter(p=>p.visible!==false).map(p=>{
  const out=p.stock<1||p.badge==='Sold out',off=+p.mrp>+p.price?Math.round((1-p.price/p.mrp)*100):0;
  return `<div class="sd-product-card">${off?`<span class="sd-sale-badge">${off}% OFF</span>`:(p.badge&&p.badge!=='Sold out'?`<span class="sd-sale-badge" style="background:#8A9A5B">${S.esc(p.badge.toUpperCase())}</span>`:'')}
  <a href="${S.ROOT}navbar/shop/index.html"><img src="${S.src((p.images&&p.images[0])||p.img)}" alt="${S.esc(p.name)}"></a><h3>${S.esc(p.name)}</h3><p class="sd-cat">${S.esc(p.desc)}</p>
  <p class="sd-price">${S.money(p.price)}/-</p>${off?`<p class="sd-cat"><s>${S.money(p.mrp)}</s></p>`:''}
  <button class="sd-btn-cart" ${out?'disabled':''}>${out?'SOLD OUT':'ADD TO CART'}</button></div>`}).join('');
};
})();
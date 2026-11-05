(function(){
const ROOT=window.ROOT||'';
const DEF={
 settings:{heroSub:'Nature’s Purity in Every Sip',heroTitle:'Whole Body\nHealth starts in\nthe guts',featureTitle:'Premium Herbal Wellness\nTea Blends',featureDesc:'Discover handcrafted herbal wellness teas made with carefully selected botanicals for a naturally healthier way to unwind.',fromPrice:'FROM ₹ 399/-',whatsapp:'',password:'sukhdev123'},
 products:[{id:'p1',name:'Herbal Wellness Tea',desc:'Calming Herbal Infusion | Refreshing • Relaxing • Antioxidant',price:399,stock:50,img:'image/product1.png'}]
};
const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem('sd_'+k));return v==null?d:v}catch(e){return d}};
const set=(k,v)=>localStorage.setItem('sd_'+k,JSON.stringify(v));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const H=s=>{let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))|0;return 'h'+h};
const slug=n=>String(n).toLowerCase().replace(/[^a-z0-9]/g,'-');
const S={ROOT,get,set,esc,hash:H,slug,
 src:p=>!p?'':/^(https?:|data:|\/)/.test(p)?p:ROOT+p,
 money:n=>'₹ '+Number(n).toLocaleString('en-IN'),
 settings:()=>({...DEF.settings,...get('settings',{})}),
 products:()=>get('products',DEF.products),
 orders:()=>get('orders',[]),
 /* cart = YOUR cart system (sukhdev_cart) */
 cart:()=>{try{return JSON.parse(localStorage.getItem('sukhdev_cart'))||[]}catch(e){return[]}},
 total:()=>S.cart().reduce((a,i)=>a+i.price*i.qty,0),
 /* users */
 users:()=>get('users',[]),
 me(){const id=localStorage.getItem('sd_session');return S.users().find(u=>u.id===id)||null},
 register(d){const email=d.email.toLowerCase().trim();if(S.users().some(x=>x.email===email))return 'This email is already registered';
  const n={id:'u'+Date.now(),name:d.name,email,phone:d.phone,address:'',pass:H(d.password),joined:Date.now()};
  set('users',[...S.users(),n]);localStorage.setItem('sd_session',n.id);return ''},
 login(email,pw){const u=S.users().find(x=>x.email===email.toLowerCase().trim()&&x.pass===H(pw));if(!u)return false;localStorage.setItem('sd_session',u.id);return true},
 logout(){localStorage.removeItem('sd_session')},
 updateUser(patch){const m=S.me();if(m)set('users',S.users().map(u=>u.id===m.id?{...u,...patch}:u))},
 myOrders(){const m=S.me();return m?S.orders().filter(o=>o.uid===m.id):[]},
 /* orders */
 place(cu){const m=S.me(),c=S.cart();if(!m||!c.length)return{err:'Cart is empty or you are not logged in'};
  const ps=S.products();
  for(const i of c){const p=ps.find(x=>slug(x.name)===i.id);if(p&&i.qty>p.stock)return{err:p.name+': only '+p.stock+' left in stock'}}
  const o={id:'SD'+Date.now().toString().slice(-7),uid:m.id,date:Date.now(),...cu,items:c.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty})),total:S.total(),status:'New'};
  set('orders',[o,...S.orders()]);
  set('products',ps.map(p=>{const i=c.find(x=>x.id===slug(p.name));return i?{...p,stock:p.stock-i.qty}:p}));
  localStorage.removeItem('sukhdev_cart');return{order:o}},
 cancel(id){const o=S.orders().find(x=>x.id===id);if(!o||o.status!=='New')return false;
  set('orders',S.orders().map(x=>x.id===id?{...x,status:'Cancelled'}:x));
  set('products',S.products().map(p=>{const i=o.items.find(x=>x.id===slug(p.name));return i?{...p,stock:p.stock+i.qty}:p}));return true},
 wa(o){const n=(S.settings().whatsapp||'').replace(/\D/g,'');if(!n)return '';
  return 'https://wa.me/'+n+'?text='+encodeURIComponent('New order '+o.id+'\n'+o.name+', '+o.phone+'\n'+o.address+'\n'+o.items.map(i=>i.name+' x'+i.qty).join('\n')+'\nTotal: '+S.money(o.total))},
 site(){const s=S.settings();document.querySelectorAll('[data-site]').forEach(e=>{const v=s[e.dataset.site];if(v!=null)e.innerHTML=esc(v).replace(/\n/g,'<br>')})},
 grid(el){el.innerHTML=S.products().map(p=>`<div class="sd-product-card"><a href="${ROOT}navbar/shop/index.html"><img src="${S.src(p.img)}" alt="${esc(p.name)}"></a><h3>${esc(p.name)}</h3><p class="sd-cat">${esc(p.desc)}</p><p class="sd-price">${S.money(p.price)}/-</p><button class="sd-btn-cart" ${p.stock<1?'disabled':''}>${p.stock<1?'SOLD OUT':'ADD TO CART'}</button></div>`).join('')}
};
document.addEventListener('DOMContentLoaded',()=>{
 S.site();
 const g=document.getElementById('product-grid');if(g)S.grid(g);
});
window.Store=S;
})();
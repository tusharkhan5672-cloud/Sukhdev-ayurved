(function(){
'use strict';
const $=q=>document.querySelector(q);
if(typeof window.Store==='undefined'){$('#lerr').textContent='store.js not found. Keep store.js in the same folder as admin.html and open the site with Live Server.';return}
const S=window.Store,E=S.esc;

/* ---- extra styles (so dash.css stays untouched) ---- */
const sty=document.createElement('style');
sty.textContent=`.badge.Paid,.badge.Resolved{background:#e1f3e4;color:#1f7a3a}.badge.Pending,.badge.Open{background:#fff3d6;color:#8a6200}.badge.Failed,.badge.Blocked{background:#fbe4e3;color:#b8433f}.badge.Refunded{background:#ece6ff;color:#6d28d9}
.ck{display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:.85rem;text-transform:none;letter-spacing:0;color:var(--tx)}.ck input{width:auto;margin:0}
.thumbs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.thumbs div{position:relative}.thumbs img{width:56px;height:56px;object-fit:cover;border:1px solid var(--ln)}.thumbs button{position:absolute;top:-6px;right:-6px;background:var(--red);color:#fff;width:18px;height:18px;border-radius:50%;font-size:.7rem;line-height:18px}
.md{max-width:660px}.search.sm{max-width:160px}.mt{margin-top:14px}
@media(max-width:860px){.nav{overflow-x:auto}.nav button{min-width:66px}}`;
document.head.appendChild(sty);

/* ---- core helpers ---- */
const H=s=>{let h=5381;for(const c of String(s)){h=((h<<5)+h+c.charCodeAt(0))|0}return 'h'+h};
const DEF={id:'kushagarwal',pass:H('Kush@2026')};
const AC=()=>{let a=null;try{a=JSON.parse(localStorage.getItem('sd_admin'))}catch(e){}return(a&&a.id&&a.pass)?a:DEF};
const g=(k,d)=>S.get(k,d),sv=(k,v)=>S.set(k,v);
const ST=['New','Confirmed','Shipped','Delivered','Cancelled'],PAY=['Pending','Paid','Failed','Refunded'];
const PERM={manager:['dash','orders','products','customers','support','marketing','reports','payments','shipping','website'],support:['dash','orders','customers','support']};
const staff=()=>g('staff',[]),coupons=()=>g('coupons',[]),tickets=()=>g('tickets',[]),banners=()=>g('banners',[]);
const ship=()=>({charge:0,freeAbove:999,zones:[],couriers:['India Post','Delhivery','DTDC'],...g('shipping',{})});
const sess=()=>sessionStorage.getItem('sd_admin')||'';
const me=()=>{const x=sess();if(x==='1')return{id:AC().id,name:'Owner',role:'owner'};if(x.startsWith('staff:')){const u=staff().find(a=>a.id===x.slice(6)&&!a.off);if(u)return{id:u.id,name:u.name,role:u.role}}return null};
const ok=()=>!!me();
const can=v=>{const u=me();return !!u&&(u.role==='owner'||(PERM[u.role]||[]).includes(v))};
const log=m=>{const u=me();sv('logs',[{t:Date.now(),u:u?u.id:'-',m},...g('logs',[])].slice(0,300))};
const M=n=>(S.settings().currency||'₹')+' '+Number(n||0).toLocaleString('en-IN');
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)};
const DT=d=>new Date(d).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});
const D=d=>new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const live=o=>o.filter(x=>x.status!=='Cancelled'),rev=o=>live(o).reduce((a,x)=>a+x.total,0);
const kpi=(l,v)=>`<div class="kpi"><small>${l}</small><b>${v}</b></div>`;
const ic=p=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
const csvOut=(n,rows)=>dl(n,rows.map(r=>r.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');
const openModal=h=>{$('#md').innerHTML=h;$('#mb').classList.remove('hide')};
const closeModal=()=>{$('#mb').classList.add('hide');$('#md').innerHTML='';draw()};
const modalOpen=()=>!$('#mb').classList.contains('hide');
const tb=(h,rows,emp)=>`<table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.join('')||`<tr><td colspan="${h.length}" class="empty">${emp||'Nothing here yet'}</td></tr>`}</table>`;
const F=(l,id,v='',t='text',x='')=>`<label>${l}</label><input id="${id}" type="${t}" value="${E(v)}" ${x}>`;
const T=(l,id,v='',r=3)=>`<label>${l}</label><textarea id="${id}" rows="${r}">${E(v)}</textarea>`;
const CK=(l,id,v)=>`<label class="ck"><input type="checkbox" id="${id}" ${v?'checked':''}>${l}</label>`;
const SEL=(l,id,opts,v)=>`<label>${l}</label><select id="${id}">${opts.map(o=>{const[a,b]=Array.isArray(o)?o:[o,o];return`<option value="${E(a)}" ${a==v?'selected':''}>${E(b)}</option>`}).join('')}</select>`;
const val=id=>{const e=$('#'+id);return e?e.value.trim():''};
const lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);
const csvl=s=>s.split(',').map(x=>x.trim()).filter(Boolean);
const user=id=>S.users().find(u=>u.id===id);
const waLink=(ph,msg)=>{const p=String(ph||'').replace(/\D/g,'');return 'https://wa.me/'+(p.length===10?'91'+p:p)+'?text='+encodeURIComponent(msg)};
const doc=(title,body)=>{const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print');return}
 w.document.write(`<!doctype html><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:720px;margin:auto}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style>${body}`);
 w.document.close();w.focus();setTimeout(()=>w.print(),400)};
const shrink=f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,600/im.width),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.8))};im.src=fr.result};fr.readAsDataURL(f)});
const disc=p=>+p.mrp>+p.price?Math.round((1-p.price/p.mrp)*100):0;
const costOf=(P,n)=>{const p=P.find(x=>S.slug(x.name)===S.slug(n));return p&&+p.cost||0};

let view='dash',of='all',oq='',od1='',od2='',pq='',cq='',pf='all',tries=0,lock=0,last=Date.now(),ed={};

const NAV=[
 ['dash','Dashboard','<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'],
 ['orders','Orders','<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'],
 ['products','Products','<path d="M20 4c-9 0-15 4-15 11 0 2 1 4 3 5 7 0 12-6 12-16z"/><path d="M4 21c3-6 7-9 12-11"/>'],
 ['customers','Customers','<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 4a4 4 0 010 8M22 21c0-3-2-5-4-6"/>'],
 ['support','Support','<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'],
 ['marketing','Marketing','<path d="M3 11v2l12 5V6L3 11z"/><path d="M15 9a4 4 0 010 6"/>'],
 ['payments','Payments','<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'],
 ['shipping','Shipping','<path d="M1 6h14v10H1zM15 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'],
 ['reports','Reports','<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'],
 ['website','Website','<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
 ['security','Security','<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 018 0v4"/>'],
 ['settings','Settings','<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>']];

/* ---- login ---- */
function tryLogin(e){
 if(e)e.preventDefault();
 const err=$('#lerr');
 try{
  if(Date.now()<lock){err.textContent='Too many attempts. Wait 30 seconds.';return}
  const a=AC(),id=$('#uid').value.trim().toLowerCase(),pw=$('#upw').value;
  let who='';
  if(id===String(a.id).toLowerCase()&&H(pw)===a.pass)who='1';
  else{const u=staff().find(x=>x.id.toLowerCase()===id&&x.pass===H(pw)&&!x.off);if(u)who='staff:'+u.id}
  const hist=g('logins',[]);
  hist.unshift({t:Date.now(),id,ok:!!who});sv('logins',hist.slice(0,100));
  if(who){sessionStorage.setItem('sd_admin',who);tries=0;$('#upw').value='';err.textContent='';last=Date.now();log('Signed in');boot()}
  else{if(++tries>=5){lock=Date.now()+30000;tries=0}err.textContent='Wrong ID or password'}
 }catch(x){err.textContent='Error: '+x.message}
}
$('#lf').addEventListener('submit',tryLogin);
function boot(){
 $('#gate').classList.toggle('hide',ok());
 $('#console').classList.toggle('hide',!ok());
 if(ok())draw();
}
['click','keydown','input'].forEach(ev=>document.addEventListener(ev,()=>{last=Date.now()}));
setInterval(()=>{if(ok()&&Date.now()-last>15*60*1000){sessionStorage.removeItem('sd_admin');$('#mb').classList.add('hide');$('#md').innerHTML='';boot();$('#lerr').textContent='Signed out after 15 minutes of inactivity.'}},30000);

/* ---- order helpers ---- */
const updOrder=(id,patch)=>sv('orders',S.orders().map(o=>o.id===id?{...o,...patch}:o));
function setStatus(id,s){
 const o=S.orders().find(x=>x.id===id);if(!o||o.status===s)return;
 const dir=s==='Cancelled'?1:o.status==='Cancelled'?-1:0;
 if(dir)sv('products',S.products().map(p=>{const i=o.items.find(x=>x.id===S.slug(p.name));return i?{...p,stock:Math.max(0,p.stock+dir*i.qty)}:p}));
 const patch={status:s};
 if(s==='Delivered'&&(o.payStatus||'Pending')==='Pending'&&(o.pay||'COD')==='COD')patch.payStatus='Paid';
 updOrder(id,patch);log('Order #'+id+' → '+s);
}

/* ---- dashboard ---- */
function days(){const o=live(S.orders()),r=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const s=d.getTime();
 r.push({l:d.toLocaleDateString('en-IN',{weekday:'short'}),v:o.filter(x=>x.date>=s&&x.date<s+864e5).reduce((a,x)=>a+x.total,0)})}return r}
function topProducts(L){const tp={};L.forEach(x=>x.items.forEach(i=>{tp[i.name]=tp[i.name]||{q:0,r:0};tp[i.name].q+=i.qty;tp[i.name].r+=i.price*i.qty}));return Object.entries(tp).sort((a,b)=>b[1].r-a[1].r)}
function dash(){
 const o=S.orders(),P=S.products(),L=live(o),now=Date.now(),t0=new Date().setHours(0,0,0,0);
 const within=d=>L.filter(x=>x.date>=now-d*864e5).length;
 const profit=L.reduce((a,x)=>a+x.items.reduce((b,i)=>b+(i.price-costOf(P,i.name))*i.qty,0),0);
 const units=L.reduce((a,x)=>a+x.items.reduce((b,i)=>b+i.qty,0),0);
 const dd=days(),mx=Math.max(...dd.map(x=>x.v),1),top=topProducts(L).slice(0,5),tm=top[0]?top[0][1].r:1,low=P.filter(x=>x.stock<=5);
 const act=[...S.users().map(u=>({t:u.joined,m:E(u.name)+' registered'})),...o.map(x=>({t:x.date,m:E(x.name)+(x.status==='Cancelled'?' cancelled order #':' placed order #')+x.id}))].sort((a,b)=>b.t-a.t).slice(0,8);
 return `<div class="kpis">${kpi('Total revenue',M(rev(o)))}${kpi('Units sold',units)}${kpi('Profit',M(profit))}${kpi('Orders today',L.filter(x=>x.date>=t0).length)}${kpi('Last 7 days',within(7))}${kpi('Last 30 days',within(30))}${kpi('Pending (new)',o.filter(x=>x.status==='New').length)}${kpi('Cancelled',o.filter(x=>x.status==='Cancelled').length)}${kpi('Customers',S.users().length)}</div>
 <div class="two"><div class="card"><h3>Sales, last 7 days</h3><div class="bars">${dd.map(x=>`<div class="bar"><em>${x.v?'₹'+x.v:''}</em><i style="height:${x.v/mx*85}%"></i></div>`).join('')}</div><div class="lbls">${dd.map(x=>`<span>${x.l}</span>`).join('')}</div></div>
 <div class="card"><h3>Low stock</h3>${low.map(x=>`<div class="row" style="margin-bottom:10px"><small><b>${E(x.name)}</b></small><small class="low">${x.stock} left</small></div>`).join('')||'<small>All products well stocked</small>'}</div></div>
 <div class="two"><div class="card"><h3>Best sellers</h3>${top.map(([n,v])=>`<div class="row"><small><b>${E(n)}</b> · ${v.q} sold</small><small>${M(v.r)}</small></div><div class="prog"><i style="width:${v.r/tm*100}%"></i></div>`).join('')||'<small>No sales yet</small>'}</div>
 <div class="card"><h3>Recent customer activity</h3>${act.map(a=>`<div class="row" style="margin-bottom:8px"><small>${a.m}</small><small>${D(a.t)}</small></div>`).join('')||'<small>No activity yet</small>'}</div></div>
 <div class="card"><h3>Recent orders</h3><div class="tw">${tb(['Order','Customer','Total','Status'],o.slice(0,6).map(x=>`<tr style="cursor:pointer" data-a="view" data-id="${x.id}"><td><b>#${x.id}</b></td><td>${E(x.name)}</td><td>${M(x.total)}</td><td><span class="badge ${x.status}">${x.status}</span></td></tr>`),'No orders yet')}</div></div>`;
}

/* ---- orders ---- */
function orders(){
 const o=S.orders(),c=k=>k==='all'?o.length:o.filter(x=>x.status===k).length;
 return `<div class="chips" style="margin-bottom:12px">${['all',...ST].map(k=>`<button class="chip ${of===k?'on':''}" data-a="of" data-id="${k}">${k==='all'?'All':k} (${c(k)})</button>`).join('')}</div>
 <div class="acts" style="margin-bottom:14px"><input class="search" id="oq" placeholder="Search ID, name, phone" value="${E(oq)}"><input class="search sm" type="date" id="od1" value="${od1}" title="From"><input class="search sm" type="date" id="od2" value="${od2}" title="To"></div>
 <div class="card"><div class="tw" id="list">${olist()}</div></div>`;
}
function olist(){
 const a=od1?new Date(od1).getTime():0,b=od2?new Date(od2).getTime()+864e5:Infinity;
 const l=S.orders().filter(x=>(of==='all'||x.status===of)&&x.date>=a&&x.date<b&&(x.id+x.name+x.phone).toLowerCase().includes(oq.toLowerCase()));
 return tb(['Order','Customer','Items','Total','Payment','Status',''],l.map(x=>`<tr><td><b>#${x.id}</b><small>${DT(x.date)}</small></td><td>${E(x.name)}<small>${E(x.phone)}</small></td>
 <td>${x.items.map(i=>E(i.name)+' ×'+i.qty).join('<br>')}</td><td><b>${M(x.total)}</b></td><td><span class="badge ${x.payStatus||'Pending'}">${x.payStatus||'Pending'}</span><small>${x.pay||'COD'}</small></td>
 <td><select class="mini" data-st="${x.id}">${ST.map(s=>`<option ${s===x.status?'selected':''}>${s}</option>`).join('')}</select></td>
 <td><button class="btn ghost sm" data-a="view" data-id="${x.id}">View</button></td></tr>`),'No orders found');
}
function viewOrder(id){
 const x=S.orders().find(o=>o.id===id);if(!x)return;
 const u=user(x.uid),sh=ship();
 openModal(`<div class="row"><h3>Order #${x.id}</h3><span class="badge ${x.status}">${x.status}</span></div><small>${DT(x.date)}</small>
 <div style="background:#faf8f3;padding:16px;margin:16px 0"><b>${E(x.name)}</b><small>${E(x.phone)}${u?' · '+E(u.email):''}</small><small>${E(x.address)}</small></div>
 <div class="items">${x.items.map(i=>`<div class="it"><div><b>${E(i.name)}</b><small>${M(i.price)} × ${i.qty}</small></div><b>${M(i.price*i.qty)}</b></div>`).join('')}</div>
 ${x.discount?`<div class="row mt"><small>Discount ${E(x.coupon||'')}</small><small>− ${M(x.discount)}</small></div>`:''}${x.shipping?`<div class="row"><small>Shipping</small><small>${M(x.shipping)}</small></div>`:''}
 <div class="row" style="margin:14px 0"><b>Total</b><span class="big">${M(x.total)}</span></div>
 <div class="fg"><div><label>Status</label><select data-st="${x.id}">${ST.map(s=>`<option ${s===x.status?'selected':''}>${s}</option>`).join('')}</select></div>
 <div><label>Payment (${x.pay||'COD'})</label><select data-ps="${x.id}">${PAY.map(s=>`<option ${s===(x.payStatus||'Pending')?'selected':''}>${s}</option>`).join('')}</select></div>
 <div>${SEL('Courier','oc',['',...sh.couriers],x.courier||'')}</div><div>${F('Tracking ID','ot',x.tracking||'')}</div></div>
 ${T('Internal note','on',x.note||'',2)}
 <div class="acts"><button class="btn" data-a="saveo" data-id="${x.id}">Save details</button><button class="btn ghost" data-a="print" data-id="${x.id}">Invoice</button><button class="btn ghost" data-a="slip" data-id="${x.id}">Packing slip</button>
 <a class="btn ghost" target="_blank" href="${waLink(x.phone,'Hi '+x.name+', update on your Sukhdev order '+x.id+': '+x.status+(x.tracking?'. Tracking: '+(x.courier||'')+' '+x.tracking:''))}">WhatsApp</a>
 ${u?`<a class="btn ghost" href="mailto:${E(u.email)}?subject=${encodeURIComponent('Your Sukhdev order '+x.id)}">Email</a>`:''}
 ${x.status!=='Cancelled'&&x.status!=='Delivered'?`<button class="btn danger" data-a="cancel" data-id="${x.id}">Cancel${(x.payStatus==='Paid')?' &amp; refund':''}</button>`:''}<button class="btn ghost" data-a="close">Close</button></div>`);
}
function invoice(id){
 const x=S.orders().find(o=>o.id===id);if(!x)return;const s=S.settings(),t=+s.taxPct||0;
 const tx=t?(x.total-x.total/(1+t/100)).toFixed(2):0;
 doc('Invoice',`<h1>${E(s.storeName||'Sukhdev')}</h1><p>${E(s.address||'')} ${E(s.phone||'')}<br>${s.gstin?'GSTIN: '+E(s.gstin):''}</p><h2>Invoice ${E((s.invPrefix||'INV-')+x.id)}</h2><p>${DT(x.date)}</p>
 <p><b>${E(x.name)}</b><br>${E(x.phone)}<br>${E(x.address)}</p>
 <table><tr><th>Item</th><th>Qty</th><th>Amount</th></tr>${x.items.map(i=>`<tr><td>${E(i.name)}</td><td>${i.qty}</td><td>${M(i.price*i.qty)}</td></tr>`).join('')}
 ${x.discount?`<tr><td colspan="2">Discount</td><td>− ${M(x.discount)}</td></tr>`:''}${x.shipping?`<tr><td colspan="2">Shipping</td><td>${M(x.shipping)}</td></tr>`:''}
 <tr><td colspan="2"><b>Total</b></td><td><b>${M(x.total)}</b></td></tr></table>${t?`<p>Includes GST ${t}%: ${M(tx)}</p>`:''}<p>Payment: ${x.pay||'COD'} (${x.payStatus||'Pending'})</p><p>${E(s.invFooter||'Thank you for your order.')}</p>`);
}
function slip(id){
 const x=S.orders().find(o=>o.id===id);if(!x)return;
 doc('Packing slip',`<h1>Packing slip · #${x.id}</h1><p><b>${E(x.name)}</b><br>${E(x.phone)}<br>${E(x.address)}</p><table><tr><th>Item</th><th>Qty</th><th>Packed</th></tr>${x.items.map(i=>`<tr><td>${E(i.name)}</td><td>${i.qty}</td><td>☐</td></tr>`).join('')}</table>${x.note?`<p>Note: ${E(x.note)}</p>`:''}`);
}
function label(id){
 const x=S.orders().find(o=>o.id===id);if(!x)return;const s=S.settings();
 doc('Shipping label',`<div style="border:2px solid #000;padding:20px"><h2>TO</h2><p style="font-size:1.3rem"><b>${E(x.name)}</b><br>${E(x.address)}<br>Phone: ${E(x.phone)}</p><hr><p>FROM: ${E(s.storeName||'Sukhdev')}, ${E(s.address||'')} ${E(s.phone||'')}</p><p>Order #${x.id} · ${x.pay==='Prepaid'||x.payStatus==='Paid'?'PREPAID':'COD: '+M(x.total)}</p><p>Courier: ${E(x.courier||'-')} · Tracking: ${E(x.tracking||'-')}</p></div>`);
}

/* ---- products ---- */
function products(){return `<div class="row" style="margin-bottom:18px"><input class="search" id="pq" placeholder="Search products" value="${E(pq)}"><div class="acts"><button class="btn ghost sm" data-a="csvp">Export CSV</button><button class="btn" data-a="pform">Add product</button></div></div><div class="card"><div class="tw" id="list">${plist()}</div></div>`}
function plist(){
 const l=S.products().filter(p=>(p.name+(p.cat||'')+(p.coll||'')).toLowerCase().includes(pq.toLowerCase()));
 return tb(['','Product','Category','Price','Stock','Label','Visible',''],l.map(p=>`<tr><td><img src="${S.src((p.images&&p.images[0])||p.img)}" alt=""></td><td><b>${E(p.name)}</b><small>${E(p.desc)}</small></td>
 <td>${E(p.cat||'-')}<small>${E(p.coll||'')}</small></td><td>${M(p.price)}${disc(p)?`<small><s>${M(p.mrp)}</s> · ${disc(p)}% off</small>`:''}</td>
 <td><input class="stk ${p.stock<=5?'low':''}" type="number" min="0" value="${p.stock}" data-stk="${p.id}"></td>
 <td>${p.badge?`<span class="badge ${p.badge==='Sold out'?'Cancelled':'Confirmed'}">${E(p.badge)}</span>`:'-'}</td>
 <td><input type="checkbox" style="width:auto;margin:0" data-vis="${p.id}" ${p.visible===false?'':'checked'}></td>
 <td><div class="acts"><button class="btn ghost sm" data-a="pform" data-id="${p.id}">Edit</button><button class="btn danger sm" data-a="delp" data-id="${p.id}">Delete</button></div></td></tr>`),'No products');
}
function pvals(){return{name:val('pn'),desc:val('pd'),cat:val('pc'),coll:val('pl'),price:+val('pp')||0,mrp:+val('pm')||0,cost:+val('pk')||0,stock:+val('ps')||0,sizes:csvl(val('pz')),colours:csvl(val('pcl')),badge:val('pb'),visible:$('#pv')?$('#pv').checked:true,urls:val('pu')}}
function pform(id,keep){
 const e=keep||(id&&S.products().find(x=>x.id===id))||{};
 if(!keep)ed={images:(e.images&&e.images.length?e.images:(e.img?[e.img]:[])).slice()};
 const cats=[...new Set(S.products().map(p=>p.cat).filter(Boolean))],cols=[...new Set(S.products().map(p=>p.coll).filter(Boolean))];
 openModal(`<h3 style="margin-bottom:18px">${id?'Edit':'Add'} product</h3>${F('Name','pn',e.name||'')}${F('Description','pd',e.desc||'')}
 <div class="fg"><div>${F('Category','pc',e.cat||'','text','list="cl"')}<datalist id="cl">${cats.map(c=>`<option value="${E(c)}">`).join('')}</datalist></div><div>${F('Collection','pl',e.coll||'','text','list="ccl"')}<datalist id="ccl">${cols.map(c=>`<option value="${E(c)}">`).join('')}</datalist></div>
 <div>${F('Selling price (₹)','pp',e.price||'','number')}</div><div>${F('MRP / original price (₹)','pm',e.mrp||'','number')}</div>
 <div>${F('Cost price (₹, for profit)','pk',e.cost||'','number')}</div><div>${F('Stock','ps',e.stock==null?'':e.stock,'number')}</div>
 <div>${F('Sizes (comma separated)','pz',(e.sizes||[]).join(', '))}</div><div>${F('Colours (comma separated)','pcl',(e.colours||[]).join(', '))}</div></div>
 ${SEL('Label','pb',[['','None'],'Featured','New','Sold out'],e.badge||'')}${CK('Visible on website','pv',e.visible!==false)}
 <label>Images (first one is the main image)</label><div class="thumbs">${ed.images.map((m,i)=>`<div><img src="${S.src(m)}" alt=""><button type="button" data-a="rmimg" data-id="${i}">×</button></div>`).join('')||'<small>No images yet</small>'}</div>
 ${T('Add image URLs / paths (one per line)','pu',e.urls||'',2)}<label>Or upload images</label><input id="pf" type="file" accept="image/*" multiple>
 <div class="acts"><button class="btn" data-a="savep" data-id="${id||''}">Save product</button><button class="btn ghost" data-a="close">Cancel</button></div>`);
}

/* ---- customers & support ---- */
function customers(){return `<div class="row" style="margin-bottom:18px"><input class="search" id="cq" placeholder="Search customers" value="${E(cq)}"><div class="acts"><small>${S.users().length} registered</small><button class="btn ghost sm" data-a="csvc">Export CSV</button></div></div><div class="card"><div class="tw" id="list">${clist()}</div></div>`}
function clist(){
 const o=S.orders(),l=S.users().filter(u=>(u.name+u.email+u.phone).toLowerCase().includes(cq.toLowerCase()));
 return tb(['Customer','Contact','Joined','Orders','Spent',''],l.map(u=>{const m=o.filter(x=>x.uid===u.id);return `<tr><td><div class="acts" style="flex-wrap:nowrap"><div class="av">${E(u.name.slice(0,1).toUpperCase())}</div><div><b>${E(u.name)}</b> ${u.blocked?'<span class="badge Blocked">Blocked</span>':''}<small>${E(u.address||'No address')}</small></div></div></td>
 <td>${E(u.email)}<small>${E(u.phone)}</small></td><td>${D(u.joined)}</td><td>${m.length}</td><td><b>${M(rev(m))}</b></td><td><button class="btn ghost sm" data-a="viewc" data-id="${u.id}">Open</button></td></tr>`}),'No customers yet');
}
function viewCust(id){
 const u=user(id);if(!u)return;const m=S.orders().filter(x=>x.uid===id),tk=tickets().filter(x=>x.uid===id);
 openModal(`<div class="row"><h3>${E(u.name)}</h3>${u.blocked?'<span class="badge Blocked">Blocked</span>':''}</div><small>${E(u.email)} · ${E(u.phone)} · Joined ${D(u.joined)}</small>
 <div class="kpis" style="margin:16px 0">${kpi('Orders',m.length)}${kpi('Lifetime spend',M(rev(m)))}</div>
 ${T('Delivery address','ca',u.address||'',2)}
 <div class="acts"><button class="btn sm" data-a="savec" data-id="${id}">Save address</button><button class="btn ${u.blocked?'ghost':'danger'} sm" data-a="blockc" data-id="${id}">${u.blocked?'Unblock':'Block account'}</button><a class="btn ghost sm" target="_blank" href="${waLink(u.phone,'Hi '+u.name+', this is Sukhdev.')}">WhatsApp</a><a class="btn ghost sm" href="mailto:${E(u.email)}">Email</a></div>
 <h3 class="sec">Order history</h3>${m.map(x=>`<div class="row" style="margin-bottom:8px"><small><b>#${x.id}</b> · ${D(x.date)}</small><small>${M(x.total)} <span class="badge ${x.status}">${x.status}</span></small></div>`).join('')||'<small>No orders</small>'}
 <h3 class="sec">Complaints &amp; support</h3>${tk.map(t=>`<div class="row" style="margin-bottom:8px"><small>${E(t.subject)}</small><span class="badge ${t.status}">${t.status}</span></div>`).join('')||'<small>No tickets</small>'}
 <div class="row mt" style="flex-wrap:nowrap"><input id="ts" placeholder="Log a complaint / request" style="margin:0"><button class="btn sm" data-a="newt" data-id="${id}">Add</button></div>
 <div class="acts mt"><button class="btn ghost" data-a="close">Close</button></div>`);
}
function support(){
 const us=S.users(),tk=tickets();
 return `<div class="card"><h3>Log a complaint / support request</h3><div class="row" style="flex-wrap:nowrap;gap:10px"><select id="tu" style="margin:0">${us.map(u=>`<option value="${u.id}">${E(u.name)} · ${E(u.email)}</option>`).join('')||'<option value="">No customers</option>'}</select><input id="ts" placeholder="Subject" style="margin:0"><button class="btn sm" data-a="newt">Add</button></div></div>
 <div class="card"><div class="tw">${tb(['Customer','Subject','Date','Status',''],tk.map(t=>{const u=user(t.uid);return `<tr><td>${u?E(u.name):'-'}</td><td>${E(t.subject)}</td><td>${D(t.date)}</td><td><span class="badge ${t.status}">${t.status}</span></td><td><div class="acts"><button class="btn ghost sm" data-a="tk" data-id="${t.id}">${t.status==='Open'?'Resolve':'Reopen'}</button><button class="btn danger sm" data-a="delt" data-id="${t.id}">Delete</button></div></td></tr>`}),'No tickets')}</div></div>`;
}

/* ---- marketing ---- */
function marketing(){
 const cp=coupons(),bn=banners(),P=S.products();
 return `<div class="card"><div class="row"><h3>Coupon codes</h3><button class="btn sm" data-a="cform">New coupon</button></div><div class="tw">${tb(['Code','Discount','Min order','Expiry','Used','Status',''],cp.map(c=>`<tr><td><b>${E(c.code)}</b>${c.freeShip?'<small>+ free shipping</small>':''}</td><td>${c.type==='%'?c.value+'%':M(c.value)}</td><td>${c.min?M(c.min):'-'}</td><td>${c.exp||'-'}</td><td>${c.used||0}${c.limit?' / '+c.limit:''}</td><td><span class="badge ${c.on===false?'Cancelled':'Delivered'}">${c.on===false?'Off':'Active'}</span></td>
 <td><div class="acts"><button class="btn ghost sm" data-a="cform" data-id="${c.code}">Edit</button><button class="btn danger sm" data-a="delc" data-id="${c.code}">Delete</button></div></td></tr>`),'No coupons yet')}</div></div>
 <div class="card"><div class="row"><h3>Homepage banners &amp; campaigns</h3><button class="btn sm" data-a="bform">New banner</button></div><div class="tw">${tb(['Title','Text','Link','Status',''],bn.map(b=>`<tr><td><b>${E(b.title)}</b></td><td>${E(b.text)}</td><td>${E(b.link||'-')}</td><td><span class="badge ${b.on?'Delivered':'Cancelled'}">${b.on?'Live':'Hidden'}</span></td><td><div class="acts"><button class="btn ghost sm" data-a="bform" data-id="${b.id}">Edit</button><button class="btn danger sm" data-a="delb" data-id="${b.id}">Delete</button></div></td></tr>`),'No banners yet')}</div></div>
 <div class="card"><h3>Featured product placement</h3>${P.map(p=>`<label class="ck"><input type="checkbox" data-feat="${p.id}" ${p.badge==='Featured'?'checked':''}>${E(p.name)}</label>`).join('')||'<small>No products</small>'}</div>`;
}
function cform(code){
 const c=coupons().find(x=>x.code===code)||{type:'%',on:true};
 openModal(`<h3 style="margin-bottom:18px">${code?'Edit':'New'} coupon</h3><div class="fg"><div>${F('Code','cc',c.code||'')}</div><div>${SEL('Type','ct',[['%','Percentage'],['₹','Fixed amount']],c.type)}</div>
 <div>${F('Value','cv',c.value||'','number')}</div><div>${F('Min order (₹)','cm',c.min||'','number')}</div><div>${F('Expiry date','ce',c.exp||'','date')}</div><div>${F('Usage limit (blank = unlimited)','cl',c.limit||'','number')}</div></div>
 ${CK('Free shipping with this coupon','cs',c.freeShip)}${CK('Active','ca2',c.on!==false)}<div class="acts"><button class="btn" data-a="savec2" data-id="${code||''}">Save</button><button class="btn ghost" data-a="close">Cancel</button></div>`);
}
function bform(id){
 const b=banners().find(x=>x.id===id)||{on:true};
 openModal(`<h3 style="margin-bottom:18px">${id?'Edit':'New'} banner</h3>${F('Title','bt',b.title||'')}${T('Text','bx',b.text||'',2)}${F('Link','bl',b.link||'')}${CK('Show on homepage','bo',b.on)}<div class="acts"><button class="btn" data-a="saveb" data-id="${id||''}">Save</button><button class="btn ghost" data-a="close">Cancel</button></div>`);
}

/* ---- payments ---- */
function payments(){
 const o=S.orders().filter(x=>x.status!=='Cancelled'||x.payStatus==='Refunded'),p=x=>x.payStatus||'Pending',sum=k=>o.filter(x=>p(x)===k).reduce((a,x)=>a+x.total,0);
 const l=o.filter(x=>pf==='all'||p(x)===pf);
 return `<div class="kpis">${kpi('Collected',M(sum('Paid')))}${kpi('Pending / COD due',M(sum('Pending')))}${kpi('Failed',M(sum('Failed')))}${kpi('Refunded',M(sum('Refunded')))}</div>
 <div class="chips" style="margin-bottom:14px">${['all',...PAY].map(k=>`<button class="chip ${pf===k?'on':''}" data-a="pf" data-id="${k}">${k==='all'?'All':k}</button>`).join('')}</div>
 <div class="card"><div class="tw">${tb(['Order','Customer','Method','Amount','Payment status','Order status',''],l.map(x=>`<tr><td><b>#${x.id}</b><small>${D(x.date)}</small></td><td>${E(x.name)}</td><td>${x.pay||'COD'}</td><td>${M(x.total)}</td>
 <td><select class="mini" data-ps="${x.id}">${PAY.map(s=>`<option ${s===p(x)?'selected':''}>${s}</option>`).join('')}</select></td><td><span class="badge ${x.status}">${x.status}</span></td>
 <td>${p(x)==='Paid'?`<button class="btn danger sm" data-a="refund" data-id="${x.id}">Refund</button>`:''}</td></tr>`),'No transactions')}</div></div>
 <div class="acts"><button class="btn ghost sm" data-a="csvpay">Export payment report</button></div>`;
}

/* ---- shipping ---- */
function shipping(){
 const sh=ship(),o=S.orders().filter(x=>['Confirmed','Shipped'].includes(x.status));
 return `<div class="two"><div class="card"><h3>Shipping rules</h3><div class="fg"><div>${F('Flat shipping charge (₹)','sc',sh.charge,'number')}</div><div>${F('Free shipping above (₹, 0 = never)','sf',sh.freeAbove,'number')}</div></div>
 ${F('Courier partners (comma separated)','sp',sh.couriers.join(', '))}${T('Delivery zones: PIN prefix | charge | days (one per line, e.g. 4920|40|3)','sz',sh.zones.map(z=>[z.pin,z.charge,z.days].join('|')).join('\n'),4)}<button class="btn" data-a="saveship">Save shipping</button></div>
 <div class="card"><h3>How it works</h3><small>Zones match the start of the 6-digit PIN found in the delivery address. No match = flat charge. Free-shipping threshold and coupons override charges. Needs store-ext.js on the storefront.</small></div></div>
 <div class="card"><h3>Shipments to handle</h3><div class="tw">${tb(['Order','Deliver to','Courier / tracking','Status',''],o.map(x=>`<tr><td><b>#${x.id}</b></td><td>${E(x.name)}<small>${E(x.address)}</small></td><td>${E(x.courier||'-')}<small>${E(x.tracking||'No tracking yet')}</small></td>
 <td><span class="badge ${x.failed?'Failed':x.status}">${x.failed?'Delivery failed':x.status}</span></td><td><div class="acts"><button class="btn ghost sm" data-a="view" data-id="${x.id}">Edit</button><button class="btn ghost sm" data-a="label" data-id="${x.id}">Label</button><button class="btn ${x.failed?'ghost':'danger'} sm" data-a="fail" data-id="${x.id}">${x.failed?'Retry':'Failed'}</button></div></td></tr>`),'No shipments pending')}</div></div>`;
}

/* ---- reports ---- */
function reports(){
 const o=S.orders(),L=live(o),U=S.users(),now=Date.now();
 const byM={};L.forEach(x=>{const k=new Date(x.date).toISOString().slice(0,7);byM[k]=byM[k]||{n:0,r:0};byM[k].n++;byM[k].r+=x.total});
 const mo=Object.entries(byM).sort().reverse().slice(0,6),top=topProducts(L);
 const rep=U.filter(u=>L.filter(x=>x.uid===u.id).length>1).length,buyers=U.filter(u=>L.some(x=>x.uid===u.id)).length;
 const pct=(a,b)=>b?Math.round(a/b*100)+'%':'0%',cancel=o.filter(x=>x.status==='Cancelled').length;
 const ps=k=>o.filter(x=>(x.payStatus||'Pending')===k).reduce((a,x)=>a+x.total,0);
 return `<div class="kpis">${kpi('Cancellation rate',pct(cancel,o.length))}${kpi('New customers (30d)',U.filter(u=>u.joined>=now-30*864e5).length)}${kpi('Repeat buyers',pct(rep,buyers))}${kpi('Refunds',M(ps('Refunded')))}</div>
 <div class="acts" style="margin-bottom:16px"><button class="btn ghost sm" data-a="csv">Orders CSV</button><button class="btn ghost sm" data-a="csvs">Product sales CSV</button><button class="btn ghost sm" data-a="csvp">Products CSV</button><button class="btn ghost sm" data-a="csvc">Customers CSV</button><small>CSV files open directly in Excel.</small></div>
 <div class="two"><div class="card"><h3>Revenue by month</h3>${tb(['Month','Orders','Revenue'],mo.map(([k,v])=>`<tr><td>${k}</td><td>${v.n}</td><td>${M(v.r)}</td></tr>`),'No sales yet')}</div>
 <div class="card"><h3>Payments</h3>${tb(['Status','Amount'],PAY.map(k=>`<tr><td>${k}</td><td>${M(ps(k))}</td></tr>`))}</div></div>
 <div class="card"><h3>Product-wise sales</h3>${tb(['Product','Units','Revenue'],top.map(([n,v])=>`<tr><td>${E(n)}</td><td>${v.q}</td><td>${M(v.r)}</td></tr>`),'No sales yet')}</div>`;
}

/* ---- website & settings (shared saver) ---- */
const WEB=[['announce','Announcement bar text'],['heroSub','Hero small text'],['heroTitle','Hero title','t'],['featureTitle','Feature title','t'],['featureDesc','Feature description','t'],['fromPrice','“From” price text'],
 ['showFeature','Show “New arrivals” section','c'],['showBest','Show bestsellers section','c'],['showPromo','Show “coming soon” promo cards','c'],
 ['instagram','Instagram URL'],['facebook','Facebook URL'],['youtube','YouTube URL'],['footerText','Footer text'],
 ['pageAbout','About page','t'],['pageContact','Contact page','t'],['pageFaq','FAQ page','t']];
const BIZ=[['storeName','Store name'],['logo','Logo URL / path'],['phone','Contact phone'],['email','Contact email'],['address','Business address','t'],['gstin','GSTIN'],['taxPct','GST % (prices include tax)'],['currency','Currency symbol'],['invPrefix','Invoice prefix'],['invFooter','Invoice footer note'],
 ['whatsapp','WhatsApp number (with country code, e.g. 919876543210)'],['notifyEmail','Order alert email'],['notifyWa','Send new-order alerts on WhatsApp','c'],['notifyMail','Send new-order alerts by email','c'],
 ['pPrivacy','Privacy policy','t'],['pTerms','Terms & conditions','t'],['pRefund','Refund & cancellation policy','t']];
const sform=list=>{const s=S.settings();return list.map(([k,l,t])=>t==='c'?CK(l,'k_'+k,s[k]!==false&&!!s[k]):t==='t'?T(l,'k_'+k,s[k]||'',3):F(l,'k_'+k,s[k]||'')).join('')};
function website(){return `<div class="card"><h3>Website content</h3>${sform(WEB)}<small style="margin-bottom:12px">Product visibility is controlled on the Products page; banners under Marketing.</small><button class="btn" data-a="saves">Save changes</button></div>`}
function settings(){
 return `<div class="two"><div class="card"><h3>Business settings</h3>${sform(BIZ)}<button class="btn" data-a="saves">Save changes</button></div>
 <div class="card"><h3>Backup &amp; restore</h3><small style="margin-bottom:14px">Data lives in this browser. Export a backup regularly.</small><div class="acts"><button class="btn ghost sm" data-a="export">Export</button><label class="btn ghost sm" style="margin:0;cursor:pointer">Import<input type="file" id="imp" accept=".json" class="hide"></label><button class="btn danger sm" data-a="reset">Reset all</button></div></div></div>`;
}

/* ---- security ---- */
function security(){
 const a=AC(),sf=staff(),lg=g('logins',[]).slice(0,10),ac=g('logs',[]).slice(0,25);
 return `<div class="two"><div class="card"><h3>Owner login</h3>${F('Admin ID','aid',a.id)}${F('Current password','acp','','password')}${F('New password (optional)','anp','','password')}<button class="btn" data-a="savea">Update login</button>
 <small class="mt">Sessions expire after 15 minutes of inactivity.</small></div>
 <div class="card"><div class="row"><h3>Staff accounts</h3><button class="btn sm" data-a="stform">Add staff</button></div>${tb(['Name','ID','Role',''],sf.map(u=>`<tr><td>${E(u.name)}${u.off?' <span class="badge Blocked">Off</span>':''}</td><td>${E(u.id)}</td><td>${u.role}</td><td><div class="acts"><button class="btn ghost sm" data-a="stoff" data-id="${u.id}">${u.off?'Enable':'Disable'}</button><button class="btn danger sm" data-a="delst" data-id="${u.id}">Delete</button></div></td></tr>`),'No staff yet')}
 <small class="mt">Manager: everything except Settings &amp; Security. Support: orders, customers, support.</small></div></div>
 <div class="two"><div class="card"><h3>Login history</h3>${tb(['When','ID','Result'],lg.map(l=>`<tr><td>${DT(l.t)}</td><td>${E(l.id)}</td><td><span class="badge ${l.ok?'Paid':'Failed'}">${l.ok?'OK':'Failed'}</span></td></tr>`),'No logins')}</div>
 <div class="card"><h3>Activity log</h3>${tb(['When','User','Action'],ac.map(l=>`<tr><td>${DT(l.t)}</td><td>${E(l.u)}</td><td>${E(l.m)}</td></tr>`),'No activity')}</div></div>`;
}
function stform(){openModal(`<h3 style="margin-bottom:18px">Add staff</h3>${F('Name','sn')}${F('Login ID','si')}${SEL('Role','sr',['manager','support'],'support')}${F('Password (6+ chars)','sw','','password')}<div class="acts"><button class="btn" data-a="savest">Create</button><button class="btn ghost" data-a="close">Cancel</button></div>`)}

/* ---- shell ---- */
const V={dash,orders,products,customers,support,marketing,payments,shipping,reports,website,security,settings};
function draw(){
 if(!ok())return;
 if(!can(view))view='dash';
 try{
  const nw=S.orders().filter(x=>x.status==='New').length,nav=NAV.filter(n=>can(n[0]));
  $('#nav').innerHTML=nav.map(([k,l,p])=>`<button class="${view===k?'on':''}" data-a="nav" data-id="${k}">${ic(p)}<span>${l}</span>${k==='orders'&&nw?`<span class="n">${nw}</span>`:''}</button>`).join('');
  $('#ft').innerHTML=`<a href="index.html" target="_blank">${ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')}<span>View website</span></a><button data-a="out">${ic('<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>')}<span>Log out (${E(me().name)})</span></button>`;
  $('#ttl').textContent=NAV.find(n=>n[0]===view)[1];
  $('#tact').innerHTML=view==='orders'?'<button class="btn ghost sm" data-a="csv">Export CSV</button>':'';
  $('#content').innerHTML=V[view]();
 }catch(x){$('#content').innerHTML='<div class="card"><h3>Something went wrong</h3><small>'+E(x.message)+'</small></div>'}
}

/* ---- actions ---- */
const A={
 nav:id=>{view=id},of:id=>{of=id},pf:id=>{pf=id},
 out:()=>{log('Signed out');sessionStorage.removeItem('sd_admin');boot();return false},
 view:id=>{viewOrder(id);return false},close:()=>{closeModal();return false},
 print:id=>{invoice(id);return false},slip:id=>{slip(id);return false},label:id=>{label(id);return false},
 saveo:id=>{updOrder(id,{courier:val('oc'),tracking:val('ot'),note:val('on')});log('Order #'+id+' details updated');toast('Saved');return false},
 cancel:id=>{const o=S.orders().find(x=>x.id===id);if(!confirm('Cancel this order'+(o.payStatus==='Paid'?' and mark it refunded':'')+'?'))return false;setStatus(id,'Cancelled');if(o.payStatus==='Paid')updOrder(id,{payStatus:'Refunded'});closeModal();return false},
 refund:id=>{if(!confirm('Mark this order as refunded? Refund the money via your payment provider too.'))return false;updOrder(id,{payStatus:'Refunded'});log('Refunded #'+id)},
 fail:id=>{const o=S.orders().find(x=>x.id===id);updOrder(id,{failed:!o.failed});log('Order #'+id+(o.failed?' retry':' delivery failed'))},
 csv:()=>{csvOut('orders.csv',[['Order','Date','Name','Phone','Address','Items','Discount','Shipping','Total','Payment','Pay status','Status','Courier','Tracking'],...S.orders().map(x=>[x.id,DT(x.date),x.name,x.phone,x.address,x.items.map(i=>i.name+' x'+i.qty).join('; '),x.discount||0,x.shipping||0,x.total,x.pay||'COD',x.payStatus||'Pending',x.status,x.courier||'',x.tracking||''])]);return false},
 csvpay:()=>{csvOut('payments.csv',[['Order','Date','Method','Amount','Payment status','Order status'],...S.orders().map(x=>[x.id,DT(x.date),x.pay||'COD',x.total,x.payStatus||'Pending',x.status])]);return false},
 csvs:()=>{csvOut('product-sales.csv',[['Product','Units','Revenue'],...topProducts(live(S.orders())).map(([n,v])=>[n,v.q,v.r])]);return false},
 csvp:()=>{csvOut('products.csv',[['Name','Category','Collection','Price','MRP','Cost','Stock','Label','Visible'],...S.products().map(p=>[p.name,p.cat||'',p.coll||'',p.price,p.mrp||'',p.cost||'',p.stock,p.badge||'',p.visible!==false])]);return false},
 csvc:()=>{const o=S.orders();csvOut('customers.csv',[['Name','Email','Phone','Address','Joined','Orders','Spent','Blocked'],...S.users().map(u=>{const m=o.filter(x=>x.uid===u.id);return[u.name,u.email,u.phone,u.address||'',D(u.joined),m.length,rev(m),!!u.blocked]})]);return false},
 /* products */
 pform:id=>{pform(id);return false},
 rmimg:id=>{const v=pvals(),sid=document.querySelector('[data-a=savep]').dataset.id;ed.images.splice(+id,1);pform(sid,{...v,images:ed.images});return false},
 delp:id=>{if(!confirm('Delete this product?'))return false;sv('products',S.products().filter(x=>x.id!==id));log('Deleted product '+id)},
 savep:async id=>{
  const v=pvals();if(!v.name){toast('Name is required');return false}
  const imgs=[...ed.images,...lines(v.urls)];
  for(const f of ($('#pf').files||[]))imgs.push(await shrink(f));
  const old=S.products().find(x=>x.id===id)||{};
  const p={...old,id:id||'p'+Date.now(),name:v.name,desc:v.desc,cat:v.cat,coll:v.coll,price:v.price,mrp:v.mrp,cost:v.cost,stock:v.stock,sizes:v.sizes,colours:v.colours,badge:v.badge,visible:v.visible,images:imgs,img:imgs[0]||''};
  const l=S.products(),i=l.findIndex(x=>x.id===p.id);i<0?l.push(p):l[i]=p;sv('products',l);log('Saved product '+p.name);toast('Product saved');closeModal();return false},
 /* customers & support */
 viewc:id=>{viewCust(id);return false},
 savec:id=>{sv('users',S.users().map(u=>u.id===id?{...u,address:val('ca')}:u));toast('Address saved');return false},
 blockc:id=>{const u=user(id);if(!u.blocked&&!confirm('Block this account? They will not be able to sign in or order.'))return false;sv('users',S.users().map(x=>x.id===id?{...x,blocked:!x.blocked}:x));log((u.blocked?'Unblocked ':'Blocked ')+u.email);viewCust(id);return false},
 newt:id=>{const uid=id||val('tu'),sub=val('ts');if(!uid||!sub){toast('Pick a customer and write a subject');return false}
  sv('tickets',[{id:'t'+Date.now(),uid,subject:sub,status:'Open',date:Date.now()},...tickets()]);if(id){viewCust(id);return false}},
 tk:id=>sv('tickets',tickets().map(t=>t.id===id?{...t,status:t.status==='Open'?'Resolved':'Open'}:t)),
 delt:id=>{if(confirm('Delete this ticket?'))sv('tickets',tickets().filter(t=>t.id!==id))},
 /* marketing */
 cform:id=>{cform(id);return false},bform:id=>{bform(id);return false},
 savec2:id=>{const code=val('cc').toUpperCase().replace(/\s/g,'');if(!code||!(+val('cv')>0)){toast('Code and value are required');return false}
  const l=coupons(),old=l.find(x=>x.code===id);if(code!==id&&l.some(x=>x.code===code)){toast('Code already exists');return false}
  const c={code,type:val('ct'),value:+val('cv'),min:+val('cm')||0,exp:val('ce'),limit:+val('cl')||0,freeShip:$('#cs').checked,on:$('#ca2').checked,used:old?old.used||0:0};
  sv('coupons',old?l.map(x=>x.code===id?c:x):[...l,c]);log('Saved coupon '+code);closeModal();return false},
 delc:id=>{if(confirm('Delete coupon '+id+'?'))sv('coupons',coupons().filter(c=>c.code!==id))},
 saveb:id=>{const b={id:id||'b'+Date.now(),title:val('bt'),text:val('bx'),link:val('bl'),on:$('#bo').checked};if(!b.title){toast('Title is required');return false}
  const l=banners();sv('banners',id?l.map(x=>x.id===id?b:x):[...l,b]);closeModal();return false},
 delb:id=>{if(confirm('Delete banner?'))sv('banners',banners().filter(b=>b.id!==id))},
 /* shipping */
 saveship:()=>{sv('shipping',{charge:+val('sc')||0,freeAbove:+val('sf')||0,couriers:csvl(val('sp')),zones:lines(val('sz')).map(l=>{const[pin,charge,days]=l.split('|').map(x=>x.trim());return{pin,charge:+charge||0,days:+days||0}}).filter(z=>z.pin)});log('Shipping rules updated');toast('Shipping saved')},
 /* settings & website */
 saves:()=>{const s={...S.settings()};[...WEB,...BIZ].forEach(([k,,t])=>{const e=$('#k_'+k);if(e)s[k]=t==='c'?e.checked:e.value});sv('settings',s);log('Settings updated');toast('Saved');return false},
 savea:()=>{const c=AC();if(H(val('acp'))!==c.pass){toast('Current password is wrong');return false}
  const nid=val('aid');if(!nid){toast('ID cannot be empty');return false}const np=$('#anp').value;if(np&&np.length<6){toast('Password needs 6+ characters');return false}
  localStorage.setItem('sd_admin',JSON.stringify({id:nid,pass:np?H(np):c.pass}));log('Owner login changed');toast('Login updated');return false},
 stform:()=>{stform();return false},
 savest:()=>{const u={id:val('si'),name:val('sn'),role:val('sr'),pass:H($('#sw').value)};if(!u.id||!u.name||$('#sw').value.length<6){toast('Fill all fields (password 6+ chars)');return false}
  if(staff().some(x=>x.id.toLowerCase()===u.id.toLowerCase())||u.id.toLowerCase()===AC().id.toLowerCase()){toast('That ID is taken');return false}
  sv('staff',[...staff(),u]);log('Added staff '+u.id);closeModal();return false},
 stoff:id=>sv('staff',staff().map(u=>u.id===id?{...u,off:!u.off}:u)),
 delst:id=>{if(confirm('Delete this staff account?'))sv('staff',staff().filter(u=>u.id!==id))},
 export:()=>{const d={};Object.keys(localStorage).filter(k=>k.startsWith('sd_')&&!['sd_admin','sd_session'].includes(k)).forEach(k=>d[k]=localStorage.getItem(k));dl('sukhdev-backup-'+Date.now()+'.json',JSON.stringify(d),'application/json');return false},
 reset:()=>{if(confirm('This erases ALL orders, customers, products and settings. Continue?'))Object.keys(localStorage).filter(k=>k.startsWith('sd_')&&k!=='sd_admin').forEach(k=>localStorage.removeItem(k))}
};
document.addEventListener('click',async e=>{
 if(e.target.id==='mb')return closeModal();
 const t=e.target.closest('[data-a]');if(!t||!ok())return;
 const f=A[t.dataset.a];if(!f)return;
 try{if(await f(t.dataset.id,t)!==false)draw()}catch(x){toast('Error: '+x.message)}
});
document.addEventListener('change',async e=>{
 const t=e.target,d=t.dataset;if(!ok())return;
 if(d.st){setStatus(d.st,t.value);toast('Status updated');if(!modalOpen())draw()}
 if(d.ps){updOrder(d.ps,{payStatus:t.value});log('Payment #'+d.ps+' → '+t.value);toast('Payment updated');if(!modalOpen())draw()}
 if(d.stk){sv('products',S.products().map(p=>p.id===d.stk?{...p,stock:Math.max(0,+t.value||0)}:p));toast('Stock updated');$('#list').innerHTML=plist()}
 if(d.vis){sv('products',S.products().map(p=>p.id===d.vis?{...p,visible:t.checked}:p));toast('Visibility updated')}
 if(d.feat){sv('products',S.products().map(p=>p.id===d.feat?{...p,badge:t.checked?'Featured':(p.badge==='Featured'?'':p.badge)}:p));toast('Featured updated')}
 if(t.id==='imp'&&t.files[0]){try{const j=JSON.parse(await t.files[0].text());Object.keys(j).filter(k=>k.startsWith('sd_')&&!['sd_admin','sd_session'].includes(k)).forEach(k=>localStorage.setItem(k,j[k]));toast('Backup imported');draw()}catch(x){toast('Invalid backup file')}}
});
document.addEventListener('input',e=>{
 const i=e.target.id,v=e.target.value;
 if(i==='oq'||i==='od1'||i==='od2'){if(i==='oq')oq=v;if(i==='od1')od1=v;if(i==='od2')od2=v;$('#list').innerHTML=olist()}
 if(i==='pq'){pq=v;$('#list').innerHTML=plist()}
 if(i==='cq'){cq=v;$('#list').innerHTML=clist()}
});
boot();
})();
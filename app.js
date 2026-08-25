const C = {
  m: 'https://dar1cyycrips-maker.github.io/ice-darcy-world/tonconnect-manifest.json',
  w: 'UQAQ4D1q8hoC2mOiLBgx8ZSguB-MdTcKLAylFfeyWkxbC5Gp'
};

// ---------- sound ----------
class A {
  constructor(){this.c=null;this.e=true}
  i(){if(!this.c)this.c=new(window.AudioContext||window.webkitAudioContext)()}
  pT(){if(!this.e||!this.c)return;const o=this.c.createOscillator(),g=this.c.createGain();o.connect(g);g.connect(this.c.destination);o.frequency.setValueAtTime(800,this.c.currentTime);o.frequency.exponentialRampToValueAtTime(1200,this.c.currentTime+0.05);g.gain.setValueAtTime(0.08,this.c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.c.currentTime+0.08);o.start(this.c.currentTime);o.stop(this.c.currentTime+0.08)}
  pL(){if(!this.e||!this.c)return;[523,659,784,1047].forEach((f,i)=>{const o=this.c.createOscillator(),g=this.c.createGain();o.connect(g);g.connect(this.c.destination);o.frequency.value=f;g.gain.setValueAtTime(0.1,this.c.currentTime+i*0.1);g.gain.exponentialRampToValueAtTime(0.001,this.c.currentTime+i*0.1+0.2);o.start(this.c.currentTime+i*0.1);o.stop(this.c.currentTime+i*0.1+0.2)})}
  pE(){if(!this.e||!this.c)return;const o=this.c.createOscillator(),g=this.c.createGain();o.connect(g);g.connect(this.c.destination);o.frequency.setValueAtTime(200,this.c.currentTime);o.frequency.exponentialRampToValueAtTime(100,this.c.currentTime+0.15);g.gain.setValueAtTime(0.1,this.c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.c.currentTime+0.15);o.start(this.c.currentTime);o.stop(this.c.currentTime+0.15)}
  pR(){if(!this.e||!this.c)return;[440,554,659].forEach((f,i)=>{const o=this.c.createOscillator(),g=this.c.createGain();o.connect(g);g.connect(this.c.destination);o.frequency.value=f;g.gain.setValueAtTime(0.1,this.c.currentTime+i*0.08);g.gain.exponentialRampToValueAtTime(0.001,this.c.currentTime+i*0.08+0.15);o.start(this.c.currentTime+i*0.08);o.stop(this.c.currentTime+i*0.08+0.15)})}
}

// ---------- local-only prefs (kept as a tiny key/value helper) ----------
class S {
  constructor(){this.p='idw_'}
  k(k){return this.p+k}
  g(k){try{const v=localStorage.getItem(this.k(k));return v?JSON.parse(v):null}catch{return null}}
  s(k,v){localStorage.setItem(this.k(k),JSON.stringify(v))}
}

class App {
  constructor(){
    this.t=window.Telegram.WebApp;
    this.s=new S();
    this.a=new A();
    this.tc=null;
    this.db=null;
    this.profile=null;
    this.stock=[];
    this.i();
  }

  async i(){
    this.t.expand();this.t.ready();
    document.addEventListener('touchstart',()=>this.a.i(),{once:true});
    document.addEventListener('click',()=>this.a.i(),{once:true});

    let tid, uname='PLAYER';
    if(this.t.initDataUnsafe && this.t.initDataUnsafe.user){
      const u=this.t.initDataUnsafe.user;
      tid=u.id; uname=u.username||u.first_name||'PLAYER';
    } else {
      // Dev/testing outside Telegram: use a stable local pseudo-id.
      tid=Number(localStorage.getItem('idw_dev_id'))||(()=>{const v=Math.floor(Math.random()*1e9);localStorage.setItem('idw_dev_id',v);return v})();
    }
    this.db=new DB(tid, uname);
    document.getElementById('ud').innerText='@'+uname;

    try {
      await this.db.ensureProfile();
      this.profile=await this.db.getProfile();
      this.stock=await this.db.getStock();
    } catch (err) {
      this.t.showPopup({title:'⚠️ DB Error',message:String(err.message||err),buttons:[{id:'ok',text:'OK'}]});
      console.error(err);
    }

    this.iTC();
    this.cD();
    this.sEL();
    this.renderShop();
    this.rU();
    this.rColl();
    this.cG();

    setTimeout(()=>{const l=document.getElementById('ls');if(l){l.style.opacity='0';setTimeout(()=>l.remove(),500)}},1500);
  }

  iTC(){
    try{
      if(typeof TON_CONNECT_UI==='undefined')return;
      this.tc=new TON_CONNECT_UI.TonConnectUI({manifestUrl:C.m,buttonRootId:'tc'});
      this.tc.onStatusChange((w)=>{if(w)this.h('success')});
    }catch(err){console.error('TON Connect error:',err)}
  }

  sEL(){
    const t=document.getElementById('tb');
    t.addEventListener('pointerdown',(e)=>{e.preventDefault();this.hT(e)});
    t.addEventListener('contextmenu',(e)=>e.preventDefault());
  }

  async hT(e){
    const x=e.clientX,y=e.clientY;
    this.ft(x,y,'+1','#fff');this.sP(x,y);this.sR(x,y);
    this.a.pT();this.h('light');

    let res;
    try {
      res = await this.db.tap();
    } catch (err) {
      this.t.showPopup({title:'⚠️ Tap Error',message:String(err.message||err),buttons:[{id:'ok',text:'OK'}]});
      console.error(err);
      return;
    }
    this.profile.shards=Number(res.shards);
    this.profile.dust=Number(res.dust);
    const oldLevel=this.profile.level;
    this.profile.level=res.level;
    if(res.leveled_up){this.a.pL();this.h('success');this.sC();this.sLU(res.level)}
    this.rU();
    this.cG();
  }

  // ---------- SHOP (renders live stock; purchase is a reservation only) ----------
  renderShop(){
    const wrap=document.getElementById('shop-list');
    wrap.innerHTML='';
    this.stock.forEach((it,idx)=>{
      const pct=Math.round((it.remaining/it.total)*100);
      const soldOut=it.remaining<=0;
      const div=document.createElement('div');
      div.className='gp p-4 shadow-lg ai gift-card';
      div.style.animationDelay=(idx*0.05)+'s';
      div.innerHTML=`
        <div class="relative">
          <div class="img-wrap"><img src="${it.item_img}" alt="${it.item_name}"></div>
          <div class="absolute top-3 left-3 badge-hot">#${String(idx+1).padStart(3,'0')}</div>
          <div class="absolute top-3 right-3 price-tag">666 ⭐</div>
        </div>
        <h3 class="text-base font-bold text-white font-cyber tracking-wider">${it.item_name}</h3>
        <p class="text-[#36c9f6]/50 text-[10px] mt-0.5 mb-2 uppercase tracking-widest">BLACK ICE Collection</p>
        <div class="flex justify-between items-center mb-1"><span class="text-[10px] text-[#36c9f6]/60">REMAINING</span><span class="text-xs font-black font-cyber text-white">${it.remaining}</span></div>
        <div class="stock-bar"><div class="stock-fill" style="width:${pct}%"></div></div>
        <div class="grid grid-cols-2 gap-2 mt-3">
          <button ${soldOut?'disabled':''} onclick="app.bT(6.66,'${it.item_id}')" class="bt">💎 6.66 TON</button>
          <button ${soldOut?'disabled':''} onclick="app.bS('${it.item_id}',666)" class="bs">⭐ 666 STARS</button>
        </div>
        <p class="text-[9px] text-center text-[#36c9f6]/40 mt-2">Payments open soon — verification backend in progress</p>
      `;
      wrap.appendChild(div);
    });
  }

  // Purchases currently only create a pending reservation in the DB.
  // Real delivery requires the Phase-2 backend (Telegram bot webhook for
  // Stars, TON transaction verification for TON) which isn't live yet.
  async bT(am,itemId){
    this.h('medium');
    this.t.showPopup({title:'🔧 Coming soon',message:'TON payments will open once the verification backend is connected. No charge has been made.',buttons:[{id:'ok',text:'OK'}]});
  }
  async bS(itemId,stars){
    this.h('medium');
    this.t.showPopup({title:'🔧 Coming soon',message:'Star payments will open once the verification backend is connected. No charge has been made.',buttons:[{id:'ok',text:'OK'}]});
  }

  // ---------- daily ----------
  cD(){
    const dc=document.getElementById('dr'),cb=document.getElementById('cb');
    dc.classList.remove('hidden');
    const last=this.profile?.last_daily_claim;
    const today=new Date().toISOString().slice(0,10);
    if(last===today){cb.disabled=true;cb.innerText='CLAIMED';cb.className='bg-gray-600 text-gray-400 px-4 py-2 rounded-xl text-xs font-extrabold'}
    else{cb.disabled=false;cb.innerText='CLAIM +50';cb.className='bg-green-500 text-black px-4 py-2 rounded-xl text-xs font-extrabold'}
    document.getElementById('rd').innerText=(this.profile?.daily_streak||0)+1;
  }

  async cD2(){
    this.h('medium');
    const res=await this.db.claimDaily();
    if(!res||!res.ok)return;
    this.profile=await this.db.getProfile();
    this.a.pL();this.h('success');this.sC();
    this.cD();this.rU();
    this.ft(window.innerWidth/2,window.innerHeight/2,'+50','#36c9f6');
  }

  // ---------- gift reward (1M shards) ----------
  cG(){
    const sh=this.profile?.shards||0, claimed=this.profile?.gift_claims||0;
    const pending=Math.floor(sh/1000000)-claimed;
    const bar=document.getElementById('gp-bar'),txt=document.getElementById('gp-text'),btn=document.getElementById('gp-btn'),msg=document.getElementById('gp-msg');
    const prog=sh%1000000,pct=(prog/1000000)*100;
    bar.style.width=pct+'%';txt.innerText=prog.toLocaleString()+' / 1,000,000';
    if(pending>0){btn.classList.remove('hidden');btn.innerText='🎁 CLAIM REWARD ('+pending+')';msg.innerText='You earned '+pending+' BLACK ICE reward(s)!';msg.className='text-[10px] text-center text-[#fbbf24] font-bold mt-1 animate-pulse'}
    else{btn.classList.add('hidden');msg.innerText='Tap to reach 1M shards & win a BLACK ICE NFT';msg.className='text-[10px] text-center text-[#36c9f6]/60 mt-1'}
  }

  async clG(){
    const res=await this.db.claimGiftReward();
    if(!res||!res.ok){
      this.t.showPopup({title:'❌ Not yet',message:'Reach 1,000,000 shards (or all items are sold out) to claim.',buttons:[{id:'ok',text:'OK'}]});
      return;
    }
    this.profile=await this.db.getProfile();
    this.stock=await this.db.getStock();
    this.a.pL();this.h('success');this.sC();
    this.rU();this.rColl();this.cG();this.renderShop();
    this.t.showPopup({title:'🎉 BLACK ICE REWARD!',message:'You won: '+res.item_name+'! Added to your Collection.',buttons:[{id:'ok',text:'SICK!'}]});
  }

  // ---------- fx ----------
  ft(x,y,t,co){const el=document.createElement('div');el.className='af';el.style.left=x+'px';el.style.top=y+'px';el.style.color=co;el.innerText=t;document.body.appendChild(el);setTimeout(()=>el.remove(),1000)}
  sP(x,y){for(let i=0;i<8;i++){const p=document.createElement('div');p.className='pa';const s=4+Math.random()*6;p.style.width=s+'px';p.style.height=s+'px';p.style.left=x+'px';p.style.top=y+'px';const a=(Math.PI*2*i)/8+(Math.random()-0.5),v=60+Math.random()*80;p.style.transition='all .6s cubic-bezier(.25,.46,.45,.94)';document.body.appendChild(p);requestAnimationFrame(()=>{p.style.transform='translate('+Math.cos(a)*v+'px,'+Math.sin(a)*v+'px)scale(0)';p.style.opacity='0'});setTimeout(()=>p.remove(),600)}}
  sR(x,y){const r=document.createElement('div');r.style.cssText='position:absolute;border-radius:50%;border:2px solid rgba(54,201,246,.6);animation:ripple-expand .6s ease-out forwards;left:'+x+'px;top:'+y+'px;pointer-events:none';document.body.appendChild(r);setTimeout(()=>r.remove(),600)}
  sC(){const cols=['#36c9f6','#fff','#6ee7ff','#a5f3fc','#22d3ee','#fbbf24'];for(let i=0;i<25;i++){const c=document.createElement('div');c.className='cf';c.style.backgroundColor=cols[Math.floor(Math.random()*cols.length)];c.style.left=Math.random()*100+'vw';c.style.top='-10px';c.style.animation='c '+(1.5+Math.random()*2)+'s linear forwards';c.style.animationDelay=Math.random()*0.5+'s';c.style.borderRadius=Math.random()>0.5?'50%':'2px';c.style.width=(5+Math.random()*8)+'px';c.style.height=(5+Math.random()*8)+'px';document.body.appendChild(c);setTimeout(()=>c.remove(),4000)}}
  sLU(lv){const t=['ICE NOVICE','ICE APPRENTICE','ICE HUNTER','ICE WARRIOR','ICE LORD','ICE KING','ICE EMPEROR','ICE GOD'][Math.min(lv-1,7)]||'LEGEND';setTimeout(()=>{this.t.showPopup({title:'⚡ LVL '+lv+'!',message:'You are '+t+'!',buttons:[{id:'ok',text:'GO!'}]})},300)}

  // ---------- UI refresh ----------
  rU(){
    const p=this.profile||{};
    document.getElementById('sc').innerText=(p.shards||0).toLocaleString();
    document.getElementById('dn').innerText=(p.shards||0).toLocaleString();
    document.getElementById('ln').innerText=p.level||1;
    document.getElementById('tt').innerText=(p.taps_today||0).toLocaleString();
    document.getElementById('bst').innerText=p.best_streak||0;
    const streak=p.daily_streak||0,sbEl=document.getElementById('sb');
    if(streak>0){sbEl.classList.remove('hidden');sbEl.classList.add('flex');document.getElementById('sn').innerText=streak}
    else{sbEl.classList.add('hidden');sbEl.classList.remove('flex')}
  }

  async rColl(){
    const grid=document.getElementById('cl-grid');
    const inv=await this.db.getInventory();
    if(inv.length===0){grid.innerHTML='<p class="col-span-2 text-center text-[#36c9f6]/40 text-sm py-12">No items yet. Tap or buy to collect!</p>';return}
    grid.innerHTML='';
    inv.forEach((it,i)=>{
      const div=document.createElement('div');
      div.className='inv-card ai';
      div.style.animationDelay=(i*0.05)+'s';
      div.innerHTML=`<div class="inv-img"><img src="${it.item_img}" alt="${it.item_name}"></div><div class="p-3"><h4 class="text-xs font-bold text-white font-cyber">${it.item_name}</h4><p class="text-[10px] text-[#36c9f6]/50 mt-0.5">BLACK ICE</p></div>`;
      grid.appendChild(div);
    });
  }

  async rL(){
    const c=document.getElementById('ll'),rp=document.getElementById('rp');
    const board=await this.db.getLeaderboard();
    const myId=this.db.tid;
    c.innerHTML='';rp.innerHTML='';
    if(board.length===0){c.innerHTML='<p class="text-center text-[#36c9f6]/40 text-sm py-8">No players yet — be the first!</p>';return}
    const top3=board.slice(0,3),rest=board.slice(3);
    const mark=(e)=>e.telegram_id===myId?' <span class="text-[9px] bg-[#36c9f6]/20 px-1 rounded">YOU</span>':'';
    if(top3[1])rp.innerHTML+=`<div class="flex flex-col items-center"><div class="w-14 h-14 rounded-full border-2 border-gray-400 bg-gray-800 flex items-center justify-center text-xl rank-podium-2">🥈</div><p class="text-[10px] text-gray-400 font-bold mt-1">@${top3[1].username}${mark(top3[1])}</p><p class="text-xs text-[#36c9f6] font-black">${Number(top3[1].shards).toLocaleString()}</p></div>`;
    if(top3[0])rp.innerHTML+=`<div class="flex flex-col items-center -mt-4"><div class="w-16 h-16 rounded-full border-2 border-yellow-400 bg-gray-800 flex items-center justify-center text-2xl animate-pulse rank-podium-1">👑</div><p class="text-[10px] text-yellow-400 font-bold mt-1">@${top3[0].username}${mark(top3[0])}</p><p class="text-xs text-[#36c9f6] font-black">${Number(top3[0].shards).toLocaleString()}</p></div>`;
    if(top3[2])rp.innerHTML+=`<div class="flex flex-col items-center"><div class="w-14 h-14 rounded-full border-2 border-orange-600 bg-gray-800 flex items-center justify-center text-xl rank-podium-3">🥉</div><p class="text-[10px] text-orange-600 font-bold mt-1">@${top3[2].username}${mark(top3[2])}</p><p class="text-xs text-[#36c9f6] font-black">${Number(top3[2].shards).toLocaleString()}</p></div>`;
    rest.forEach((e,i)=>{
      const r=i+4,div=document.createElement('div'),isMe=e.telegram_id===myId;
      div.className='p-3 rounded-xl border flex justify-between items-center text-xs rank-row ai '+(isMe?'me':'bg-gray-900/60 border-[#36c9f6]/20');
      div.style.animationDelay=(i*0.05)+'s';
      div.innerHTML=`<div class="flex items-center gap-2"><span class="text-gray-500 w-4 inline-block text-center font-cyber">${r}</span><span class="font-bold ${isMe?'text-[#36c9f6]':'text-white'}">@${e.username}</span>${isMe?'<span class="text-[10px] bg-[#36c9f6]/20 px-1.5 py-0.5 rounded text-[#36c9f6]">YOU</span>':''}</div><span class="text-[#36c9f6] font-black font-cyber">${Number(e.shards).toLocaleString()}</span>`;
      c.appendChild(div);
    });
  }

  sw(tn){
    document.querySelectorAll('.tc').forEach(el=>{el.classList.remove('a');setTimeout(()=>{if(!el.classList.contains('a'))el.style.display='none'},300)});
    const t=document.getElementById('t-'+tn);
    t.style.display='block';t.offsetHeight;t.classList.add('a');
    document.querySelectorAll('.nb').forEach(el=>{el.classList.remove('a');el.classList.replace('text-white','text-[#36c9f6]/40')});
    const n=document.getElementById('n-'+tn);
    n.classList.add('a');n.classList.replace('text-[#36c9f6]/40','text-white');
    this.h('light');
    if(tn==='rank')this.rL();
    if(tn==='coll')this.rColl();
  }

  h(ty){
    if(this.t.HapticFeedback){
      if(ty==='light')this.t.HapticFeedback.impactOccurred('light');
      else if(ty==='medium')this.t.HapticFeedback.impactOccurred('medium');
      else if(ty==='success')this.t.HapticFeedback.notificationOccurred('success');
      else if(ty==='error')this.t.HapticFeedback.notificationOccurred('error');
    } else if(navigator.vibrate){
      if(ty==='error')navigator.vibrate([50,50,50]);else navigator.vibrate(15);
    }
  }
}

const app = new App();
    

/* ── AURORA BACKGROUND ── */
const cnv = document.getElementById('aurora');
const ctx = cnv.getContext('2d');
let W = window.innerWidth, H = window.innerHeight;
cnv.width = W; cnv.height = H;
function resize(){ W = cnv.width = window.innerWidth; H = cnv.height = window.innerHeight; }
window.addEventListener('resize', resize);

// Floating orbs configuration (blue/sky/amber only)
const ORBS = [
  { x:.2,  y:.3,  r:380, c:'59,130,246',  s:.00018, ox:0, oy:0, vx:.11, vy:.07 },
  { x:.75, y:.6,  r:320, c:'14,165,233',  s:.00022, ox:0, oy:0, vx:-.09, vy:.13 },
  { x:.5,  y:.85, r:260, c:'245,158,11',  s:.00015, ox:0, oy:0, vx:.07, vy:-.11 },
  { x:.85, y:.15, r:220, c:'59,130,246',  s:.00025, ox:0, oy:0, vx:-.13, vy:.09 },
  { x:.1,  y:.75, r:200, c:'14,165,233',  s:.00019, ox:0, oy:0, vx:.08, vy:-.08 },
];

/* ─── BUG FIX 1: initialise mx/my to screen centre so orbs don't snap to 0,0 ─── */
let t = 0;
let mx = 0.5, my = 0.5;          // normalised 0-1, starts at screen centre
let rawMX = W/2, rawMY = H/2;    // pixel coords for particle repulsion

window.addEventListener('mousemove', e => {
  rawMX = e.clientX;
  rawMY = e.clientY;
  mx = e.clientX / W;
  my = e.clientY / H;
});

/* ─── BUG FIX 2: declare PARTICLES *before* drawAurora is called ─── */
const PARTICLES = Array.from({length: 90}, () => ({
  x:  Math.random() * window.innerWidth,
  y:  Math.random() * window.innerHeight,
  vx: (Math.random() - 0.5) * 0.5,
  vy: (Math.random() - 0.5) * 0.5,
  r:  Math.random() * 1.8 + 0.4,
  a:  Math.random() * 0.45 + 0.1,
  c:  Math.random() < 0.55 ? '59,130,246' : Math.random() < 0.5 ? '14,165,233' : '245,158,11',
}));

function drawAurora(){
  ctx.clearRect(0,0,W,H);

  /* dark base */
  ctx.fillStyle = '#080c12';
  ctx.fillRect(0,0,W,H);

  /* subtle grid dots */
  ctx.fillStyle = 'rgba(59,130,246,0.04)';
  const gs = 52;
  for(let x=0; x<W; x+=gs) for(let y=0; y<H; y+=gs){
    ctx.beginPath(); ctx.arc(x,y,1,0,Math.PI*2); ctx.fill();
  }

  /* ── aurora orbs — BUG FIX 3: much stronger mouse attraction (0.045) ── */
  t += 0.007;
  ORBS.forEach(o => {
    /* anti-gravity: orb is attracted toward mouse position */
    const targetX = mx;
    const targetY = my;
    /* each orb moves at its own speed toward where the mouse is,
       plus a slow sine-wave drift for organic feel */
    o.ox += (targetX - (o.x + o.ox)) * 0.045   /* mouse pull  — was 0.0015, 30× stronger */
           + Math.sin(t + o.vx * 8) * 0.0006;   /* drift */
    o.oy += (targetY - (o.y + o.oy)) * 0.045
           + Math.cos(t + o.vy * 8) * 0.0006;

    const cx = (o.x + o.ox) * W;
    const cy = (o.y + o.oy) * H;
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
    g.addColorStop(0,   `rgba(${o.c}, 0.14)`);
    g.addColorStop(0.45,`rgba(${o.c}, 0.05)`);
    g.addColorStop(1,   `rgba(${o.c}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, o.r, 0, Math.PI*2); ctx.fill();
  });

  /* ── particles ── */
  PARTICLES.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if(p.x < 0) p.x = W; if(p.x > W) p.x = 0;
    if(p.y < 0) p.y = H; if(p.y > H) p.y = 0;

    /* repel from mouse — use raw pixel coords, bigger radius (160px) */
    const dx = p.x - rawMX;
    const dy = p.y - rawMY;
    const dd = Math.sqrt(dx*dx + dy*dy);
    if(dd < 160 && dd > 0){
      const force = (160 - dd) / 160;          /* stronger when closer */
      p.vx += (dx / dd) * force * 0.18;
      p.vy += (dy / dd) * force * 0.18;
    }
    /* speed cap + damping */
    const sp = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
    if(sp > 2.5){ p.vx *= 0.92; p.vy *= 0.92; }
    /* gentle return-to-base friction */
    p.vx *= 0.99; p.vy *= 0.99;

    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${p.c}, ${p.a})`; ctx.fill();
  });

  /* ── connect nearby particles ── */
  for(let i=0; i<PARTICLES.length; i++){
    for(let j=i+1; j<PARTICLES.length; j++){
      const dx = PARTICLES[i].x - PARTICLES[j].x;
      const dy = PARTICLES[i].y - PARTICLES[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if(d < 140){
        ctx.beginPath();
        ctx.moveTo(PARTICLES[i].x, PARTICLES[i].y);
        ctx.lineTo(PARTICLES[j].x, PARTICLES[j].y);
        ctx.strokeStyle = `rgba(59,130,246,${0.1 * (1 - d/140)})`;
        ctx.lineWidth = 0.7; ctx.stroke();
      }
    }
  }

  /* ── large mouse-glow spotlight on canvas ── */
  const mg = ctx.createRadialGradient(rawMX, rawMY, 0, rawMX, rawMY, 280);
  mg.addColorStop(0,   'rgba(59,130,246,0.07)');
  mg.addColorStop(0.5, 'rgba(59,130,246,0.02)');
  mg.addColorStop(1,   'rgba(59,130,246,0)');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(rawMX, rawMY, 280, 0, Math.PI*2); ctx.fill();

  requestAnimationFrame(drawAurora);
}

drawAurora();

/* ── CURSOR ── */
const core=document.getElementById('c-core');
const ring=document.getElementById('c-ring');
const aura=document.getElementById('c-aura');
let CX=0,CY=0,RX=0,RY=0,AX=0,AY=0;
document.addEventListener('mousemove',e=>{
  CX=e.clientX;CY=e.clientY;
  core.style.left=CX+'px';core.style.top=CY+'px';
});
(function animCursor(){
  RX+=(CX-RX)*.14; RY+=(CY-RY)*.14;
  ring.style.left=RX+'px'; ring.style.top=RY+'px';
  AX+=(CX-AX)*.06; AY+=(CY-AY)*.06;
  aura.style.left=AX+'px'; aura.style.top=AY+'px';
  requestAnimationFrame(animCursor);
})();

// Ripple on click
document.addEventListener('click', e=>{
  const d=document.createElement('div');
  d.className='ripple-dot';
  d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),700);
});

document.querySelectorAll('a,button,.sk-tag,.pr-card,.st-card,.cr-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));
});
document.addEventListener('mousedown',()=>document.body.classList.add('click'));
document.addEventListener('mouseup',()=>document.body.classList.remove('click'));

/* ── TYPEWRITER ── */
const phrases=["AI Engineer","Data Scientist","Full-Stack Dev","ML Builder","AWS Cloud Dev","Problem Solver"];
let pi=0,ci=0,del=false;
const twEl=document.getElementById('tw');
function type(){
  const w=phrases[pi];
  if(!del){twEl.textContent=w.slice(0,++ci);if(ci===w.length){del=true;setTimeout(type,1900);return;}}
  else{twEl.textContent=w.slice(0,--ci);if(ci===0){del=false;pi=(pi+1)%phrases.length;}}
  setTimeout(type,del?55:90);
}
type();

/* ── NAV ── */
const nav=document.getElementById('nav');
const spb=document.getElementById('spb');
window.addEventListener('scroll',()=>{
  nav.classList.toggle('sc',scrollY>60);
  spb.style.width=(scrollY/(document.body.scrollHeight-innerHeight)*100)+'%';
});

/* ── SCROLL REVEAL ── */
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('on'); });
},{threshold:.1});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

/* ── COUNTER ── */
const cio=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting)return;
    const el=e.target, tgt=+el.dataset.count;
    let n=0,inc=tgt/42;
    const t=setInterval(()=>{
      n+=inc; if(n>=tgt){el.textContent=tgt+'+';clearInterval(t);return;}
      el.textContent=Math.floor(n);
    },28);
    cio.unobserve(el);
  });
},{threshold:.5});
document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

/* ── PROJECT SPOTLIGHT ── */
document.querySelectorAll('.pr-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    card.style.setProperty('--mx',(e.clientX-r.left)+'px');
    card.style.setProperty('--my',(e.clientY-r.top)+'px');
  });
});

/* ── FORM ── */
function submitForm(btn){
  const orig=btn.innerHTML;
  btn.innerHTML='<i class="fas fa-check"></i> Sent!';
  btn.style.background='#22c55e';btn.style.color='#fff';
  setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';btn.style.color='';},2800);
}

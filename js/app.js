import { createStore, isEmail } from './store.js';
import { CATEGORIES, catById, inferCategory, normalize, SEARCH_EXAMPLES, QUICK_CLIENT, QUICK_BUSINESS } from './data.js';

// ───────────────────────── utilidades ─────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n = '') => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '·';
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const fmtDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const _fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtLong = { format: (d) => { const t = _fmtLong.format(d); return t[0].toUpperCase() + t.slice(1); } };
const fmtShort = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'short' });
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtWhen = (iso) => { const d = new Date(iso); return `${fmtShort.format(d)} · ${hhmm(d)}`; };
const sameDay = (a, b) => a.toDateString() === b.toDateString();
function relTime(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return hhmm(d);
  if (sameDay(d, y)) return 'Ayer';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

const I = {
  search: '<svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chat: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>',
  cal: '<svg class="ic" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  home: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  compass: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  phone: '<svg class="ic" viewBox="0 0 24 24"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  mail: '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
  wa: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/></svg>',
  user: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
  store: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 9 5.5 4h13L20 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9h16M9 20v-6h6v6"/></svg>',
  plus: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg class="ic" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  heart: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>',
  logout: '<svg class="ic" viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/></svg>',
  moon: '<svg class="ic" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
  pin: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  edit: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  download: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
};

// ───────────────────────── estado ─────────────────────────
let store, me = null;
const cache = { businesses: [], favs: new Set(), appts: [] };
const app = $('#app');
let currentRoute = '';
let chatState = { convId: null };

const toast = (msg, ms = 2800) => {
  const el = document.createElement('div'); el.className = 'toast glass'; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
};
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
const stars = (r = 0) => { const n = Math.round(r); return `<span class="stars" aria-label="${r.toFixed(1)} de 5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`; };

function isOpenNow(hours) {
  const now = new Date(); const ranges = (hours || {})[now.getDay()] || [];
  const m = now.getHours() * 60 + now.getMinutes();
  return ranges.some(([s, e]) => {
    const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
    let a = sh * 60 + sm, b = eh * 60 + em; if (b <= a) b += 1440;
    return m >= a && m < b;
  });
}
const openPill = (b) => (isOpenNow(b.hours) ? '<span class="pill open">Abierto</span>' : '<span class="pill closed">Cerrado</span>');

async function refreshBusinesses() { cache.businesses = await store.listBusinesses(); }
async function refreshFavs() { cache.favs = new Set(me ? await store.favorites() : []); }

// ───────────────────────── sheet / menús ─────────────────────────
function openSheet(html, onMount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="backdrop"><div class="sheet glass" role="dialog" aria-modal="true">${html}</div></div>`;
  const bd = root.firstElementChild;
  const close = () => { bd.classList.add('out'); setTimeout(() => (root.innerHTML = ''), 280); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('[data-close]')) close(); });
  onMount?.(bd.firstElementChild, close);
  setTimeout(() => bd.querySelector('input, textarea')?.focus(), 80);
  return close;
}

function openMenu(anchor) {
  closeMenu();
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'menu glass'; el.id = 'menu';
  el.style.top = r.bottom + 10 + 'px'; el.style.right = Math.max(12, innerWidth - r.right) + 'px';
  el.innerHTML = `
    <div class="row" style="padding:10px 12px 12px"><div class="avatar">${esc(initials(me.name))}</div>
      <div class="grow"><b style="display:block;font-size:15px">${esc(me.name)}</b><span class="subtle">${me.role === 'empresa' ? 'Cuenta de empresa' : 'Cuenta de cliente'}</span></div></div>
    <div class="menu-sep"></div>
    ${me.role === 'empresa' ? `<a class="menu-item" href="#/panel">${I.store} Panel de empresa</a>` : `<a class="menu-item" href="#/favoritos">${I.heart} Favoritos</a>`}
    <button class="menu-item" data-act="profile">${I.edit} Editar perfil</button>
    <button class="menu-item" data-act="theme">${I.moon} Tema: ${themeLabel()}</button>
    <div class="menu-sep"></div>
    <button class="menu-item danger" data-act="logout" style="color:var(--bad)">${I.logout} Cerrar sesión</button>`;
  document.body.appendChild(el);
  el.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'logout') { await store.signOut(); me = null; closeMenu(); toast('Sesión cerrada'); go('#/'); }
    if (a === 'theme') { cycleTheme(); e.target.closest('[data-act]').innerHTML = `${I.moon} Tema: ${themeLabel()}`; return; }
    if (a === 'profile') { closeMenu(); editProfile(); }
    if (e.target.closest('a')) closeMenu();
  });
  setTimeout(() => document.addEventListener('click', outside), 0);
  function outside(e) { if (!el.contains(e.target)) { closeMenu(); document.removeEventListener('click', outside); } }
}
const closeMenu = () => $('#menu')?.remove();

function editProfile() {
  openSheet(`
    <h2 class="title-md">Tu perfil</h2><p class="subtle" style="margin:4px 0 18px">${esc(me.email)}</p>
    <form class="stack" id="pf">
      <label class="field"><span>Nombre</span><input class="input" name="name" value="${esc(me.name)}" required></label>
      <label class="field"><span>Teléfono</span><input class="input" name="phone" type="tel" value="${esc(me.phone || '')}"></label>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">Guardar</button></div>
    </form>`, (el, close) => {
    $('#pf', el).addEventListener('submit', async (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      me = await store.updateProfile({ name: f.get('name').trim(), phone: f.get('phone').trim() });
      close(); toast('Perfil actualizado'); renderNav();
    });
  });
}

// ───────────────────────── tema ─────────────────────────
const getTheme = () => { try { return localStorage.getItem('cyv_theme') || 'auto'; } catch { return 'auto'; } };
const themeLabel = () => ({ auto: 'Automático', light: 'Claro', dark: 'Oscuro' }[getTheme()]);
function applyTheme() { const t = getTheme(); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
function cycleTheme() { const n = { auto: 'light', light: 'dark', dark: 'auto' }[getTheme()]; try { localStorage.setItem('cyv_theme', n); } catch {} applyTheme(); }

// ───────────────────────── navegación ─────────────────────────
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
}

let unread = 0, pendingAppts = 0;
async function updateCounters() {
  if (!me) { unread = 0; pendingAppts = 0; } else {
    const convs = await store.listConversations();
    unread = convs.filter((c) => c.unread).length;
    cache.appts = await store.listAppointments();
    pendingAppts = cache.appts.filter((a) => a.status === 'pendiente' && (me.role === 'empresa' || false) && new Date(a.starts_at) > new Date()).length;
  }
  $$('[data-badge="chat"]').forEach((b) => { b.textContent = unread || ''; b.dataset.n = unread; });
  $$('[data-badge="appt"]').forEach((b) => { b.textContent = pendingAppts || ''; b.dataset.n = pendingAppts; });
}

function renderNav() {
  const sec = parseHash().parts[0] || '';
  const links = [
    ['explorar', 'Explorar'],
    ['mensajes', 'Mensajes', 'chat'],
    ['citas', 'Citas', 'appt'],
    ...(me?.role === 'empresa' ? [['panel', 'Mi empresa']] : []),
  ];
  $('#navLinks').innerHTML = links.map(([k, t, b]) => `<a class="nav-link ${sec === k ? 'active' : ''}" href="#/${k}">${t}${b ? `<span class="badge" data-badge="${b}"></span>` : ''}</a>`).join('');
  $('#navRight').innerHTML = me
    ? `<button class="avatar-btn" id="avatarBtn" aria-label="Menú de cuenta"><span class="avatar">${esc(initials(me.name))}</span></button>`
    : `<a class="btn ghost sm" href="#/entrar">Entrar</a><a class="btn primary sm" href="#/registro">Crear cuenta</a>`;
  $('#avatarBtn')?.addEventListener('click', (e) => { e.stopPropagation(); $('#menu') ? closeMenu() : openMenu(e.currentTarget); });

  const tabs = [
    ['', 'Inicio', I.home],
    ['explorar', 'Explorar', I.compass],
    ['mensajes', 'Mensajes', I.chat, 'chat'],
    ['citas', 'Citas', I.cal, 'appt'],
    me ? (me.role === 'empresa' ? ['panel', 'Empresa', I.store] : ['favoritos', 'Favoritos', I.heart]) : ['entrar', 'Entrar', I.user],
  ];
  $('#tabbar').innerHTML = tabs.map(([k, t, ic, b]) => `<a class="tab ${sec === k ? 'active' : ''}" href="#/${k}">${ic}<span>${t}</span>${b ? `<span class="badge" data-badge="${b}"></span>` : ''}</a>`).join('');
  updateCounters();
}

const needsAuth = (next) => { if (me) return false; go(`#/entrar?next=${encodeURIComponent(next)}`); return true; };

async function route() {
  closeMenu();
  const { parts, params } = parseHash();
  const key = parts[0] || '';
  const prev = currentRoute; currentRoute = location.hash;
  renderNav();
  if (key !== 'mensajes') chatState.convId = null;
  const views = { '': viewHome, explorar: viewExplore, empresa: viewBusiness, mensajes: viewChats, citas: viewAppointments, panel: viewPanel, entrar: viewLogin, registro: viewRegister, favoritos: viewFavorites };
  const v = views[key] || viewHome;
  // Navegación dentro de mensajes: no repintar toda la vista
  if (key === 'mensajes' && prev.startsWith('#/mensajes') && $('.chat-shell')) { return openThread(parts[1] || null); }
  await v(parts, params);
  if (!(key === 'explorar' && prev.startsWith('#/explorar'))) window.scrollTo({ top: 0, behavior: 'instant' });
  observeReveals();
}

function mount(html) {
  app.innerHTML = `<div class="view">${html}</div>`;
}

// Animaciones de aparición al hacer scroll
const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
function observeReveals() {
  $$('.reveal:not(.in)').forEach((el) => {
    const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
    el.style.setProperty('--d', `${Math.min(sib.indexOf(el), 10) * 55}ms`);
    io.observe(el);
  });
}

// Reflejo líquido que sigue al puntero
document.addEventListener('pointermove', (e) => {
  const el = e.target.closest?.('.liquid'); if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

// Segmented control con "thumb" animado
function segmented(id, options, value) {
  return `<div class="segmented" id="${id}" role="tablist">${options.map(([v, t]) => `<button type="button" role="tab" data-v="${v}" class="${v === value ? 'on' : ''}">${t}</button>`).join('')}<span class="thumb"></span></div>`;
}
function bindSegmented(el, onChange) {
  const place = () => {
    const on = $('button.on', el) || $('button', el);
    const t = $('.thumb', el); t.style.width = on.offsetWidth + 'px'; t.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  };
  requestAnimationFrame(place);
  new ResizeObserver(place).observe(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', el).forEach((x) => x.classList.toggle('on', x === b)); place(); onChange?.(b.dataset.v);
  });
}

// ───────────────────────── tarjetas ─────────────────────────
function bizCard(b) {
  const c = catById(b.category);
  return `<a class="biz-card glass liquid reveal" href="#/empresa/${b.id}">
    <div class="biz-icon" style="--tint:${c.color}">${c.emoji}</div>
    <div class="biz-body">
      <div class="biz-top"><h3>${esc(b.name)}</h3>${openPill(b)}</div>
      <p class="muted">${esc(c.name)}${b.city ? ' · ' + esc(b.city) : ''}</p>
      <p class="biz-desc">${esc(b.description || 'Sin descripción todavía.')}</p>
      <div class="biz-meta">${b.rating_count ? `${stars(+b.rating_avg)} ${(+b.rating_avg).toFixed(1)} · ${b.rating_count} reseña${b.rating_count > 1 ? 's' : ''}` : '<span>✨ Nuevo en la plataforma</span>'}${cache.favs.has(b.id) ? ' · ❤️' : ''}</div>
    </div></a>`;
}

// ───────────────────────── INICIO ─────────────────────────
async function viewHome() {
  const top = [...cache.businesses].sort((a, b) => b.rating_avg * Math.log(2 + b.rating_count) - a.rating_avg * Math.log(2 + a.rating_count)).slice(0, 6);
  const count = (id) => cache.businesses.filter((b) => b.category === id).length;
  mount(`
    ${store.mode === 'local' ? `<div class="banner glass reveal">🌿 <span><b>Modo demo.</b> Tus chats y citas se guardan en este navegador. Conecta Supabase (ver README) para sincronizarlos entre dispositivos.</span></div>` : ''}
    <section class="hero">
      <div class="eyebrow reveal"><i></i> Pregunta o pide cita en segundos</div>
      <h1 class="title-xl reveal">Lo que necesitas,<br><span class="gradient-text">a un mensaje.</span></h1>
      <p class="lead reveal">Encuentra negocios de confianza, escríbeles por chat con tu teléfono o email y agenda tu visita sin llamadas ni esperas.</p>
      <form class="searchbar glass liquid reveal" id="heroSearch" role="search">
        ${I.search}<input id="heroQ" aria-label="¿Qué necesitas?" placeholder="${esc(SEARCH_EXAMPLES[0])}" autocomplete="off">
        <button class="btn primary">Buscar</button>
      </form>
      <div class="hint reveal">Describe tu necesidad con tus palabras — <button type="button" id="tryEx">probar un ejemplo</button></div>
    </section>

    <section class="section">
      <div class="section-head reveal"><h2 class="title-lg">Categorías</h2><a class="btn ghost sm" href="#/explorar">Ver todo</a></div>
      <div class="cat-grid">
        ${CATEGORIES.filter((c) => c.id !== 'otros').map((c) => `<a class="cat glass liquid reveal" href="#/explorar?cat=${c.id}"><span class="cat-emoji" style="--tint:${c.color}">${c.emoji}</span><b>${c.name}</b><small>${count(c.id)} negocio${count(c.id) === 1 ? '' : 's'}</small></a>`).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-head reveal"><h2 class="title-lg">Mejor valorados</h2><a class="btn ghost sm" href="#/explorar?sort=rating">Ver más</a></div>
      <div class="grid grid-3">${top.map(bizCard).join('')}</div>
    </section>

    <section class="section">
      <div class="section-head reveal"><h2 class="title-lg">Así de sencillo</h2></div>
      <div class="steps">
        <div class="step glass reveal"><div class="num">1</div><h3>Busca por necesidad</h3><p class="muted">Escribe “mi perro necesita una vacuna” y te mostramos veterinarios.</p></div>
        <div class="step glass reveal"><div class="num">2</div><h3>Chatea al instante</h3><p class="muted">Pregunta lo que quieras. Tus chats se guardan en tu cuenta.</p></div>
        <div class="step glass reveal"><div class="num">3</div><h3>Reserva tu visita</h3><p class="muted">Elige día y hora libres. La empresa la confirma y te avisamos en el chat.</p></div>
      </div>
    </section>

    ${!me ? `<section class="section"><div class="glass card reveal" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:28px">
      <div class="grow"><h2 class="title-md">¿Tienes un negocio?</h2><p class="muted" style="margin:6px 0 0">Recibe consultas y citas en un solo lugar. Gratis.</p></div>
      <a class="btn primary" href="#/registro?rol=empresa">Registrar mi empresa</a></div></section>` : ''}
    <footer class="footer">Consultas &amp; Visitas · Hecho con calma 🌿</footer>`);

  const input = $('#heroQ');
  let i = 0;
  const timer = setInterval(() => {
    if (!document.body.contains(input)) return clearInterval(timer);
    if (document.activeElement !== input) input.placeholder = SEARCH_EXAMPLES[(++i) % SEARCH_EXAMPLES.length];
  }, 3200);
  $('#heroSearch').addEventListener('submit', (e) => { e.preventDefault(); go(`#/explorar?q=${encodeURIComponent(input.value.trim())}`); });
  $('#tryEx').addEventListener('click', () => go(`#/explorar?q=${encodeURIComponent(input.placeholder)}`));
}

// ───────────────────────── EXPLORAR ─────────────────────────
function searchBusinesses({ q = '', cat = '', city = '', sort = 'rel' }) {
  const nq = normalize(q);
  const STOP = new Set(['una', 'uno', 'unos', 'para', 'con', 'que', 'por', 'los', 'las', 'del', 'mis', 'necesito', 'necesita', 'quiero', 'tengo', 'busco', 'esta', 'este', 'muy', 'hoy', 'manana', 'donde', 'como', 'algo', 'alguien', 'duele', 'mucho']);
  const tokens = nq.split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t));
  const inferred = !cat && nq ? inferCategory(q) : null;
  let list = cache.businesses.map((b) => {
    let s = 1;
    if (nq) {
      s = 0;
      const name = normalize(b.name), cityN = normalize(b.city);
      const hay = normalize([b.description, b.tags, (b.services || []).map((x) => x.name).join(' '), catById(b.category).name, b.address].join(' '));
      if (name.includes(nq)) s += 12;
      for (const t of tokens) { if (name.includes(t)) s += 4; if (hay.includes(t)) s += 2; if (cityN.includes(t)) s += 3; }
      if (inferred && b.category === inferred) s += 8;
    }
    return { b, s };
  }).filter((x) => x.s > 0);
  if (cat) list = list.filter((x) => x.b.category === cat);
  if (city) list = list.filter((x) => x.b.city === city);
  const byRating = (a, b) => b.b.rating_avg - a.b.rating_avg || b.b.rating_count - a.b.rating_count;
  if (sort === 'rating') list.sort(byRating);
  else if (sort === 'az') list.sort((a, b) => a.b.name.localeCompare(b.b.name, 'es'));
  else if (sort === 'open') list.sort((a, b) => isOpenNow(b.b.hours) - isOpenNow(a.b.hours) || b.s - a.s);
  else list.sort((a, b) => b.s - a.s || byRating(a, b));
  return { list: list.map((x) => x.b), inferred };
}

async function viewExplore(_, params) {
  const st = { q: params.get('q') || '', cat: params.get('cat') || '', city: params.get('city') || '', sort: params.get('sort') || 'rel' };
  const cities = [...new Set(cache.businesses.map((b) => b.city).filter(Boolean))].sort();
  mount(`
    <div class="explore-head">
      <h1 class="title-lg reveal">Explorar</h1>
      <div class="toolbar reveal">
        <form class="searchbar glass liquid" id="exForm" role="search">${I.search}<input id="exQ" value="${esc(st.q)}" placeholder="¿Qué necesitas? Ej: me duele la espalda" autocomplete="off"></form>
        <select class="input" id="exCity" style="width:auto;min-width:170px"><option value="">Todas las ciudades</option>${cities.map((c) => `<option ${c === st.city ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        ${segmented('exSort', [['rel', 'Relevancia'], ['rating', 'Valoración'], ['open', 'Abiertos'], ['az', 'A–Z']], st.sort)}
      </div>
      <div class="chips reveal" id="exCats">
        <button class="chip ${!st.cat ? 'on' : ''}" data-cat="">Todas</button>
        ${CATEGORIES.map((c) => `<button class="chip ${st.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join('')}
      </div>
    </div>
    <div id="exNeed"></div>
    <div class="grid grid-3" id="exResults" style="margin-top:8px"></div>`);

  const draw = () => {
    const { list, inferred } = searchBusinesses(st);
    const c = inferred && catById(inferred);
    $('#exNeed').innerHTML = c ? `<div class="need-pill" style="margin-bottom:14px">${c.emoji} Parece que buscas: <b>${c.name}</b> <button class="btn ghost sm" id="needOnly" style="height:26px">Ver solo ${c.name.toLowerCase()}</button></div>` : '';
    $('#needOnly')?.addEventListener('click', () => { st.cat = inferred; st.q = ''; $('#exQ').value = ''; syncChips(); sync(); draw(); });
    $('#exResults').innerHTML = list.length ? list.map(bizCard).join('') : `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div><h3 class="title-md">Sin resultados</h3><p>Prueba con otras palabras o quita filtros.</p></div>`;
    observeReveals();
  };
  const sync = () => {
    const p = new URLSearchParams(); Object.entries(st).forEach(([k, v]) => v && !(k === 'sort' && v === 'rel') && p.set(k, v));
    const h = `#/explorar${p.toString() ? '?' + p : ''}`; history.replaceState(null, '', h); currentRoute = h;
  };
  const syncChips = () => $$('#exCats .chip').forEach((x) => x.classList.toggle('on', x.dataset.cat === st.cat));
  $('#exQ').addEventListener('input', debounce((e) => { st.q = e.target.value; sync(); draw(); }, 180));
  $('#exForm').addEventListener('submit', (e) => { e.preventDefault(); $('#exQ').blur(); });
  $('#exCity').addEventListener('change', (e) => { st.city = e.target.value; sync(); draw(); });
  bindSegmented($('#exSort'), (v) => { st.sort = v; sync(); draw(); });
  $('#exCats').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; st.cat = b.dataset.cat; syncChips(); sync(); draw(); });
  draw();
}

// ───────────────────────── FAVORITOS ─────────────────────────
async function viewFavorites() {
  if (needsAuth('#/favoritos')) return;
  await refreshFavs();
  const list = cache.businesses.filter((b) => cache.favs.has(b.id));
  mount(`<h1 class="title-lg reveal" style="margin-bottom:20px">Favoritos</h1>
    <div class="grid grid-3">${list.length ? list.map(bizCard).join('') : `<div class="empty glass" style="grid-column:1/-1"><div class="big">🤍</div><h3 class="title-md">Aún no tienes favoritos</h3><p>Pulsa el corazón en cualquier negocio para guardarlo aquí.</p><a class="btn primary" href="#/explorar" style="margin-top:12px">Explorar</a></div>`}</div>`);
}

// ───────────────────────── EMPRESA ─────────────────────────
function slotsFor(b, date) {
  const ranges = (b.hours || {})[date.getDay()] || [];
  const step = +b.slot_minutes || 30; const out = [];
  for (const [s, e] of ranges) {
    const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
    const start = sh * 60 + sm; let end = eh * 60 + em; if (end <= start) end += 1440;
    for (let m = start; m + step <= end; m += step) { const d = new Date(date); d.setHours(0, 0, 0, 0); d.setMinutes(m); out.push(d); }
  }
  return out;
}

async function startChatWith(businessId) {
  if (needsAuth(`#/empresa/${businessId}`)) return;
  if (me.role === 'empresa') return toast('Las empresas inician chats con clientes desde Mensajes → Nuevo chat');
  const id = await store.openConversation({ businessId, clientId: me.id });
  go(`#/mensajes/${id}`);
}

async function viewBusiness(parts) {
  const b = await store.getBusiness(parts[1]);
  if (!b) return mount(`<div class="empty"><div class="big">🫥</div><h2 class="title-md">Empresa no encontrada</h2><a class="btn" href="#/explorar" style="margin-top:12px">Volver a explorar</a></div>`);
  await refreshFavs();
  const reviews = await store.listReviews(b.id);
  const c = catById(b.category);
  const isOwner = me && me.id === b.owner_id;
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const digits = (b.phone || '').replace(/\D/g, '');
  const days = [];
  for (let i = 0; i < 21 && days.length < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); if (((b.hours || {})[d.getDay()] || []).length) days.push(d); }
  const myReview = me && reviews.find((r) => r.client_id === me.id);

  mount(`
    <a class="btn ghost sm reveal" href="javascript:history.back()" style="margin-bottom:12px">${I.back} Volver</a>
    <section class="biz-hero glass liquid reveal">
      <div class="biz-icon xl" style="--tint:${c.color}">${c.emoji}</div>
      <div class="grow">
        <div class="row wrap" style="gap:8px"><span class="pill closed" style="background:var(--accent-soft);color:var(--accent)">${c.name}</span>${openPill(b)}</div>
        <h1 style="margin-top:10px">${esc(b.name)}</h1>
        <p class="muted" style="margin:6px 0 0">${I.pin.replace('class="ic"', 'class="ic" style="vertical-align:-3px;width:16px"')} ${esc([b.address, b.city].filter(Boolean).join(', ') || 'Ubicación no indicada')}
          · ${b.rating_count ? `${stars(+b.rating_avg)} ${(+b.rating_avg).toFixed(1)} (${b.rating_count})` : 'Sin reseñas aún'}</p>
        <div class="actions">
          ${isOwner ? `<a class="btn primary" href="#/panel">${I.edit} Editar mi empresa</a>` : `
          <button class="btn primary" id="bChat">${I.chat} Enviar mensaje</button>
          <a class="btn" href="#reserva" id="bBook">${I.cal} Pedir cita</a>`}
          ${b.phone ? `<a class="btn" href="tel:${esc(b.phone)}">${I.phone} Llamar</a><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${digits}">${I.wa} WhatsApp</a>` : ''}
          ${b.email ? `<a class="btn" href="mailto:${esc(b.email)}">${I.mail} Email</a>` : ''}
          ${!isOwner && me?.role !== 'empresa' ? `<button class="btn icon" id="bFav" aria-label="Favorito" title="Guardar en favoritos">${cache.favs.has(b.id) ? '❤️' : '🤍'}</button>` : ''}
        </div>
      </div>
    </section>

    <div class="two-col">
      <div class="stack">
        <section class="glass card reveal"><h2 class="title-md">Sobre nosotros</h2><p class="muted" style="margin:10px 0 0;white-space:pre-wrap">${esc(b.description || 'Esta empresa aún no ha añadido una descripción.')}</p></section>

        ${isOwner ? '' : `<section class="glass card reveal" id="reserva">
          <h2 class="title-md">Reserva tu visita</h2>
          <p class="subtle" style="margin:4px 0 16px">Elige día y hora. ${esc(b.name)} confirmará la cita por el chat.</p>
          ${days.length ? `
          <div class="days" id="days">${days.map((d, i) => `<button class="day ${i === 0 ? 'on' : ''}" data-i="${i}"><small>${fmtDay.format(d)}</small><b>${d.getDate()}</b><small>${fmtMonth.format(d)}</small></button>`).join('')}</div>
          <div class="slots" id="slots"></div>
          <div class="form-grid" style="margin-top:16px">
            ${(b.services || []).length ? `<label class="field"><span>Servicio</span><select class="input" id="svc">${b.services.map((s) => `<option>${esc(s.name)}</option>`).join('')}</select></label>` : ''}
            <label class="field"><span>Nota (opcional)</span><input class="input" id="note" placeholder="Ej: es para mi gata Luna"></label>
          </div>
          <button class="btn primary" id="confirm" style="margin-top:16px;width:100%" disabled>Selecciona una hora</button>` : '<p class="muted">Esta empresa no tiene horario disponible para reservas.</p>'}
        </section>`}

        <section class="glass card reveal">
          <div class="row" style="justify-content:space-between"><h2 class="title-md">Reseñas</h2>${b.rating_count ? `<span class="muted">${(+b.rating_avg).toFixed(1)} ${stars(+b.rating_avg)}</span>` : ''}</div>
          ${me?.role === 'cliente' ? `
            <form id="revForm" class="stack" style="margin:14px 0 6px;padding:14px;border-radius:16px;background:var(--hairline)">
              <div class="row" style="justify-content:space-between"><b style="font-size:15px">${myReview ? 'Editar tu reseña' : 'Deja tu reseña'}</b>
              <div class="star-input" id="starIn">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" class="${n <= (myReview?.rating || 0) ? 'on' : ''}" aria-label="${n} estrellas">★</button>`).join('')}</div></div>
              <textarea class="input" name="comment" placeholder="¿Qué tal la experiencia?" style="min-height:70px">${esc(myReview?.comment || '')}</textarea>
              <div class="row" style="justify-content:flex-end"><button class="btn primary sm">Publicar</button></div>
            </form>` : ''}
          <div>${reviews.length ? reviews.map((r) => `<div class="review"><div class="row" style="justify-content:space-between"><b style="font-size:15px">${esc(r.author_name || 'Cliente')}</b><span class="subtle">${fmtShort.format(new Date(r.created_at))}</span></div>${stars(r.rating)}<p class="muted" style="margin:4px 0 0">${esc(r.comment)}</p></div>`).join('') : '<p class="muted">Todavía no hay reseñas. ¡Sé el primero!</p>'}</div>
        </section>
      </div>

      <div class="stack">
        ${(b.services || []).length ? `<section class="glass card reveal"><h2 class="title-md">Servicios</h2><div style="margin-top:8px">${b.services.map((s) => `<div class="svc"><span>${esc(s.name)}</span><b>${esc(s.price || '')}</b></div>`).join('')}</div></section>` : ''}
        <section class="glass card reveal"><h2 class="title-md">Horario</h2><div style="margin-top:8px">
          ${order.map((d) => { const r = (b.hours || {})[d] || []; return `<div class="hours-row ${d === today ? 'today' : ''}"><span>${DAYS[d]}</span><span>${r.length ? r.map(([s, e]) => `${s}–${e}`).join(', ') : 'Cerrado'}</span></div>`; }).join('')}
        </div></section>
        <section class="glass card reveal"><h2 class="title-md">Contacto</h2>
          <div class="stack" style="margin-top:12px;gap:10px">
            ${b.phone ? `<a class="row" href="tel:${esc(b.phone)}">${I.phone}<span>${esc(b.phone)}</span></a>` : ''}
            ${b.email ? `<a class="row" href="mailto:${esc(b.email)}">${I.mail}<span>${esc(b.email)}</span></a>` : ''}
            ${b.address ? `<a class="row" target="_blank" rel="noopener" href="https://maps.google.com/?q=${encodeURIComponent(b.address + ', ' + b.city)}">${I.pin}<span>${esc(b.address)}, ${esc(b.city)}</span></a>` : ''}
          </div></section>
      </div>
    </div>`);

  $('#bChat')?.addEventListener('click', () => startChatWith(b.id));
  $('#bBook')?.addEventListener('click', (e) => { e.preventDefault(); $('#reserva')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#bFav')?.addEventListener('click', async (e) => {
    if (needsAuth(`#/empresa/${b.id}`)) return;
    const on = await store.toggleFavorite(b.id); e.currentTarget.textContent = on ? '❤️' : '🤍';
    on ? cache.favs.add(b.id) : cache.favs.delete(b.id); toast(on ? 'Guardado en favoritos' : 'Quitado de favoritos');
  });

  // Reserva
  if ($('#days')) {
    let dayIdx = 0, chosen = null;
    const confirmBtn = $('#confirm');
    const drawSlots = async () => {
      const d = days[dayIdx]; const end = new Date(d); end.setDate(end.getDate() + 1);
      const busy = new Set(await store.bookedSlots(b.id, d.toISOString(), end.toISOString()));
      const now = new Date(Date.now() + 30 * 60e3);
      const slots = slotsFor(b, d);
      $('#slots').innerHTML = slots.length ? slots.map((s) => { const iso = s.toISOString(); const dis = s < now || busy.has(iso); return `<button class="slot" data-iso="${iso}" ${dis ? 'disabled' : ''}>${hhmm(s)}</button>`; }).join('') : '<p class="muted">Sin horas este día.</p>';
      chosen = null; confirmBtn.disabled = true; confirmBtn.textContent = 'Selecciona una hora';
    };
    $('#days').addEventListener('click', (e) => { const x = e.target.closest('.day'); if (!x) return; dayIdx = +x.dataset.i; $$('#days .day').forEach((y) => y.classList.toggle('on', y === x)); drawSlots(); });
    $('#slots').addEventListener('click', (e) => {
      const s = e.target.closest('.slot'); if (!s || s.disabled) return;
      $$('#slots .slot').forEach((y) => y.classList.toggle('on', y === s)); chosen = s.dataset.iso;
      confirmBtn.disabled = false; confirmBtn.textContent = `Solicitar cita · ${fmtWhen(chosen)}`;
    });
    confirmBtn.addEventListener('click', async () => {
      if (needsAuth(`#/empresa/${b.id}`)) return;
      if (me.role === 'empresa') return toast('Inicia sesión como cliente para reservar');
      confirmBtn.disabled = true;
      try {
        const a = await store.createAppointment({ businessId: b.id, startsAt: chosen, service: $('#svc')?.value || '', note: $('#note').value.trim() });
        toast('Cita solicitada ✨ Te avisaremos en el chat');
        go(`#/mensajes/${a.conversation_id}`);
      } catch (err) { toast(err.message); drawSlots(); }
    });
    drawSlots();
  }

  // Reseñas
  if ($('#revForm')) {
    let rating = myReview?.rating || 0;
    $('#starIn').addEventListener('click', (e) => { const s = e.target.closest('button'); if (!s) return; rating = +s.dataset.n; $$('#starIn button').forEach((x) => x.classList.toggle('on', +x.dataset.n <= rating)); });
    $('#revForm').addEventListener('submit', async (e) => {
      e.preventDefault(); if (!rating) return toast('Elige de 1 a 5 estrellas');
      await store.addReview(b.id, rating, new FormData(e.target).get('comment').trim());
      await refreshBusinesses(); toast('¡Gracias por tu reseña!'); viewBusiness(parts); observeReveals();
    });
  }
}

// ───────────────────────── MENSAJES ─────────────────────────
function otherSide(c) {
  if (me.id === c.client_id) {
    const cat = catById(c.business?.category);
    return { name: c.business?.name || 'Empresa', sub: cat.name, icon: `<div class="mini" style="--tint:${cat.color}">${cat.emoji}</div>`, phone: c.business?.phone, email: c.business?.email, businessId: c.business_id };
  }
  return { name: c.client?.name || 'Cliente', sub: c.client?.phone || c.client?.email || '', icon: `<div class="avatar" style="width:46px;height:46px;border-radius:14px">${esc(initials(c.client?.name))}</div>`, phone: c.client?.phone, email: c.client?.email };
}

async function viewChats(parts) {
  if (needsAuth(location.hash)) return;
  mount(`
    <div class="chat-shell">
      <aside class="chat-list glass">
        <div class="chat-list-head">
          <div class="row" style="justify-content:space-between"><h1 class="title-md" style="font-size:26px">Mensajes</h1><button class="btn sm primary" id="newChat">${I.plus} Nuevo</button></div>
          <div class="searchbar" style="margin:0;padding:0 12px;border-radius:12px;background:var(--hairline);max-width:none">${I.search}<input id="chatFilter" placeholder="Buscar conversación" style="height:38px;font-size:15px"></div>
        </div>
        <div class="chat-items" id="chatItems"></div>
      </aside>
      <section class="thread glass" id="thread"></section>
    </div>`);
  $('#newChat').addEventListener('click', newChatSheet);
  $('#chatFilter').addEventListener('input', () => drawChatList());
  await drawChatList();
  await openThread(parts[1] || null);
}

let convCache = [];
async function drawChatList() {
  const list = $('#chatItems'); if (!list) return;
  convCache = await store.listConversations();
  const f = normalize($('#chatFilter')?.value || '');
  const items = convCache.filter((c) => !f || normalize(otherSide(c).name).includes(f));
  list.innerHTML = items.length ? items.map((c) => {
    const o = otherSide(c);
    return `<a class="chat-item ${c.id === chatState.convId ? 'active' : ''} ${c.unread ? 'unread' : ''}" href="#/mensajes/${c.id}">${o.icon}
      <div class="meta"><b>${esc(o.name)}</b><span>${esc(c.last_message || 'Nueva conversación')}</span></div>
      <div style="display:grid;justify-items:end;gap:6px"><time>${relTime(c.last_message_at)}</time>${c.unread ? '<span class="dot"></span>' : ''}</div></a>`;
  }).join('') : `<div class="empty" style="padding:40px 16px"><div class="big">💬</div><p>${f ? 'Sin coincidencias' : 'Aún no tienes conversaciones.'}</p>${!f && me.role === 'cliente' ? '<a class="btn sm" href="#/explorar">Buscar negocios</a>' : ''}</div>`;
}

function newChatSheet() {
  const isBiz = me.role === 'empresa';
  openSheet(`
    <h2 class="title-md">Nuevo chat</h2>
    <p class="muted" style="margin:6px 0 18px">${isBiz ? 'Escribe el teléfono o email de tu cliente.' : 'Escribe el teléfono o email de la empresa.'}</p>
    <form class="stack" id="ncForm">
      <label class="field"><span>Teléfono o email</span><input class="input" name="v" placeholder="+34 600 000 000 o hola@empresa.com" required autocomplete="off"></label>
      <div class="error" id="ncErr"></div>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn primary">Buscar y abrir chat</button></div>
    </form>`, (el, close) => {
    $('#ncForm', el).addEventListener('submit', async (e) => {
      e.preventDefault(); const v = new FormData(e.target).get('v').trim();
      const r = await store.findContact(v);
      if (!r) { $('#ncErr', el).textContent = isBiz ? 'No hay ningún cliente registrado con ese dato.' : `No encontramos ninguna empresa con ese ${isEmail(v) ? 'email' : 'teléfono'}.`; return; }
      if (isBiz && !me.business_id) { $('#ncErr', el).textContent = 'Tu cuenta no tiene empresa asociada.'; return; }
      const id = await store.openConversation(isBiz ? { businessId: me.business_id, clientId: r.profile.id } : { businessId: r.business.id, clientId: me.id });
      close(); go(`#/mensajes/${id}`);
    });
  });
}

async function openThread(convId) {
  chatState.convId = convId;
  const shell = $('.chat-shell'); const th = $('#thread'); if (!th) return;
  shell.classList.toggle('has-thread', !!convId);
  $$('.chat-item').forEach((x) => x.classList.toggle('active', x.getAttribute('href') === `#/mensajes/${convId}`));
  if (!convId) { th.innerHTML = `<div class="thread-empty"><div><div style="font-size:52px">🌿</div><h2 class="title-md" style="margin-top:8px">Tus conversaciones</h2><p>Elige un chat o empieza uno nuevo por teléfono o email.</p></div></div>`; return; }
  const c = await store.getConversation(convId);
  if (!c) { th.innerHTML = `<div class="thread-empty"><p>Conversación no disponible.</p></div>`; return; }
  const o = otherSide(c);
  const isClient = me.id === c.client_id;
  th.innerHTML = `
    <header class="thread-head">
      <a class="btn ghost sm icon" href="#/mensajes" aria-label="Volver">${I.back}</a>
      ${o.icon.replace('class="mini"', 'class="mini"')}
      <div class="grow"><b style="display:block">${esc(o.name)}</b><span class="subtle">${esc(o.sub)}</span></div>
      ${o.phone ? `<a class="btn sm icon" href="tel:${esc(o.phone)}" title="Llamar">${I.phone}</a>` : ''}
      ${o.email ? `<a class="btn sm icon" href="mailto:${esc(o.email)}" title="Email">${I.mail}</a>` : ''}
      ${isClient ? `<a class="btn sm" href="#/empresa/${c.business_id}">${I.cal} Cita</a>` : ''}
    </header>
    <div class="messages" id="msgs"></div>
    <div class="composer">
      <div class="quick" id="quick">${(isClient ? QUICK_CLIENT : QUICK_BUSINESS).map((q) => `<button type="button">${esc(q)}</button>`).join('')}</div>
      <form id="composer"><textarea id="msgIn" rows="1" placeholder="Escribe un mensaje" aria-label="Mensaje"></textarea><button class="send" aria-label="Enviar">${I.send}</button></form>
    </div>`;
  const input = $('#msgIn');
  const send = async (text) => {
    text = text.trim(); if (!text) return;
    input.value = ''; input.style.height = '44px';
    await store.sendMessage(convId, text); await drawMessages(); drawChatList();
  };
  $('#composer').addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); } });
  input.addEventListener('input', () => { input.style.height = '44px'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; input.style.overflowY = input.scrollHeight > 140 ? 'auto' : 'hidden'; });
  $('#quick').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) send(b.textContent); });
  $('#msgs').addEventListener('click', onApptAction);
  await drawMessages(true);
  if (matchMedia('(min-width: 900px)').matches) input.focus();
}

let lastMsgCount = 0;
async function drawMessages(initial = false) {
  const box = $('#msgs'); const convId = chatState.convId; if (!box || !convId) return;
  const [msgs, appts] = await Promise.all([store.listMessages(convId), store.listAppointments()]);
  if (convId !== chatState.convId) return;
  cache.appts = appts;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  let html = '', lastDay = null;
  for (const m of msgs) {
    const d = new Date(m.created_at);
    if (!lastDay || !sameDay(d, lastDay)) { html += `<div class="day-sep">${sameDay(d, new Date()) ? 'Hoy' : fmtLong.format(d)}</div>`; lastDay = d; }
    const mine = m.sender_id === me.id;
    if (m.kind === 'system') { html += `<div class="sys">${esc(m.body)}</div>`; continue; }
    if (m.kind === 'appointment') { html += apptBubble(appts.find((a) => a.id === m.meta?.appointment_id), mine, m); continue; }
    html += `<div class="msg ${mine ? 'mine' : 'theirs'} ${m.kind === 'auto' ? 'auto' : ''}">${esc(m.body)}</div><div class="msg-time ${mine ? 'mine' : ''}">${m.kind === 'auto' ? 'Respuesta automática · ' : ''}${hhmm(d)}</div>`;
  }
  if (!msgs.length) html = `<div class="thread-empty"><div><div style="font-size:40px">👋</div><p>Escribe tu primer mensaje.<br><span class="subtle">El historial queda guardado en tu cuenta.</span></p></div></div>`;
  // Solo animar mensajes nuevos
  box.innerHTML = html;
  if (!initial) $$('.msg, .appt-card', box).slice(0, Math.max(0, lastMsgCount)).forEach((x) => (x.style.animation = 'none'));
  lastMsgCount = $$('.msg, .appt-card', box).length;
  if (initial || atBottom) box.scrollTop = box.scrollHeight;
  store.markRead(convId).then(() => updateCounters());
}

function apptBubble(a, mine, m) {
  if (!a) return `<div class="sys">${esc(m.body)}</div>`;
  const isBiz = me.role === 'empresa';
  const future = new Date(a.starts_at) > new Date();
  return `<div class="appt-card glass ${mine ? '' : 'theirs'}">
    <div class="row" style="justify-content:space-between"><span class="subtle">📅 Solicitud de cita</span><span class="pill ${a.status}">${a.status}</span></div>
    <div class="when">${fmtLong.format(new Date(a.starts_at))}</div>
    <div class="muted" style="font-size:15px">${hhmm(new Date(a.starts_at))}${a.service ? ' · ' + esc(a.service) : ''}</div>
    ${a.note ? `<div class="subtle" style="margin-top:6px">“${esc(a.note)}”</div>` : ''}
    ${isBiz && a.status === 'pendiente' && future ? `<div class="row" style="margin-top:12px"><button class="btn sm primary grow" data-appt="${a.id}" data-st="confirmada">Confirmar</button><button class="btn sm grow danger" data-appt="${a.id}" data-st="rechazada">Rechazar</button></div>` : ''}
    ${!isBiz && a.status === 'confirmada' ? `<div class="row" style="margin-top:12px"><button class="btn sm grow" data-ics="${a.id}">${I.download} Añadir al calendario</button></div>` : ''}
  </div>`;
}

async function onApptAction(e) {
  const ics = e.target.closest('[data-ics]');
  if (ics) { const a = cache.appts.find((x) => x.id === ics.dataset.ics); if (a) downloadICS(a); return; }
  const b = e.target.closest('[data-appt]'); if (!b) return;
  const a = cache.appts.find((x) => x.id === b.dataset.appt); const st = b.dataset.st;
  if (st === 'cancelada' && !confirm('¿Cancelar esta cita?')) return;
  const when = fmtWhen(a.starts_at);
  const text = { confirmada: `✅ Cita confirmada para el ${when}`, rechazada: `La hora del ${when} no está disponible. Escríbenos y buscamos otra 🙏`, cancelada: `Cita del ${when} cancelada por el cliente` }[st];
  b.disabled = true;
  await store.setAppointmentStatus(a.id, st, text);
  toast({ confirmada: 'Cita confirmada', rechazada: 'Cita rechazada', cancelada: 'Cita cancelada' }[st]);
  if ($('#msgs')) { drawMessages(); drawChatList(); } else route();
  updateCounters();
}

function downloadICS(a) {
  const s = new Date(a.starts_at), e = new Date(s.getTime() + (+a.business?.slot_minutes || 30) * 60e3);
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const clean = (t = '') => t.replace(/[,;\\]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ConsultasYVisitas//ES', 'BEGIN:VEVENT', `UID:${a.id}@consultasyvisitas`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
    `SUMMARY:${clean(`${a.service || 'Cita'} · ${a.business?.name || ''}`)}`, `LOCATION:${clean([a.business?.address, a.business?.city].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${clean(a.note || 'Reservado con Consultas & Visitas')}`, 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio de cita', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'cita.ics' }); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ───────────────────────── CITAS ─────────────────────────
let apptTab = 'next';
function apptCard(a) {
  const d = new Date(a.starts_at); const isBiz = me.role === 'empresa';
  const future = d > new Date(); const cat = catById(a.business?.category);
  const who = isBiz ? a.client?.name || 'Cliente' : a.business?.name || 'Empresa';
  return `<div class="appt glass reveal">
    <div class="date-tile"><small>${fmtMonth.format(d)}</small><b>${d.getDate()}</b></div>
    <div class="grow">
      <div class="row wrap" style="gap:8px"><b style="font-size:17px">${esc(who)}</b><span class="pill ${a.status}">${a.status}</span></div>
      <div class="muted" style="font-size:15px">${fmtLong.format(d)} · ${hhmm(d)}</div>
      <div class="subtle">${isBiz ? esc(a.client?.phone || a.client?.email || '') : `${cat.emoji} ${esc(cat.name)}`}${a.service ? ' · ' + esc(a.service) : ''}${a.note ? ` · “${esc(a.note)}”` : ''}</div>
    </div>
    <div class="row wrap" style="gap:8px">
      ${a.conversation_id ? `<a class="btn sm" href="#/mensajes/${a.conversation_id}">${I.chat} Chat</a>` : ''}
      ${isBiz && a.status === 'pendiente' && future ? `<button class="btn sm primary" data-appt="${a.id}" data-st="confirmada">Confirmar</button><button class="btn sm danger" data-appt="${a.id}" data-st="rechazada">Rechazar</button>` : ''}
      ${!isBiz && ['pendiente', 'confirmada'].includes(a.status) && future ? `<button class="btn sm" data-ics="${a.id}">${I.download} Calendario</button><button class="btn sm danger" data-appt="${a.id}" data-st="cancelada">Cancelar</button>` : ''}
    </div></div>`;
}

async function viewAppointments() {
  if (needsAuth('#/citas')) return;
  cache.appts = await store.listAppointments();
  mount(`
    <div class="section-head reveal" style="flex-wrap:wrap"><h1 class="title-lg">${me.role === 'empresa' ? 'Agenda' : 'Mis citas'}</h1>${segmented('apTab', [['next', 'Próximas'], ['past', 'Historial']], apptTab)}</div>
    <div class="stack" id="apList"></div>`);
  const draw = () => {
    const now = new Date();
    const list = cache.appts.filter((a) => (apptTab === 'next' ? new Date(a.starts_at) >= now && !['cancelada', 'rechazada'].includes(a.status) : new Date(a.starts_at) < now || ['cancelada', 'rechazada'].includes(a.status)));
    if (apptTab === 'past') list.reverse();
    $('#apList').innerHTML = list.length ? list.map(apptCard).join('') : `<div class="empty glass"><div class="big">🗓️</div><h3 class="title-md">${apptTab === 'next' ? 'No hay citas próximas' : 'Sin historial'}</h3>${me.role === 'cliente' && apptTab === 'next' ? '<p>Encuentra un negocio y reserva en segundos.</p><a class="btn primary" href="#/explorar" style="margin-top:8px">Explorar</a>' : ''}</div>`;
    observeReveals();
  };
  bindSegmented($('#apTab'), (v) => { apptTab = v; draw(); });
  $('#apList').addEventListener('click', onApptAction);
  draw();
}

// ───────────────────────── PANEL EMPRESA ─────────────────────────
async function viewPanel() {
  if (needsAuth('#/panel')) return;
  if (me.role !== 'empresa' || !me.business_id) return mount(`<div class="empty"><div class="big">🏪</div><h2 class="title-md">Solo para cuentas de empresa</h2><a class="btn primary" href="#/registro?rol=empresa" style="margin-top:12px">Registrar una empresa</a></div>`);
  const b = await store.getBusiness(me.business_id);
  const [convs, appts] = await Promise.all([store.listConversations(), store.listAppointments()]);
  const now = new Date();
  const pending = appts.filter((a) => a.status === 'pendiente' && new Date(a.starts_at) > now);
  const todayList = appts.filter((a) => sameDay(new Date(a.starts_at), now) && a.status === 'confirmada');
  cache.appts = appts;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const svcText = (b.services || []).map((s) => (s.price ? `${s.name} | ${s.price}` : s.name)).join('\n');
  mount(`
    <div class="section-head reveal" style="flex-wrap:wrap"><div><h1 class="title-lg">Hola, ${esc(b.name)}</h1><p class="muted" style="margin:6px 0 0">Esto es lo que pasa hoy en tu negocio.</p></div><a class="btn" href="#/empresa/${b.id}">Ver mi página pública</a></div>
    <div class="stats">
      <div class="stat glass reveal"><b>${pending.length}</b><span>Citas por confirmar</span></div>
      <div class="stat glass reveal"><b>${todayList.length}</b><span>Citas hoy</span></div>
      <div class="stat glass reveal"><b>${convs.filter((c) => c.unread).length}<small style="font-size:18px;color:var(--text-3)"> / ${convs.length}</small></b><span>Chats sin leer</span></div>
      <div class="stat glass reveal"><b>${b.rating_count ? (+b.rating_avg).toFixed(1) + ' ★' : '—'}</b><span>${b.rating_count} reseña${b.rating_count === 1 ? '' : 's'}</span></div>
    </div>
    ${pending.length ? `<section class="section" style="margin-top:28px"><h2 class="title-md reveal" style="margin-bottom:12px">Por confirmar</h2><div class="stack" id="pendList">${pending.map(apptCard).join('')}</div></section>` : ''}

    <section class="section" style="margin-top:36px">
      <h2 class="title-md reveal" style="margin-bottom:12px">Perfil de tu empresa</h2>
      <form class="glass card stack reveal" id="bizForm">
        <div class="form-grid">
          <label class="field"><span>Nombre</span><input class="input" name="name" value="${esc(b.name)}" required></label>
          <label class="field"><span>Categoría</span><select class="input" name="category">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === b.category ? 'selected' : ''}>${c.emoji} ${c.name}</option>`).join('')}</select></label>
          <label class="field"><span>Ciudad</span><input class="input" name="city" value="${esc(b.city)}"></label>
          <label class="field"><span>Dirección</span><input class="input" name="address" value="${esc(b.address)}"></label>
          <label class="field"><span>Teléfono de contacto</span><input class="input" name="phone" type="tel" value="${esc(b.phone)}"></label>
          <label class="field"><span>Email de contacto</span><input class="input" name="email" type="email" value="${esc(b.email)}"></label>
        </div>
        <label class="field"><span>Descripción</span><textarea class="input" name="description" placeholder="Cuéntales a tus clientes qué hacéis y qué os hace especiales">${esc(b.description)}</textarea></label>
        <label class="field"><span>Palabras clave (ayudan al buscador)</span><input class="input" name="tags" value="${esc(b.tags || '')}" placeholder="urgencias, vegano, a domicilio…"></label>
        <div class="form-grid">
          <label class="field"><span>Servicios (uno por línea: Nombre | Precio)</span><textarea class="input" name="services" placeholder="Corte de pelo | 15 €">${esc(svcText)}</textarea></label>
          <label class="field"><span>Respuesta automática al primer mensaje</span><textarea class="input" name="auto_reply" placeholder="¡Hola! Gracias por escribirnos. Te respondemos en breve.">${esc(b.auto_reply || '')}</textarea></label>
        </div>
        <div class="field"><span>Horario y duración de cada cita</span>
          <div class="row wrap" style="margin-bottom:8px"><span class="muted" style="font-size:14px">Duración:</span><select class="input" name="slot_minutes" style="width:auto;height:40px">${[15, 20, 30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${+b.slot_minutes === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></div>
          <div class="hours-edit">${order.map((d) => { const r = (b.hours || {})[d] || []; return `<div class="hrow" data-day="${d}">
            <label class="row" style="gap:10px"><span class="switch"><input type="checkbox" ${r.length ? 'checked' : ''}><span></span></span><b style="font-size:15px">${DAYS[d]}</b></label>
            <div class="ranges">
              <input type="time" value="${r[0]?.[0] || '09:00'}"> – <input type="time" value="${r[0]?.[1] || '14:00'}">
              <span class="subtle" style="margin:0 4px">y</span>
              <input type="time" value="${r[1]?.[0] || ''}"> – <input type="time" value="${r[1]?.[1] || ''}">
            </div></div>`; }).join('')}</div>
        </div>
        <div class="row" style="justify-content:flex-end"><button class="btn primary">Guardar cambios</button></div>
      </form>
    </section>`);
  $('#pendList')?.addEventListener('click', onApptAction);
  $('#bizForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const hours = {};
    $$('.hrow', e.target).forEach((row) => {
      const d = row.dataset.day; const on = $('input[type=checkbox]', row).checked; const t = $$('input[type=time]', row).map((x) => x.value);
      hours[d] = on ? [[t[0], t[1]], [t[2], t[3]]].filter(([a, b]) => a && b) : [];
    });
    const services = f.get('services').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, price = ''] = l.split('|').map((x) => x.trim()); return { name, price }; });
    const patch = { name: f.get('name').trim(), category: f.get('category'), city: f.get('city').trim(), address: f.get('address').trim(), phone: f.get('phone').trim(), email: f.get('email').trim(), description: f.get('description').trim(), tags: f.get('tags').trim(), auto_reply: f.get('auto_reply').trim(), slot_minutes: +f.get('slot_minutes'), services, hours };
    try { await store.saveBusiness(patch); await refreshBusinesses(); toast('Cambios guardados ✓'); } catch (err) { toast(err.message); }
  });
}

// ───────────────────────── AUTH ─────────────────────────
async function viewLogin(_, params) {
  if (me) return go(params.get('next') || '#/');
  let role = params.get('rol') === 'empresa' ? 'empresa' : 'cliente';
  mount(`<div class="auth-wrap"><div class="auth glass liquid reveal">
    <h1>Bienvenido de nuevo</h1>
    <p class="muted" style="text-align:center;margin:8px 0 0">Tus chats y citas te esperan.</p>
    ${segmented('roleSeg', [['cliente', 'Soy cliente'], ['empresa', 'Soy empresa']], role)}
    <form class="stack" id="loginForm">
      <label class="field"><span>Email o teléfono</span><input class="input" name="id" autocomplete="username" required placeholder="tu@email.com o +34 600…"></label>
      <label class="field"><span>Contraseña</span><input class="input" name="pw" type="password" autocomplete="current-password" required></label>
      <div class="error" id="lErr"></div>
      <button class="btn primary" style="width:100%" id="lBtn">Iniciar sesión como <span id="lRole">${role}</span></button>
    </form>
    <p class="muted" style="text-align:center;margin:18px 0 0;font-size:14px">¿No tienes cuenta? <a href="#/registro?rol=${role}" id="toReg" style="color:var(--accent);font-weight:600">Crear cuenta</a></p>
    ${store.mode === 'local' ? `<div class="demo-box">Cuentas de prueba (contraseña <b>demo1234</b>):<br>Cliente: <button data-demo="cliente@demo.com|cliente">cliente@demo.com</button><br>Empresa: <button data-demo="empresa2@demo.com|empresa">empresa2@demo.com</button> (Clínica Huellas)</div>` : ''}
  </div></div>`);
  bindSegmented($('#roleSeg'), (v) => { role = v; $('#lRole').textContent = v; $('#toReg').href = `#/registro?rol=${v}`; });
  $$('[data-demo]').forEach((b) => b.addEventListener('click', () => {
    const [em, r] = b.dataset.demo.split('|'); $('[name=id]').value = em; $('[name=pw]').value = 'demo1234';
    $(`#roleSeg button[data-v=${r}]`).click();
  }));
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target); $('#lErr').textContent = ''; $('#lBtn').disabled = true;
    try {
      const u = await store.signIn(f.get('id'), f.get('pw'));
      if (u.role !== role) { await store.signOut(); throw new Error(`Esta cuenta es de ${u.role}. Selecciona “Soy ${u.role}” arriba.`); }
      me = u; await refreshFavs(); toast(`Hola, ${me.name.split(' ')[0]} 👋`);
      go(params.get('next') || (me.role === 'empresa' ? '#/panel' : '#/'));
    } catch (err) { $('#lErr').textContent = err.message; $('#lBtn').disabled = false; }
  });
}

async function viewRegister(_, params) {
  if (me) return go('#/');
  let role = params.get('rol') === 'empresa' ? 'empresa' : 'cliente';
  mount(`<div class="auth-wrap"><div class="auth glass liquid reveal">
    <h1>Crea tu cuenta</h1>
    <p class="muted" style="text-align:center;margin:8px 0 0">Gratis y en menos de un minuto.</p>
    ${segmented('roleSeg', [['cliente', 'Soy cliente'], ['empresa', 'Soy empresa']], role)}
    <form class="stack" id="regForm">
      <label class="field"><span id="nameLbl">${role === 'empresa' ? 'Tu nombre (responsable)' : 'Nombre'}</span><input class="input" name="name" required autocomplete="name"></label>
      <div id="bizFields" class="stack ${role === 'empresa' ? '' : 'hidden'}">
        <label class="field"><span>Nombre de la empresa</span><input class="input" name="bname"></label>
        <div class="form-grid" style="grid-template-columns:1fr 1fr">
          <label class="field"><span>Categoría</span><select class="input" name="category">${CATEGORIES.map((c) => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('')}</select></label>
          <label class="field"><span>Ciudad</span><input class="input" name="city"></label>
        </div>
      </div>
      <label class="field"><span>Email</span><input class="input" name="email" type="email" required autocomplete="email"></label>
      <label class="field"><span>Teléfono</span><input class="input" name="phone" type="tel" required autocomplete="tel" placeholder="+34 600 000 000"></label>
      <label class="field"><span>Contraseña (mín. 6 caracteres)</span><input class="input" name="pw" type="password" minlength="6" required autocomplete="new-password"></label>
      <div class="error" id="rErr"></div>
      <button class="btn primary" style="width:100%" id="rBtn">Crear cuenta</button>
    </form>
    <p class="muted" style="text-align:center;margin:18px 0 0;font-size:14px">¿Ya tienes cuenta? <a href="#/entrar?rol=${role}" style="color:var(--accent);font-weight:600">Inicia sesión</a></p>
  </div></div>`);
  bindSegmented($('#roleSeg'), (v) => {
    role = v; $('#bizFields').classList.toggle('hidden', v !== 'empresa');
    $('#nameLbl').textContent = v === 'empresa' ? 'Tu nombre (responsable)' : 'Nombre';
  });
  $('#regForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target); $('#rErr').textContent = '';
    if (role === 'empresa' && !f.get('bname').trim()) return ($('#rErr').textContent = 'Indica el nombre de la empresa');
    if (f.get('phone').replace(/\D/g, '').length < 9) return ($('#rErr').textContent = 'Introduce un teléfono válido');
    $('#rBtn').disabled = true;
    try {
      me = await store.signUp({ role, name: f.get('name').trim(), email: f.get('email').trim(), phone: f.get('phone').trim(), password: f.get('pw'), business: role === 'empresa' ? { name: f.get('bname').trim(), category: f.get('category'), city: f.get('city').trim() } : null });
      await refreshBusinesses(); toast('¡Cuenta creada! 🌿');
      go(role === 'empresa' ? '#/panel' : '#/explorar');
    } catch (err) { $('#rErr').textContent = err.message; $('#rBtn').disabled = false; }
  });
}

// ───────────────────────── tiempo real ─────────────────────────
const onData = debounce(async (evt) => {
  if (evt.table === 'auth') {
    const was = me?.id; me = await store.user();
    if (was !== me?.id) { await refreshFavs(); route(); }
    return;
  }
  if (['businesses', 'reviews', '*'].includes(evt.table)) await refreshBusinesses();
  const key = parseHash().parts[0];
  if (key === 'mensajes' && $('.chat-shell')) { await drawChatList(); if (chatState.convId) await drawMessages(); }
  else if (key === 'citas' && evt.table === 'appointments') route();
  updateCounters();
}, 150);

// ───────────────────────── arranque ─────────────────────────
async function boot() {
  applyTheme();
  store = await createStore();
  me = await store.user();
  await Promise.all([refreshBusinesses(), refreshFavs()]);
  store.subscribe(onData);
  window.addEventListener('hashchange', route);
  route();
  // Revisión periódica suave por si el canal en tiempo real se corta
  setInterval(() => { if (me && !document.hidden) onData({ table: 'poll' }); }, 20000);
}
boot();

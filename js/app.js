import { createStore, isEmail } from './store.js';
import { CATEGORIES, catById, inferCategory, normalize, SEARCH_EXAMPLES, QUICK_CLIENT, QUICK_BUSINESS } from './data.js';

// ───────────────────────── utilidades ─────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n = '') => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '·';
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const pad = (n) => String(n).padStart(2, '0');
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const fmtDay = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
const _fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtLong = { format: (d) => cap(_fmtLong.format(d)) };
const fmtShort = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'short' });
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtWhen = (iso) => { const d = new Date(iso); return `${fmtShort.format(d)} · ${hhmm(d)}`; };
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const greeting = () => { const h = new Date().getHours(); return h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; };
function relTime(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return hhmm(d);
  if (sameDay(d, y)) return 'Ayer';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
function waitingFor(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24); return `hace ${d} día${d > 1 ? 's' : ''}`;
}

const svg = (p, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  chat: svg('<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'),
  cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  home: svg('<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  compass: svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  phone: svg('<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
  wa: svg('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>'),
  store: svg('<path d="M4 9 5.5 4h13L20 9M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M4 9h16M9 20v-6h6v6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  back: svg('<path d="m15 5-7 7 7 7"/>'),
  send: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  heart: svg('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  logout: svg('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  pin: svg('<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  shield: svg('<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  star: svg('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>'),
  check: svg('<path d="m5 12 4.5 4.5L19 7"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>'),
  lock: svg('<rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  sync: svg('<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4"/>'),
  bolt: svg('<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
};
const STAR = '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>';
const stars = (r = 0) => { const n = Math.round(r); return `<span class="star-row" aria-label="${(+r).toFixed(1)} de 5">${[1, 2, 3, 4, 5].map((i) => `<svg viewBox="0 0 24 24" class="${i <= n ? '' : 'off'}">${STAR}</svg>`).join('')}</span>`; };
const catIcon = (cat, cls = '', style = '') => { const c = typeof cat === 'string' ? catById(cat) : cat; return `<span class="cat-icon ${cls}" style="--tint:${c.color};${style}"><svg viewBox="0 0 24 24">${c.icon}</svg></span>`; };
const emptyState = (icon, title, text = '', action = '') => `<div class="empty"><div class="empty-icon">${icon}</div><h3 class="title-md">${title}</h3>${text ? `<p style="margin:6px 0 0">${text}</p>` : ''}${action ? `<div style="margin-top:14px">${action}</div>` : ''}</div>`;

// ───────────────────────── estado ─────────────────────────
let store, me = null;
const cache = { businesses: [], favs: new Set(), appts: [] };
const app = $('#app');
let currentRoute = '';
const chatState = { convId: null };

const toast = (msg, ms = 2800) => {
  const el = document.createElement('div'); el.className = 'toast glass'; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
};
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

function isOpenNow(hours) {
  const now = new Date(); const ranges = (hours || {})[now.getDay()] || [];
  const m = now.getHours() * 60 + now.getMinutes();
  return ranges.some(([s, e]) => {
    const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
    const a = sh * 60 + sm; let b = eh * 60 + em; if (b <= a) b += 1440;
    return m >= a && m < b;
  });
}
const openPill = (b) => (isOpenNow(b.hours) ? '<span class="pill open">Abierto</span>' : '<span class="pill closed">Cerrado</span>');

async function refreshBusinesses() { cache.businesses = await store.listBusinesses(); }
async function refreshFavs() { cache.favs = new Set(me?.role === 'cliente' ? await store.favorites() : []); }

// ───────────────────────── hojas y menús ─────────────────────────
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

function confirmSheet({ title, text, ok = 'Eliminar', danger = true }) {
  return new Promise((resolve) => {
    let answered = false;
    openSheet(`
      <div class="empty-icon" style="${danger ? 'background:color-mix(in srgb,var(--bad) 12%,transparent);color:var(--bad)' : ''}">${danger ? I.trash : I.info}</div>
      <h2 class="title-md" style="text-align:center">${title}</h2>
      <p class="muted" style="text-align:center;margin:8px 0 22px">${text}</p>
      <div class="row"><button class="btn grow" data-close>Cancelar</button><button class="btn grow ${danger ? 'danger-fill' : 'primary'}" id="cfOk">${ok}</button></div>`, (el, close) => {
      $('#cfOk', el).addEventListener('click', () => { answered = true; close(); resolve(true); });
      el.parentElement.addEventListener('click', (e) => { if (!answered && (e.target === el.parentElement || e.target.closest('[data-close]'))) resolve(false); });
    });
  });
}

function openMenu(anchor) {
  closeMenu();
  const r = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'menu glass'; el.id = 'menu';
  el.style.top = r.bottom + 10 + 'px'; el.style.right = Math.max(12, innerWidth - r.right) + 'px';
  const roleName = { empresa: 'Cuenta de empresa', cliente: 'Cuenta de cliente', admin: 'Administrador' }[me.role];
  el.innerHTML = `
    <div class="row" style="padding:10px 12px 12px"><div class="avatar">${esc(initials(me.name))}</div>
      <div class="grow"><b style="display:block;font-size:15px">${esc(me.name)}</b><span class="subtle">${roleName}</span></div></div>
    <div class="menu-sep"></div>
    ${me.role === 'empresa' ? `<a class="menu-item" href="#/panel">${I.store} Mi empresa</a>` : ''}
    ${me.role === 'cliente' ? `<a class="menu-item" href="#/favoritos">${I.heart} Favoritos</a>` : ''}
    <button class="menu-item" data-act="profile">${I.edit} Editar perfil</button>
    <button class="menu-item" data-act="theme">${I.moon} Tema: ${themeLabel()}</button>
    <div class="menu-sep"></div>
    <button class="menu-item" data-act="logout" style="color:var(--bad)">${I.logout} Cerrar sesión</button>`;
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
const getTheme = () => { try { return localStorage.getItem('cyv_theme') || 'light'; } catch { return 'light'; } };
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
  if (!me || me.role === 'admin') { unread = 0; pendingAppts = 0; } else {
    const convs = await store.listConversations();
    unread = convs.filter((c) => c.unread).length;
    cache.appts = await store.listAppointments();
    pendingAppts = me.role === 'empresa' ? cache.appts.filter((a) => a.status === 'pendiente' && new Date(a.starts_at) > new Date()).length : 0;
  }
  $$('[data-badge="chat"]').forEach((b) => { b.textContent = unread || ''; b.dataset.n = unread; });
  $$('[data-badge="appt"]').forEach((b) => { b.textContent = pendingAppts || ''; b.dataset.n = pendingAppts; });
}

function navItems() {
  if (!me) return [['', 'Inicio', I.home], ['explorar', 'Explorar', I.compass]];
  if (me.role === 'admin') return [['', 'Administración', I.shield, null, 'Admin'], ['explorar', 'Explorar', I.compass]];
  if (me.role === 'empresa') return [['', 'Resumen', I.chart], ['mensajes', 'Mensajes', I.chat, 'chat'], ['citas', 'Agenda', I.cal, 'appt'], ['panel', 'Mi empresa', I.store, null, 'Empresa'], ['explorar', 'Explorar', I.compass]];
  return [['', 'Inicio', I.home], ['explorar', 'Explorar', I.compass], ['mensajes', 'Mensajes', I.chat, 'chat'], ['citas', 'Citas', I.cal, 'appt'], ['favoritos', 'Favoritos', I.heart]];
}

function renderNav() {
  const sec = parseHash().parts[0] || '';
  const items = navItems();
  $('#navLinks').innerHTML = items.map(([k, t, , b]) => `<a class="nav-link ${sec === k ? 'active' : ''}" href="#/${k}">${t}${b ? `<span class="badge" data-badge="${b}"></span>` : ''}</a>`).join('');
  $('#navRight').innerHTML = me
    ? `<button class="avatar-btn" id="avatarBtn" aria-label="Menú de cuenta"><span class="avatar">${esc(initials(me.name))}</span></button>`
    : `<a class="btn ghost sm" href="#/entrar">Entrar</a><a class="btn primary sm" href="#/registro">Crear cuenta</a>`;
  $('#avatarBtn')?.addEventListener('click', (e) => { e.stopPropagation(); $('#menu') ? closeMenu() : openMenu(e.currentTarget); });
  const tabs = me ? items : [...items, ['entrar', 'Entrar', I.user], ['registro', 'Registro', I.plus]];
  $('#tabbar').innerHTML = tabs.map(([k, t, ic, b, short]) => `<a class="tab ${sec === k ? 'active' : ''}" href="#/${k}">${ic}<span>${short || t}</span>${b ? `<span class="badge" data-badge="${b}"></span>` : ''}</a>`).join('');
  updateCounters();
}

const needsAuth = (next) => { if (me) return false; go(`#/entrar?next=${encodeURIComponent(next)}`); return true; };
const notFor = (...roles) => { if (me && roles.includes(me.role)) { go('#/'); return true; } return false; };

async function route() {
  closeMenu();
  const { parts, params } = parseHash();
  const key = parts[0] || '';
  const prev = currentRoute; currentRoute = location.hash;
  renderNav();
  if (key !== 'mensajes') chatState.convId = null;
  const views = { '': viewHome, explorar: viewExplore, empresa: viewBusiness, mensajes: viewChats, citas: viewAppointments, panel: viewPanel, entrar: viewLogin, registro: viewRegister, favoritos: viewFavorites };
  const v = views[key] || viewHome;
  if (key === 'mensajes' && prev.startsWith('#/mensajes') && $('.chat-shell')) return openThread(parts[1] || null);
  await v(parts, params);
  if (!(key === 'explorar' && prev.startsWith('#/explorar'))) window.scrollTo({ top: 0, behavior: 'instant' });
  observeReveals();
}

const mount = (html) => { app.innerHTML = `<div class="view">${html}</div>`; };

const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.06 });
function observeReveals() {
  $$('.reveal:not(.in)').forEach((el) => {
    const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
    el.style.setProperty('--d', `${Math.min(sib.indexOf(el), 10) * 50}ms`);
    io.observe(el);
  });
  // Lo que ya está en pantalla aparece sin esperar al observer
  requestAnimationFrame(() => $$('.reveal:not(.in)').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) { el.classList.add('in'); io.unobserve(el); } }));
}

document.addEventListener('pointermove', (e) => {
  const el = e.target.closest?.('.liquid'); if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

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
    ${catIcon(c, 'md')}
    <div class="biz-body">
      <div class="biz-top"><h3>${esc(b.name)}</h3>${openPill(b)}</div>
      <p class="muted">${esc(c.name)}${b.city ? ' · ' + esc(b.city) : ''}</p>
      <p class="biz-desc">${esc(b.description || 'Sin descripción todavía.')}</p>
      <div class="biz-meta">${b.rating_count ? `${stars(+b.rating_avg)} ${(+b.rating_avg).toFixed(1)} · ${b.rating_count} reseña${b.rating_count > 1 ? 's' : ''}` : '<span>Nuevo en la plataforma</span>'}</div>
    </div></a>`;
}

// ═════════════════════════ INICIO (según el tipo de cuenta) ═════════════════════════
async function viewHome(parts, params) {
  if (!me) return viewLanding();
  if (me.role === 'admin') return viewAdmin(params);
  if (me.role === 'empresa') return viewBusinessHome();
  return viewClientHome();
}

const demoBanner = () => (store.mode === 'local' ? `<div class="banner glass reveal"><span class="icon-chip">${I.info}</span><span><b>Sin conexión a la base de datos.</b> Los datos solo se guardan en este navegador hasta que se configure Supabase en <code>js/config.js</code>.</span></div>` : '');

// ── Visitante: presentación de la plataforma
async function viewLanding() {
  const cities = new Set(cache.businesses.map((b) => b.city).filter(Boolean)).size;
  const cats = new Set(cache.businesses.map((b) => b.category)).size;
  const li = (ic, t, d) => `<li><span class="icon-chip">${ic}</span><span><b>${t}</b>${d}</span></li>`;
  mount(`
    ${demoBanner()}
    <section class="hero">
      <div class="eyebrow reveal"><i></i> Consultas y citas sin llamadas</div>
      <h1 class="title-xl reveal">Tus negocios de confianza,<br><span class="gradient-text">a un mensaje.</span></h1>
      <p class="lead reveal">Escribe a cualquier negocio con tu teléfono o tu email, resuelve tus dudas y reserva tu visita. Todo queda guardado en tu cuenta, en todos tus dispositivos.</p>
      <div class="row reveal" style="justify-content:center;margin-top:30px;flex-wrap:wrap">
        <a class="btn primary" href="#/registro" style="height:50px;padding:0 26px;font-size:16px">Crear cuenta gratis</a>
        <a class="btn" href="#/entrar" style="height:50px;padding:0 26px;font-size:16px">Ya tengo cuenta</a>
      </div>
      ${cache.businesses.length >= 3 ? `<div class="metrics reveal">
        <div class="metric"><b>${cache.businesses.length}</b><span>negocios</span></div>
        <div class="metric"><b>${cats}</b><span>categorías</span></div>
        <div class="metric"><b>${cities}</b><span>ciudades</span></div>
      </div>` : ''}
    </section>

    <section class="section">
      <div class="feature-cols">
        <div class="feature glass liquid reveal"><div class="kicker">Para clientes</div><h2 class="title-md">Pregunta, reserva y olvídate.</h2>
          <ul>${li(I.chat, 'Chat por teléfono o email', 'Escribe el contacto del negocio y empieza a hablar al momento.')}
          ${li(I.cal, 'Reserva en segundos', 'Solo verás horas libres. Te avisamos cuando la confirmen.')}
          ${li(I.sync, 'Tu historial, siempre contigo', 'Entra desde el móvil o el ordenador y sigue la misma conversación.')}</ul></div>
        <div class="feature glass liquid reveal"><div class="kicker">Para empresas</div><h2 class="title-md">Tu día, bajo control.</h2>
          <ul>${li(I.chart, 'Resumen diario', 'Chats por responder, visitas de hoy y citas por confirmar de un vistazo.')}
          ${li(I.clock, 'Agenda sin solapes', 'Define tu horario y la duración de cada cita. El resto va solo.')}
          ${li(I.bolt, 'Respuesta automática', 'Tus clientes reciben una respuesta inmediata aunque estés ocupado.')}</ul></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head reveal"><h2 class="title-lg">Así de sencillo</h2></div>
      <div class="steps">
        <div class="step glass reveal"><div class="num">1</div><h3>Crea tu cuenta</h3><p class="muted">Como cliente o como empresa. Solo necesitas email y teléfono.</p></div>
        <div class="step glass reveal"><div class="num">2</div><h3>Encuentra o escribe</h3><p class="muted">Busca por lo que necesitas en Explorar, o abre un chat con un teléfono o email.</p></div>
        <div class="step glass reveal"><div class="num">3</div><h3>Reserva tu visita</h3><p class="muted">Elige día y hora. La empresa la confirma y te llega el aviso al chat.</p></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head reveal"><h2 class="title-lg">Preguntas frecuentes</h2></div>
      <div class="glass panel faq reveal">
        <details><summary>¿Cuánto cuesta?</summary><p>Es gratis para clientes y para empresas.</p></details>
        <details><summary>¿Puedo ver mis chats desde otro dispositivo?</summary><p>Sí. Las conversaciones y citas se guardan en tu cuenta: inicia sesión en cualquier dispositivo y lo tendrás todo.</p></details>
        <details><summary>¿Cómo contacto con un negocio que no aparece?</summary><p>Si el negocio está registrado, escribe su teléfono o email en “Nuevo chat” y se abrirá la conversación.</p></details>
        <details><summary>¿Qué pasa si no pueden atenderme a la hora que elegí?</summary><p>La empresa puede rechazar la cita y escribirte para proponerte otra hora en el mismo chat.</p></details>
      </div>
    </section>

    <section class="section"><div class="glass panel reveal" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:28px">
      <span class="icon-chip" style="width:52px;height:52px;border-radius:16px">${I.store}</span>
      <div class="grow"><h2 class="title-md">¿Tienes un negocio?</h2><p class="muted" style="margin:6px 0 0">Recibe consultas y citas en un solo lugar.</p></div>
      <a class="btn primary" href="#/registro?rol=empresa">Registrar mi empresa</a></div></section>
    <footer class="footer">Consultas &amp; Visitas</footer>`);
}

// ── Cliente: su día a día
async function viewClientHome() {
  const [convs, appts] = await Promise.all([store.listConversations(), store.listAppointments()]);
  await refreshFavs();
  const now = new Date();
  const upcoming = appts.filter((a) => new Date(a.starts_at) > now && ['pendiente', 'confirmada'].includes(a.status));
  const next = upcoming[0];
  const favs = cache.businesses.filter((b) => cache.favs.has(b.id)).slice(0, 4);
  // Visitas ya hechas sin reseña
  const past = appts.filter((a) => a.status === 'confirmada' && new Date(a.starts_at) < now);
  const toReview = [];
  for (const bid of [...new Set(past.map((a) => a.business_id))].slice(0, 6)) {
    const rs = await store.listReviews(bid);
    if (!rs.some((r) => r.client_id === me.id)) toReview.push(past.find((a) => a.business_id === bid));
  }
  const convRow = (c) => { const cat = catById(c.business?.category); return `<a class="list-row" href="#/mensajes/${c.id}">${catIcon(cat, 'sm')}<div class="t"><b>${esc(c.business?.name || 'Empresa')}</b><span>${esc(c.last_message || 'Nueva conversación')}</span></div><div style="display:grid;justify-items:end;gap:6px"><span class="subtle">${relTime(c.last_message_at)}</span>${c.unread ? '<span class="dot"></span>' : ''}</div></a>`; };

  mount(`
    ${demoBanner()}
    <div class="page-head reveal"><div><div class="kicker">${fmtLong.format(now)}</div><h1 class="title-lg">${greeting()}, ${esc(me.name.split(' ')[0])}</h1></div></div>
    <div class="quick-tiles">
      <a class="qtile glass liquid reveal" href="#/explorar"><span class="icon-chip">${I.search}</span><div><b>Buscar un negocio</b><span>Describe lo que necesitas</span></div></a>
      <button class="qtile glass liquid reveal" id="qNew"><span class="icon-chip">${I.chat}</span><div><b>Chat por teléfono o email</b><span>Escribe a un negocio directamente</span></div></button>
      <a class="qtile glass liquid reveal" href="#/citas"><span class="icon-chip">${I.cal}</span><div><b>Mis citas</b><span>${upcoming.length ? `${upcoming.length} próxima${upcoming.length > 1 ? 's' : ''}` : 'Sin citas próximas'}</span></div></a>
    </div>
    <div class="dash" style="margin-top:16px">
      <section class="glass panel span-7 reveal">
        <div class="panel-head"><h2>Tu próxima cita</h2>${upcoming.length > 1 ? `<a class="btn ghost sm" href="#/citas">Ver todas</a>` : ''}</div>
        ${next ? `<div class="next-appt">${catIcon(next.business?.category, 'md')}
          <div class="grow"><div class="big-date">${fmtLong.format(new Date(next.starts_at))} · ${hhmm(new Date(next.starts_at))}</div>
          <div class="muted">${esc(next.business?.name || '')}${next.service ? ' · ' + esc(next.service) : ''}</div>
          <div style="margin-top:8px"><span class="pill ${next.status}">${next.status}</span></div></div>
          <div class="row wrap"><a class="btn sm" href="#/mensajes/${next.conversation_id}">${I.chat} Chat</a>${next.status === 'confirmada' ? `<button class="btn sm" data-ics="${next.id}">${I.download} Calendario</button>` : ''}</div></div>`
        : emptyState(I.cal, 'No tienes citas próximas', 'Encuentra un negocio y reserva en segundos.', '<a class="btn primary" href="#/explorar">Explorar</a>')}
      </section>
      <section class="glass panel span-5 reveal">
        <div class="panel-head"><h2>Mensajes recientes</h2><a class="btn ghost sm" href="#/mensajes">Ver todos</a></div>
        ${convs.length ? convs.slice(0, 4).map(convRow).join('') : emptyState(I.chat, 'Sin conversaciones', 'Escribe a un negocio para empezar.')}
      </section>
      <section class="glass panel span-7 reveal">
        <div class="panel-head"><h2>Pendiente de valorar</h2></div>
        ${toReview.length ? toReview.map((a) => `<div class="list-row">${catIcon(a.business?.category, 'sm')}<div class="t"><b>${esc(a.business?.name)}</b><span>Visita del ${fmtShort.format(new Date(a.starts_at))}</span></div><a class="btn sm" href="#/empresa/${a.business_id}?resenas">${I.star} Valorar</a></div>`).join('')
        : `<p class="muted" style="margin:0">Cuando completes una visita podrás valorarla aquí. Tus reseñas ayudan a otros clientes.</p>`}
      </section>
      <section class="glass panel span-5 reveal">
        <div class="panel-head"><h2>Tus favoritos</h2>${favs.length ? '<a class="btn ghost sm" href="#/favoritos">Ver todos</a>' : ''}</div>
        ${favs.length ? favs.map((b) => `<a class="list-row" href="#/empresa/${b.id}">${catIcon(b.category, 'sm')}<div class="t"><b>${esc(b.name)}</b><span>${esc(catById(b.category).name)} · ${esc(b.city)}</span></div>${openPill(b)}</a>`).join('')
        : `<p class="muted" style="margin:0">Guarda negocios con el corazón para tenerlos a mano.</p>`}
      </section>
    </div>`);
  $('#qNew').addEventListener('click', newChatSheet);
  cache.appts = appts;
  $('.dash').addEventListener('click', onApptAction);
}

// ── Empresa: resumen de todo lo que tiene
async function viewBusinessHome() {
  if (!me.business_id) return mount(emptyState(I.store, 'Tu cuenta no tiene empresa asociada'));
  const [b, convs, appts, reviews] = await Promise.all([store.getBusiness(me.business_id), store.listConversations(), store.listAppointments(), store.listReviews(me.business_id)]);
  cache.appts = appts;
  const now = new Date();
  const toReply = convs.filter((c) => c.last_sender_id && c.last_sender_id === c.client_id).sort((a, c) => a.last_message_at.localeCompare(c.last_message_at));
  const active = (a) => ['pendiente', 'confirmada'].includes(a.status);
  const today = appts.filter((a) => sameDay(new Date(a.starts_at), now) && active(a));
  const pending = appts.filter((a) => a.status === 'pendiente' && new Date(a.starts_at) > now);
  const week = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return { d, n: appts.filter((a) => active(a) && sameDay(new Date(a.starts_at), d)).length }; });
  const maxW = Math.max(1, ...week.map((w) => w.n));
  const weekTotal = week.reduce((s, w) => s + w.n, 0);
  const checks = [['Descripción', !!b.description], ['Dirección', !!b.address], ['Teléfono de contacto', !!b.phone], ['Servicios y precios', (b.services || []).length > 0], ['Respuesta automática', !!b.auto_reply], ['Palabras clave', !!b.tags]];
  const pct = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);
  const nextToday = today.find((a) => new Date(a.starts_at) > now);

  mount(`
    ${demoBanner()}
    <div class="page-head reveal">
      <div><div class="kicker">${fmtLong.format(now)}</div><h1 class="title-lg">${greeting()}, ${esc(b.name)}</h1>
      <p class="muted" style="margin:6px 0 0">${toReply.length || today.length || pending.length ? `Tienes ${[toReply.length && `${toReply.length} chat${toReply.length > 1 ? 's' : ''} por responder`, today.length && `${today.length} visita${today.length > 1 ? 's' : ''} hoy`, pending.length && `${pending.length} cita${pending.length > 1 ? 's' : ''} por confirmar`].filter(Boolean).join(', ')}.` : 'Todo al día. Buen trabajo.'}</p></div>
      <a class="btn" href="#/empresa/${b.id}">${I.eye} Ver mi página pública</a>
    </div>
    <div class="dash">
      <a class="kpi glass liquid span-3 reveal ${toReply.length ? 'alert' : ''}" href="#/mensajes"><span class="icon-chip">${I.chat}</span><b>${toReply.length}</b><span>Chats por responder</span></a>
      <a class="kpi glass liquid span-3 reveal" href="#/citas"><span class="icon-chip">${I.cal}</span><b>${today.length}</b><span>Visitas hoy${nextToday ? ` · próxima ${hhmm(new Date(nextToday.starts_at))}` : ''}</span></a>
      <a class="kpi glass liquid span-3 reveal ${pending.length ? 'alert' : ''}" href="#/citas"><span class="icon-chip">${I.clock}</span><b>${pending.length}</b><span>Citas por confirmar</span></a>
      <div class="kpi glass liquid span-3 reveal"><span class="icon-chip">${I.star}</span><b>${b.rating_count ? (+b.rating_avg).toFixed(1) : '—'}</b><span>${b.rating_count} reseña${b.rating_count === 1 ? '' : 's'}</span></div>

      <section class="glass panel span-7 reveal">
        <div class="panel-head"><h2>Visitas de hoy</h2><a class="btn ghost sm" href="#/citas">Agenda</a></div>
        ${today.length ? `<div class="timeline">${today.map((a) => { const d = new Date(a.starts_at); return `<div class="tl-item ${d < now ? 'past' : ''}"><span class="tl-time">${hhmm(d)}</span><span class="tl-dot"></span>
          <div class="t" style="min-width:0"><b style="display:block">${esc(a.client?.name || 'Cliente')}</b><span class="subtle">${esc(a.service || 'Cita')}${a.note ? ` · “${esc(a.note)}”` : ''}</span></div>
          <div class="row" style="gap:6px"><span class="pill ${a.status}">${a.status}</span>${a.conversation_id ? `<a class="btn sm icon" href="#/mensajes/${a.conversation_id}" title="Abrir chat">${I.chat}</a>` : ''}</div></div>`; }).join('')}</div>`
        : emptyState(I.cal, 'Hoy no hay visitas', 'Las citas confirmadas de hoy aparecerán aquí.')}
      </section>

      <section class="glass panel span-5 reveal">
        <div class="panel-head"><h2>Chats por responder</h2><a class="btn ghost sm" href="#/mensajes">Mensajes</a></div>
        ${toReply.length ? toReply.slice(0, 5).map((c) => `<div class="list-row"><div class="avatar" style="border-radius:12px">${esc(initials(c.client?.name))}</div>
          <div class="t"><b>${esc(c.client?.name || 'Cliente')}</b><span>${esc(c.last_message)}</span></div>
          <div style="display:grid;justify-items:end;gap:6px"><span class="subtle">${waitingFor(c.last_message_at)}</span><a class="btn sm primary" href="#/mensajes/${c.id}">Responder</a></div></div>`).join('')
        : emptyState(I.check, 'Nada pendiente', 'Has respondido a todos tus clientes.')}
      </section>

      <section class="glass panel span-7 reveal">
        <div class="panel-head"><h2>Citas por confirmar</h2></div>
        <div id="pendList">${pending.length ? pending.map((a) => `<div class="list-row"><div class="date-tile" style="width:52px;height:56px"><small>${fmtMonth.format(new Date(a.starts_at))}</small><b style="font-size:20px">${new Date(a.starts_at).getDate()}</b></div>
          <div class="t"><b>${esc(a.client?.name || 'Cliente')} · ${hhmm(new Date(a.starts_at))}</b><span>${esc(a.service || 'Cita')}${a.note ? ` · “${esc(a.note)}”` : ''}</span></div>
          <div class="row" style="gap:6px"><button class="btn sm primary" data-appt="${a.id}" data-st="confirmada">Confirmar</button><button class="btn sm danger" data-appt="${a.id}" data-st="rechazada">Rechazar</button></div></div>`).join('')
        : emptyState(I.check, 'Sin citas pendientes', 'Las nuevas solicitudes aparecerán aquí.')}</div>
      </section>

      <section class="glass panel span-5 reveal">
        <div class="panel-head"><h2>Próximos 7 días</h2><span class="subtle">${weekTotal} cita${weekTotal === 1 ? '' : 's'}</span></div>
        <div class="bars">${week.map((w) => `<div class="bar"><i class="${w.n ? '' : 'zero'}" style="height:${w.n ? Math.max(8, (w.n / maxW) * 100) : 4}%"></i><em>${w.n || ''}</em><small>${sameDay(w.d, now) ? 'hoy' : fmtDay.format(w.d).replace('.', '')}</small></div>`).join('')}</div>
      </section>

      <section class="glass panel span-7 reveal">
        <div class="panel-head"><h2>Últimas reseñas</h2>${b.rating_count ? `<span class="muted">${(+b.rating_avg).toFixed(1)} ${stars(+b.rating_avg)}</span>` : ''}</div>
        ${reviews.length ? reviews.slice(0, 3).map((r) => `<div class="review"><div class="row" style="justify-content:space-between"><b style="font-size:15px">${esc(r.author_name || 'Cliente')}</b><span class="subtle">${fmtShort.format(new Date(r.created_at))}</span></div>${stars(r.rating)}<p class="muted" style="margin:4px 0 0">${esc(r.comment)}</p></div>`).join('')
        : `<p class="muted" style="margin:0">Aún no tienes reseñas. Tus clientes podrán valorarte tras su visita.</p>`}
      </section>

      <section class="glass panel span-5 reveal">
        <div class="panel-head"><h2>Tu perfil</h2><a class="btn ghost sm" href="#/panel">${I.edit} Editar</a></div>
        <div class="row" style="gap:18px;align-items:flex-start"><div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
        <div class="grow">${checks.map(([t, ok]) => `<div class="check ${ok ? 'done' : ''}"><i></i>${t}</div>`).join('')}</div></div>
      </section>
    </div>`);
  $('#pendList').addEventListener('click', onApptAction);
}

// ── Administrador
let adminTab = 'empresas';
async function viewAdmin() {
  const [stats, users] = await Promise.all([store.adminStats(), store.listUsers()]);
  await refreshBusinesses();
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  mount(`
    ${demoBanner()}
    <div class="page-head reveal"><div><div class="kicker">Administración</div><h1 class="title-lg">Panel de control</h1>
      <p class="muted" style="margin:6px 0 0">Gestiona las empresas y las cuentas de la plataforma.</p></div></div>
    <div class="dash">
      <div class="kpi glass liquid span-3 reveal"><span class="icon-chip">${I.users}</span><b>${stats.clients}</b><span>Clientes</span></div>
      <div class="kpi glass liquid span-3 reveal"><span class="icon-chip">${I.store}</span><b>${stats.businesses}</b><span>Empresas</span></div>
      <div class="kpi glass liquid span-3 reveal"><span class="icon-chip">${I.chat}</span><b>${stats.conversations}</b><span>Conversaciones · ${stats.messages} mensajes</span></div>
      <div class="kpi glass liquid span-3 reveal"><span class="icon-chip">${I.cal}</span><b>${stats.appointments}</b><span>Citas totales</span></div>
      <section class="glass panel span-12 reveal">
        <div class="panel-head" style="flex-wrap:wrap">
          ${segmented('adTab', [['empresas', `Empresas (${cache.businesses.length})`], ['usuarios', `Cuentas (${users.length})`]], adminTab)}
          <div class="searchbar" style="margin:0;padding:0 12px;border-radius:12px;background:var(--fill);max-width:320px;flex:1;box-shadow:none">${I.search}<input id="adQ" placeholder="Buscar por nombre, email, ciudad…" style="height:38px;font-size:15px"></div>
        </div>
        <div class="table" id="adList"></div>
      </section>
    </div>`);

  const draw = () => {
    const q = normalize($('#adQ').value);
    if (adminTab === 'empresas') {
      const list = cache.businesses.filter((b) => !q || normalize([b.name, b.city, b.email, catById(b.category).name, userById[b.owner_id]?.email].join(' ')).includes(q));
      $('#adList').innerHTML = `<div class="trow head"><span>Empresa</span><span>Ciudad</span><span>Propietario</span><span>Valoración</span><span></span></div>` +
        (list.length ? list.map((b) => `<div class="trow"><div class="cell-main">${catIcon(b.category, 'sm')}<div style="min-width:0"><b>${esc(b.name)}</b><span>${esc(catById(b.category).name)}</span></div></div>
          <span class="ell">${esc(b.city || '—')}</span><span class="ell">${esc(userById[b.owner_id]?.email || 'Sin propietario')}</span>
          <span>${b.rating_count ? `${(+b.rating_avg).toFixed(1)} · ${b.rating_count}` : '—'}</span>
          <div class="actions-cell"><a class="btn sm icon" href="#/empresa/${b.id}" title="Ver">${I.eye}</a><button class="btn sm icon danger" data-del-biz="${b.id}" title="Eliminar empresa">${I.trash}</button></div></div>`).join('')
        : emptyState(I.search, 'Sin resultados'));
    } else {
      const list = users.filter((u) => !q || normalize([u.name, u.email, u.phone, u.role].join(' ')).includes(q));
      const bizOf = (u) => cache.businesses.find((b) => b.owner_id === u.id)?.name;
      $('#adList').innerHTML = `<div class="trow users head"><span>Cuenta</span><span>Teléfono</span><span>Empresa</span><span>Tipo</span><span></span></div>` +
        (list.length ? list.map((u) => `<div class="trow users"><div class="cell-main"><div class="avatar">${esc(initials(u.name))}</div><div style="min-width:0"><b>${esc(u.name || 'Sin nombre')}</b><span>${esc(u.email || '')}</span></div></div>
          <span class="ell">${esc(u.phone || '—')}</span><span class="ell">${esc(bizOf(u) || '—')}</span>
          <span><span class="role-pill ${u.role}">${{ cliente: 'Cliente', empresa: 'Empresa', admin: 'Admin' }[u.role]}</span></span>
          <div class="actions-cell">${u.role === 'admin' ? '<span class="subtle">Protegida</span>' : `<button class="btn sm icon danger" data-del-user="${u.id}" title="Eliminar cuenta">${I.trash}</button>`}</div></div>`).join('')
        : emptyState(I.search, 'Sin resultados'));
    }
  };
  bindSegmented($('#adTab'), (v) => { adminTab = v; draw(); });
  $('#adQ').addEventListener('input', debounce(draw, 120));
  $('#adList').addEventListener('click', async (e) => {
    const bBtn = e.target.closest('[data-del-biz]'); const uBtn = e.target.closest('[data-del-user]');
    try {
      if (bBtn) {
        const b = cache.businesses.find((x) => x.id === bBtn.dataset.delBiz);
        if (!(await confirmSheet({ title: `¿Eliminar ${esc(b.name)}?`, text: 'Se borrarán también sus chats, citas y reseñas. Esta acción no se puede deshacer.', ok: 'Eliminar empresa' }))) return;
        await store.deleteBusiness(b.id); toast(`${b.name} eliminada`); viewAdmin();
      }
      if (uBtn) {
        const u = userById[uBtn.dataset.delUser];
        const extra = u.role === 'empresa' ? ' También se eliminará su empresa con sus chats, citas y reseñas.' : ' Se eliminarán sus chats, citas y reseñas.';
        if (!(await confirmSheet({ title: `¿Eliminar la cuenta de ${esc(u.name || u.email)}?`, text: `${esc(u.email)}.${extra} Esta acción no se puede deshacer.`, ok: 'Eliminar cuenta' }))) return;
        await store.deleteUser(u.id); toast('Cuenta eliminada'); viewAdmin();
      }
    } catch (err) { toast(err.message); }
  });
  draw();
}

// ═════════════════════════ EXPLORAR (pestaña propia) ═════════════════════════
const STOP = new Set(['una', 'uno', 'unos', 'para', 'con', 'que', 'por', 'los', 'las', 'del', 'mis', 'necesito', 'necesita', 'quiero', 'tengo', 'busco', 'esta', 'este', 'muy', 'hoy', 'manana', 'donde', 'como', 'algo', 'alguien', 'duele', 'mucho']);
function searchBusinesses({ q = '', cat = '', city = '', sort = 'rel' }) {
  const nq = normalize(q);
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
  const count = (id) => cache.businesses.filter((b) => b.category === id).length;
  mount(`
    <div class="explore-head">
      <div><h1 class="title-lg reveal">Explorar</h1><p class="muted reveal" style="margin:6px 0 0">Describe lo que necesitas con tus palabras o elige una categoría.</p></div>
      <form class="searchbar glass liquid reveal" id="exForm" role="search" style="margin:0;max-width:none">${I.search}<input id="exQ" value="${esc(st.q)}" placeholder="${esc(SEARCH_EXAMPLES[0])}" autocomplete="off"><button class="btn primary">Buscar</button></form>
      <div class="toolbar reveal">
        <select class="input" id="exCity" style="width:auto;min-width:180px"><option value="">Todas las ciudades</option>${cities.map((c) => `<option ${c === st.city ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        ${segmented('exSort', [['rel', 'Relevancia'], ['rating', 'Valoración'], ['open', 'Abiertos'], ['az', 'A–Z']], st.sort)}
      </div>
    </div>
    <section id="exCatsGrid" class="section" style="margin-top:30px">
      <div class="section-head"><h2 class="title-md">Categorías</h2></div>
      <div class="cat-grid">${CATEGORIES.filter((c) => c.id !== 'otros').map((c) => `<button class="cat glass liquid reveal" data-cat="${c.id}" style="border:1px solid var(--glass-border);color:inherit;text-align:left">${catIcon(c)}<b>${c.name}</b><small>${count(c.id)} negocio${count(c.id) === 1 ? '' : 's'}</small></button>`).join('')}</div>
    </section>
    <div id="exFilters" class="hidden" style="margin-top:22px">
      <div class="chips" id="exCats"><button class="chip ${!st.cat ? 'on' : ''}" data-cat="">Todas</button>${CATEGORIES.map((c) => `<button class="chip ${st.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${catIcon(c)} ${c.name}</button>`).join('')}</div>
      <div id="exNeed"></div>
      <div class="grid grid-3" id="exResults" style="margin-top:8px"></div>
    </div>`);

  let ex = 0; const input = $('#exQ');
  const timer = setInterval(() => { if (!document.body.contains(input)) return clearInterval(timer); if (document.activeElement !== input && !input.value) input.placeholder = SEARCH_EXAMPLES[(++ex) % SEARCH_EXAMPLES.length]; }, 3200);

  const draw = () => {
    const browsing = st.q || st.cat || st.city || st.sort !== 'rel' || params.has('todo');
    $('#exCatsGrid').classList.toggle('hidden', !!browsing);
    $('#exFilters').classList.toggle('hidden', !browsing);
    if (!browsing) return;
    const { list, inferred } = searchBusinesses(st);
    const c = inferred && catById(inferred);
    $('#exNeed').innerHTML = c ? `<div class="need-pill" style="margin-bottom:14px">${catIcon(c, '', '--s:24px;background:none;box-shadow:none')} Parece que buscas: <b>${c.name}</b> <button class="btn ghost sm" id="needOnly" style="height:26px">Ver solo ${c.name.toLowerCase()}</button></div>` : '';
    $('#needOnly')?.addEventListener('click', () => { st.cat = inferred; st.q = ''; input.value = ''; syncChips(); sync(); draw(); });
    $('#exResults').innerHTML = list.length ? list.map(bizCard).join('') : `<div style="grid-column:1/-1">${emptyState(I.search, 'Sin resultados', 'Prueba con otras palabras o quita filtros.')}</div>`;
    observeReveals();
  };
  const sync = () => {
    const p = new URLSearchParams(); Object.entries(st).forEach(([k, v]) => v && !(k === 'sort' && v === 'rel') && p.set(k, v));
    const h = `#/explorar${p.toString() ? '?' + p : ''}`; history.replaceState(null, '', h); currentRoute = h;
  };
  const syncChips = () => $$('#exCats .chip').forEach((x) => x.classList.toggle('on', x.dataset.cat === st.cat));
  input.addEventListener('input', debounce((e) => { st.q = e.target.value; sync(); draw(); }, 180));
  $('#exForm').addEventListener('submit', (e) => { e.preventDefault(); if (!input.value) { input.value = input.placeholder; st.q = input.value; sync(); draw(); } input.blur(); });
  $('#exCity').addEventListener('change', (e) => { st.city = e.target.value; sync(); draw(); });
  bindSegmented($('#exSort'), (v) => { st.sort = v; sync(); draw(); });
  $('#exCats').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; st.cat = b.dataset.cat; syncChips(); sync(); draw(); });
  $('#exCatsGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; st.cat = b.dataset.cat; syncChips(); sync(); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  draw();
}

// ───────────────────────── FAVORITOS ─────────────────────────
async function viewFavorites() {
  if (needsAuth('#/favoritos') || notFor('empresa', 'admin')) return;
  await refreshFavs();
  const list = cache.businesses.filter((b) => cache.favs.has(b.id));
  mount(`<h1 class="title-lg reveal" style="margin-bottom:20px">Favoritos</h1>
    <div class="grid grid-3">${list.length ? list.map(bizCard).join('') : `<div class="glass" style="grid-column:1/-1">${emptyState(I.heart, 'Aún no tienes favoritos', 'Pulsa el corazón en cualquier negocio para guardarlo aquí.', '<a class="btn primary" href="#/explorar">Explorar</a>')}</div>`}</div>`);
}

// ───────────────────────── PÁGINA DE EMPRESA ─────────────────────────
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
  if (me.role !== 'cliente') return toast('Inicia sesión como cliente para escribir a un negocio');
  const id = await store.openConversation({ businessId, clientId: me.id });
  go(`#/mensajes/${id}`);
}

async function viewBusiness(parts) {
  const b = await store.getBusiness(parts[1]);
  if (!b) return mount(emptyState(I.store, 'Empresa no encontrada', '', '<a class="btn" href="#/explorar">Volver a explorar</a>'));
  await refreshFavs();
  const reviews = await store.listReviews(b.id);
  const c = catById(b.category);
  const isOwner = me && me.id === b.owner_id;
  const isClient = me?.role === 'cliente';
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const digits = (b.phone || '').replace(/\D/g, '');
  const days = [];
  for (let i = 0; i < 21 && days.length < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); if (((b.hours || {})[d.getDay()] || []).length) days.push(d); }
  const myReview = me && reviews.find((r) => r.client_id === me.id);
  const fav = cache.favs.has(b.id);

  mount(`
    <a class="btn ghost sm reveal" href="javascript:history.back()" style="margin-bottom:12px">${I.back} Volver</a>
    <section class="biz-hero glass liquid reveal">
      ${catIcon(c, 'xl')}
      <div class="grow">
        <div class="row wrap" style="gap:8px"><span class="pill closed" style="background:var(--accent-soft);color:var(--accent)">${c.name}</span>${openPill(b)}</div>
        <h1 style="margin-top:10px">${esc(b.name)}</h1>
        <p class="muted" style="margin:6px 0 0">${esc([b.address, b.city].filter(Boolean).join(', ') || 'Ubicación no indicada')}
          · ${b.rating_count ? `${stars(+b.rating_avg)} ${(+b.rating_avg).toFixed(1)} (${b.rating_count})` : 'Sin reseñas aún'}</p>
        <div class="actions">
          ${isOwner ? `<a class="btn primary" href="#/panel">${I.edit} Editar mi empresa</a>` : me?.role === 'admin' ? `<button class="btn danger-fill" id="bDel">${I.trash} Eliminar empresa</button>` : `
          <button class="btn primary" id="bChat">${I.chat} Enviar mensaje</button>
          <a class="btn" href="#reserva" id="bBook">${I.cal} Pedir cita</a>`}
          ${b.phone ? `<a class="btn" href="tel:${esc(b.phone)}">${I.phone} Llamar</a><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${digits}">${I.wa} WhatsApp</a>` : ''}
          ${b.email ? `<a class="btn" href="mailto:${esc(b.email)}">${I.mail} Email</a>` : ''}
          ${!me || isClient ? `<button class="btn icon heart-btn ${fav ? 'on' : ''}" id="bFav" aria-label="Guardar en favoritos" title="Guardar en favoritos">${I.heart}</button>` : ''}
        </div>
      </div>
    </section>

    <div class="two-col">
      <div class="stack">
        <section class="glass card reveal"><h2 class="title-md">Sobre nosotros</h2><p class="muted" style="margin:10px 0 0;white-space:pre-wrap">${esc(b.description || 'Esta empresa aún no ha añadido una descripción.')}</p></section>

        ${isOwner || me?.role === 'admin' ? '' : `<section class="glass card reveal" id="reserva">
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

        <section class="glass card reveal" id="resenas">
          <div class="row" style="justify-content:space-between"><h2 class="title-md">Reseñas</h2>${b.rating_count ? `<span class="muted">${(+b.rating_avg).toFixed(1)} ${stars(+b.rating_avg)}</span>` : ''}</div>
          ${isClient ? `
            <form id="revForm" class="stack" style="margin:14px 0 6px;padding:14px;border-radius:16px;background:var(--fill)">
              <div class="row" style="justify-content:space-between"><b style="font-size:15px">${myReview ? 'Editar tu reseña' : 'Deja tu reseña'}</b>
              <div class="star-input" id="starIn">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" class="${n <= (myReview?.rating || 0) ? 'on' : ''}" aria-label="${n} estrellas"><svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor">${STAR}</svg></button>`).join('')}</div></div>
              <textarea class="input" name="comment" placeholder="¿Qué tal la experiencia?" style="min-height:70px">${esc(myReview?.comment || '')}</textarea>
              <div class="row" style="justify-content:flex-end"><button class="btn primary sm">Publicar</button></div>
            </form>` : ''}
          <div>${reviews.length ? reviews.map((r) => `<div class="review"><div class="row" style="justify-content:space-between"><b style="font-size:15px">${esc(r.author_name || 'Cliente')}</b><span class="subtle">${fmtShort.format(new Date(r.created_at))}</span></div>${stars(r.rating)}<p class="muted" style="margin:4px 0 0">${esc(r.comment)}</p></div>`).join('') : '<p class="muted">Todavía no hay reseñas.</p>'}</div>
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
  $('#bDel')?.addEventListener('click', async () => {
    if (!(await confirmSheet({ title: `¿Eliminar ${esc(b.name)}?`, text: 'Se borrarán también sus chats, citas y reseñas. Esta acción no se puede deshacer.', ok: 'Eliminar empresa' }))) return;
    await store.deleteBusiness(b.id); await refreshBusinesses(); toast(`${b.name} eliminada`); go('#/');
  });
  $('#bFav')?.addEventListener('click', async (e) => {
    if (needsAuth(`#/empresa/${b.id}`)) return;
    const btn = e.currentTarget; const on = await store.toggleFavorite(b.id); btn.classList.toggle('on', on);
    on ? cache.favs.add(b.id) : cache.favs.delete(b.id); toast(on ? 'Guardado en favoritos' : 'Quitado de favoritos');
  });
  if (location.hash.includes('?resenas')) setTimeout(() => $('#resenas')?.scrollIntoView({ behavior: 'smooth' }), 300);

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
      if (me.role !== 'cliente') return toast('Inicia sesión como cliente para reservar');
      confirmBtn.disabled = true;
      try {
        const a = await store.createAppointment({ businessId: b.id, startsAt: chosen, service: $('#svc')?.value || '', note: $('#note').value.trim() });
        toast('Cita solicitada. Te avisaremos en el chat');
        go(`#/mensajes/${a.conversation_id}`);
      } catch (err) { toast(err.message); drawSlots(); }
    });
    drawSlots();
  }

  if ($('#revForm')) {
    let rating = myReview?.rating || 0;
    $('#starIn').addEventListener('click', (e) => { const s = e.target.closest('button'); if (!s) return; rating = +s.dataset.n; $$('#starIn button').forEach((x) => x.classList.toggle('on', +x.dataset.n <= rating)); });
    $('#revForm').addEventListener('submit', async (e) => {
      e.preventDefault(); if (!rating) return toast('Elige de 1 a 5 estrellas');
      await store.addReview(b.id, rating, new FormData(e.target).get('comment').trim());
      await refreshBusinesses(); toast('Gracias por tu reseña'); await viewBusiness(parts); observeReveals();
    });
  }
}

// ───────────────────────── MENSAJES ─────────────────────────
function otherSide(c) {
  if (me.id === c.client_id) {
    const cat = catById(c.business?.category);
    return { name: c.business?.name || 'Empresa', sub: cat.name, icon: catIcon(cat, '', '--s:46px'), phone: c.business?.phone, email: c.business?.email };
  }
  return { name: c.client?.name || 'Cliente', sub: c.client?.phone || c.client?.email || '', icon: `<div class="avatar" style="width:46px;height:46px;border-radius:14px">${esc(initials(c.client?.name))}</div>`, phone: c.client?.phone, email: c.client?.email };
}

async function viewChats(parts) {
  if (needsAuth(location.hash) || notFor('admin')) return;
  mount(`
    <div class="chat-shell">
      <aside class="chat-list glass">
        <div class="chat-list-head">
          <div class="row" style="justify-content:space-between"><h1 class="title-md" style="font-size:26px">Mensajes</h1><button class="btn sm primary" id="newChat">${I.plus} Nuevo</button></div>
          <div class="searchbar" style="margin:0;padding:0 12px;border-radius:12px;background:var(--fill);max-width:none;box-shadow:none">${I.search}<input id="chatFilter" placeholder="Buscar conversación" style="height:38px;font-size:15px"></div>
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

async function drawChatList() {
  const list = $('#chatItems'); if (!list) return;
  const convs = await store.listConversations();
  const f = normalize($('#chatFilter')?.value || '');
  const items = convs.filter((c) => !f || normalize(otherSide(c).name).includes(f));
  list.innerHTML = items.length ? items.map((c) => {
    const o = otherSide(c);
    return `<a class="chat-item ${c.id === chatState.convId ? 'active' : ''} ${c.unread ? 'unread' : ''}" href="#/mensajes/${c.id}">${o.icon}
      <div class="meta"><b>${esc(o.name)}</b><span>${esc(c.last_message || 'Nueva conversación')}</span></div>
      <div style="display:grid;justify-items:end;gap:6px"><time>${relTime(c.last_message_at)}</time>${c.unread ? '<span class="dot"></span>' : ''}</div></a>`;
  }).join('') : emptyState(I.chat, f ? 'Sin coincidencias' : 'Sin conversaciones', f ? '' : 'Pulsa “Nuevo” para escribir con un teléfono o email.');
}

function newChatSheet() {
  if (needsAuth('#/mensajes')) return;
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
  if (!convId) { th.innerHTML = `<div class="thread-empty">${emptyState(I.chat, 'Tus conversaciones', 'Elige un chat o empieza uno nuevo por teléfono o email.')}</div>`; return; }
  const c = await store.getConversation(convId);
  if (!c) { th.innerHTML = `<div class="thread-empty"><p>Conversación no disponible.</p></div>`; return; }
  const o = otherSide(c);
  const isClient = me.id === c.client_id;
  th.innerHTML = `
    <header class="thread-head">
      <a class="btn ghost sm icon" href="#/mensajes" aria-label="Volver">${I.back}</a>
      ${o.icon.replace('--s:46px', '--s:42px')}
      <div class="grow" style="min-width:0"><b style="display:block">${esc(o.name)}</b><span class="subtle">${esc(o.sub)}</span></div>
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
  if (!msgs.length) html = `<div class="thread-empty">${emptyState(I.chat, 'Escribe tu primer mensaje', 'El historial queda guardado en tu cuenta.')}</div>`;
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
    <div class="row" style="justify-content:space-between"><span class="subtle row" style="gap:6px">${I.cal} Solicitud de cita</span><span class="pill ${a.status}">${a.status}</span></div>
    <div class="when">${fmtLong.format(new Date(a.starts_at))}</div>
    <div class="muted" style="font-size:15px">${hhmm(new Date(a.starts_at))}${a.service ? ' · ' + esc(a.service) : ''}</div>
    ${a.note ? `<div class="subtle" style="margin-top:6px">“${esc(a.note)}”</div>` : ''}
    ${isBiz && a.status === 'pendiente' && future ? `<div class="row" style="margin-top:12px"><button class="btn sm primary grow" data-appt="${a.id}" data-st="confirmada">Confirmar</button><button class="btn sm grow danger" data-appt="${a.id}" data-st="rechazada">Rechazar</button></div>` : ''}
    ${!isBiz && a.status === 'confirmada' && future ? `<div class="row" style="margin-top:12px"><button class="btn sm grow" data-ics="${a.id}">${I.download} Añadir al calendario</button></div>` : ''}
  </div>`;
}

async function onApptAction(e) {
  const ics = e.target.closest('[data-ics]');
  if (ics) { const a = cache.appts.find((x) => x.id === ics.dataset.ics); if (a) downloadICS(a); return; }
  const b = e.target.closest('[data-appt]'); if (!b) return;
  const a = cache.appts.find((x) => x.id === b.dataset.appt); const st = b.dataset.st;
  if (st === 'cancelada' && !(await confirmSheet({ title: '¿Cancelar esta cita?', text: `${esc(a.business?.name || '')} · ${fmtWhen(a.starts_at)}`, ok: 'Cancelar cita' }))) return;
  const when = fmtWhen(a.starts_at);
  const text = { confirmada: `Cita confirmada para el ${when}`, rechazada: `La hora del ${when} no está disponible. Escríbenos y buscamos otra.`, cancelada: `Cita del ${when} cancelada por el cliente` }[st];
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

// ───────────────────────── CITAS / AGENDA ─────────────────────────
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
      <div class="subtle">${isBiz ? esc(a.client?.phone || a.client?.email || '') : esc(cat.name)}${a.service ? ' · ' + esc(a.service) : ''}${a.note ? ` · “${esc(a.note)}”` : ''}</div>
    </div>
    <div class="row wrap" style="gap:8px">
      ${a.conversation_id ? `<a class="btn sm" href="#/mensajes/${a.conversation_id}">${I.chat} Chat</a>` : ''}
      ${isBiz && a.status === 'pendiente' && future ? `<button class="btn sm primary" data-appt="${a.id}" data-st="confirmada">Confirmar</button><button class="btn sm danger" data-appt="${a.id}" data-st="rechazada">Rechazar</button>` : ''}
      ${!isBiz && ['pendiente', 'confirmada'].includes(a.status) && future ? `<button class="btn sm" data-ics="${a.id}">${I.download} Calendario</button><button class="btn sm danger" data-appt="${a.id}" data-st="cancelada">Cancelar</button>` : ''}
    </div></div>`;
}

async function viewAppointments() {
  if (needsAuth('#/citas') || notFor('admin')) return;
  cache.appts = await store.listAppointments();
  mount(`
    <div class="section-head reveal" style="flex-wrap:wrap"><h1 class="title-lg">${me.role === 'empresa' ? 'Agenda' : 'Mis citas'}</h1>${segmented('apTab', [['next', 'Próximas'], ['past', 'Historial']], apptTab)}</div>
    <div class="stack" id="apList"></div>`);
  const draw = () => {
    const now = new Date();
    const list = cache.appts.filter((a) => (apptTab === 'next' ? new Date(a.starts_at) >= now && !['cancelada', 'rechazada'].includes(a.status) : new Date(a.starts_at) < now || ['cancelada', 'rechazada'].includes(a.status)));
    if (apptTab === 'past') list.reverse();
    $('#apList').innerHTML = list.length ? list.map(apptCard).join('') : `<div class="glass">${emptyState(I.cal, apptTab === 'next' ? 'No hay citas próximas' : 'Sin historial', me.role === 'cliente' && apptTab === 'next' ? 'Encuentra un negocio y reserva en segundos.' : '', me.role === 'cliente' && apptTab === 'next' ? '<a class="btn primary" href="#/explorar">Explorar</a>' : '')}</div>`;
    observeReveals();
  };
  bindSegmented($('#apTab'), (v) => { apptTab = v; draw(); });
  $('#apList').addEventListener('click', onApptAction);
  draw();
}

// ───────────────────────── MI EMPRESA (edición) ─────────────────────────
async function viewPanel() {
  if (needsAuth('#/panel')) return;
  if (me.role !== 'empresa' || !me.business_id) return mount(emptyState(I.store, 'Solo para cuentas de empresa', '', '<a class="btn primary" href="#/registro?rol=empresa">Registrar una empresa</a>'));
  const b = await store.getBusiness(me.business_id);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const svcText = (b.services || []).map((s) => (s.price ? `${s.name} | ${s.price}` : s.name)).join('\n');
  mount(`
    <div class="page-head reveal"><div><div class="kicker">Mi empresa</div><h1 class="title-lg">Perfil y horario</h1><p class="muted" style="margin:6px 0 0">Lo que ven tus clientes en tu página.</p></div><a class="btn" href="#/empresa/${b.id}">${I.eye} Ver página pública</a></div>
    <form class="stack" id="bizForm">
      <section class="glass panel reveal stack">
        <div class="panel-head" style="margin:0"><h2>Datos básicos</h2></div>
        <div class="form-grid">
          <label class="field"><span>Nombre</span><input class="input" name="name" value="${esc(b.name)}" required></label>
          <label class="field"><span>Categoría</span><select class="input" name="category">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === b.category ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
          <label class="field"><span>Ciudad</span><input class="input" name="city" value="${esc(b.city)}"></label>
          <label class="field"><span>Dirección</span><input class="input" name="address" value="${esc(b.address)}"></label>
          <label class="field"><span>Teléfono de contacto</span><input class="input" name="phone" type="tel" value="${esc(b.phone)}"></label>
          <label class="field"><span>Email de contacto</span><input class="input" name="email" type="email" value="${esc(b.email)}"></label>
        </div>
        <label class="field"><span>Descripción</span><textarea class="input" name="description" placeholder="Cuéntales a tus clientes qué hacéis y qué os hace especiales">${esc(b.description)}</textarea></label>
        <label class="field"><span>Palabras clave (ayudan al buscador)</span><input class="input" name="tags" value="${esc(b.tags || '')}" placeholder="urgencias, vegano, a domicilio…"></label>
      </section>
      <section class="glass panel reveal stack">
        <div class="panel-head" style="margin:0"><h2>Servicios y mensajes</h2></div>
        <div class="form-grid">
          <label class="field"><span>Servicios (uno por línea: Nombre | Precio)</span><textarea class="input" name="services" placeholder="Corte de pelo | 15 €">${esc(svcText)}</textarea></label>
          <label class="field"><span>Respuesta automática al primer mensaje</span><textarea class="input" name="auto_reply" placeholder="¡Hola! Gracias por escribirnos. Te respondemos en breve.">${esc(b.auto_reply || '')}</textarea></label>
        </div>
      </section>
      <section class="glass panel reveal">
        <div class="panel-head"><h2>Horario de citas</h2><label class="row" style="gap:8px"><span class="muted" style="font-size:14px">Duración</span><select class="input" name="slot_minutes" style="width:auto;height:40px">${[15, 20, 30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${+b.slot_minutes === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></label></div>
        <div class="hours-edit">${order.map((d) => { const r = (b.hours || {})[d] || []; return `<div class="hrow" data-day="${d}">
          <label class="row" style="gap:10px"><span class="switch"><input type="checkbox" ${r.length ? 'checked' : ''}><span></span></span><b style="font-size:15px">${DAYS[d]}</b></label>
          <div class="ranges">
            <input type="time" value="${r[0]?.[0] || '09:00'}"> – <input type="time" value="${r[0]?.[1] || '14:00'}">
            <span class="subtle" style="margin:0 4px">y</span>
            <input type="time" value="${r[1]?.[0] || ''}"> – <input type="time" value="${r[1]?.[1] || ''}">
          </div></div>`; }).join('')}</div>
      </section>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" style="height:48px;padding:0 26px">Guardar cambios</button></div>
    </form>`);
  $('#bizForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const hours = {};
    $$('.hrow', e.target).forEach((row) => {
      const d = row.dataset.day; const on = $('input[type=checkbox]', row).checked; const t = $$('input[type=time]', row).map((x) => x.value);
      hours[d] = on ? [[t[0], t[1]], [t[2], t[3]]].filter(([x, y]) => x && y) : [];
    });
    const services = f.get('services').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, price = ''] = l.split('|').map((x) => x.trim()); return { name, price }; });
    const patch = { name: f.get('name').trim(), category: f.get('category'), city: f.get('city').trim(), address: f.get('address').trim(), phone: f.get('phone').trim(), email: f.get('email').trim(), description: f.get('description').trim(), tags: f.get('tags').trim(), auto_reply: f.get('auto_reply').trim(), slot_minutes: +f.get('slot_minutes'), services, hours };
    try { await store.saveBusiness(patch); await refreshBusinesses(); toast('Cambios guardados'); } catch (err) { toast(err.message); }
  });
}

// ───────────────────────── ACCESO ─────────────────────────
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
  </div></div>`);
  bindSegmented($('#roleSeg'), (v) => { role = v; $('#lRole').textContent = v; $('#toReg').href = `#/registro?rol=${v}`; });
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target); $('#lErr').textContent = ''; $('#lBtn').disabled = true;
    try {
      const u = await store.signIn(f.get('id'), f.get('pw'));
      if (u.role !== 'admin' && u.role !== role) { await store.signOut(); throw new Error(`Esta cuenta es de ${u.role}. Selecciona “Soy ${u.role}” arriba.`); }
      me = u; await refreshFavs(); toast(`Hola, ${me.name.split(' ')[0]}`);
      go(params.get('next') || '#/');
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
          <label class="field"><span>Categoría</span><select class="input" name="category">${CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
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
      await refreshBusinesses(); toast('Cuenta creada');
      go(role === 'empresa' ? '#/panel' : '#/');
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
  const key = parseHash().parts[0] || '';
  if (key === 'mensajes' && $('.chat-shell')) { await drawChatList(); if (chatState.convId) await drawMessages(); }
  else if ((key === 'citas' || (key === '' && me?.role === 'empresa')) && ['appointments', 'messages', 'conversations'].includes(evt.table) && !$('#sheet-root').innerHTML) route();
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
  setInterval(() => { if (me && !document.hidden) onData({ table: 'poll' }); }, 20000);
}
boot();

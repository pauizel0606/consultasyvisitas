// Capa de datos: Supabase (sincronizado entre dispositivos) o local (modo demo).
// Ambas implementaciones exponen exactamente la misma interfaz.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { SEED_BUSINESSES, DEFAULT_HOURS } from './data.js';

export const isEmail = (v = '') => /\S+@\S+\.\S+/.test(v.trim());
export const normPhone = (v = '') => {
  const t = v.trim();
  return (t.startsWith('+') ? '+' : '') + t.replace(/\D/g, '');
};
const last9 = (v = '') => v.replace(/\D/g, '').slice(-9);
const samePhone = (a, b) => last9(a).length >= 6 && last9(a) === last9(b);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const nowISO = () => new Date().toISOString();

export async function createStore() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
      return new SupabaseStore(createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    } catch (e) {
      console.error('No se pudo cargar Supabase, usando modo demo', e);
    }
  }
  return new LocalStore();
}

// ═════════════════════════════════════════════════════════════
// MODO DEMO (localStorage)
// ═════════════════════════════════════════════════════════════
const KEY = 'cyv_db_v2';
export const DEMO_ADMIN = { email: 'admin@consultasyvisitas.com', password: 'CyV-Admin-2026' };
const SKEY = 'cyv_session_v1';

function seedDb() {
  const db = { users: [], businesses: [], conversations: [], messages: [], appointments: [], reviews: [], favorites: [] };
  const authors = ['Lucía M.', 'Javier R.', 'Carmen T.', 'Pablo G.', 'Marta S.', 'Diego A.'];
  const comments = ['Muy amables y puntuales. Repetiré.', 'Todo perfecto, me atendieron enseguida.', 'Trato cercano y precios justos.', 'Ambiente muy tranquilo, se nota el cuidado.', 'Me resolvieron la duda por chat en minutos.'];
  SEED_BUSINESSES.forEach((s, i) => {
    const ownerId = uid();
    const email = `empresa${i + 1}@demo.com`;
    const phone = `+3460000${String(100 + i).padStart(4, '0')}`;
    db.users.push({ id: ownerId, role: 'empresa', name: s.name, email, phone, password: 'demo1234' });
    const bid = uid();
    db.businesses.push({
      id: bid, owner_id: ownerId, name: s.name, category: s.category, description: s.description,
      address: s.address, city: s.city, phone, email, services: s.services, hours: s.hours || DEFAULT_HOURS,
      slot_minutes: s.slot, tags: s.tags, auto_reply: `¡Hola! Gracias por escribir a ${s.name}. Te respondemos en breve.`,
      rating_avg: 0, rating_count: 0, created_at: nowISO(),
    });
    const n = 1 + (i % 3);
    for (let k = 0; k < n; k++) {
      db.reviews.push({ id: uid(), business_id: bid, client_id: 'seed-' + k, author_name: authors[(i + k) % authors.length], rating: k === 2 ? 4 : 5, comment: comments[(i + k) % comments.length], created_at: new Date(Date.now() - (k + 1) * 864e5 * (i + 2)).toISOString() });
    }
  });
  db.users.push({ id: uid(), role: 'admin', name: 'Administrador', email: DEMO_ADMIN.email, phone: '', password: DEMO_ADMIN.password });
  db.users.push({ id: uid(), role: 'cliente', name: 'Cliente Demo', email: 'cliente@demo.com', phone: '+34611222333', password: 'demo1234' });
  recalcRatings(db);
  return db;
}

function recalcRatings(db, onlyId) {
  for (const b of db.businesses) {
    if (onlyId && b.id !== onlyId) continue;
    const rs = db.reviews.filter((r) => r.business_id === b.id);
    b.rating_count = rs.length;
    b.rating_avg = rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0;
  }
}

class LocalStore {
  mode = 'local';
  constructor() {
    this.listeners = new Set();
    this.db = this._load();
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) { this.db = this._load(); this._emit({ table: '*' }); }
      if (e.key === SKEY) this._emit({ table: 'auth' });
    });
  }
  _load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (!d) { d = seedDb(); localStorage.setItem(KEY, JSON.stringify(d)); }
    if (!d.users.some((u) => u.role === 'admin')) {
      d.users.push({ id: uid(), role: 'admin', name: 'Administrador', email: DEMO_ADMIN.email, phone: '', password: DEMO_ADMIN.password });
      localStorage.setItem(KEY, JSON.stringify(d));
    }
    return d;
  }
  _save() { localStorage.setItem(KEY, JSON.stringify(this.db)); }
  _emit(evt) { this.listeners.forEach((cb) => cb(evt)); }
  _commit(evt) { this._save(); this._emit(evt); }
  _me() {
    const id = localStorage.getItem(SKEY);
    return this.db.users.find((u) => u.id === id) || null;
  }
  _profile(u) {
    if (!u) return null;
    const { password, ...p } = u;
    if (p.role === 'empresa') p.business_id = this.db.businesses.find((b) => b.owner_id === u.id)?.id || null;
    return p;
  }
  subscribe(cb) { this.listeners.add(cb); return () => this.listeners.delete(cb); }

  // ── Auth
  async user() { return this._profile(this._me()); }
  async signUp({ role, name, email, phone, password, business }) {
    email = email.trim().toLowerCase();
    if (this.db.users.some((u) => u.email === email)) throw new Error('Ya existe una cuenta con ese email');
    if (phone && this.db.users.some((u) => samePhone(u.phone, phone))) throw new Error('Ya existe una cuenta con ese teléfono');
    const u = { id: uid(), role, name, email, phone: normPhone(phone), password };
    this.db.users.push(u);
    if (role === 'empresa') {
      this.db.businesses.push({
        id: uid(), owner_id: u.id, name: business?.name || name, category: business?.category || 'otros', city: business?.city || '',
        description: '', address: '', phone: u.phone, email, services: [], hours: DEFAULT_HOURS, slot_minutes: 30, tags: '',
        auto_reply: '', rating_avg: 0, rating_count: 0, created_at: nowISO(),
      });
    }
    localStorage.setItem(SKEY, u.id);
    this._commit({ table: 'auth' });
    return this._profile(u);
  }
  async signIn(identifier, password) {
    const id = identifier.trim().toLowerCase();
    const u = this.db.users.find((u) => (isEmail(id) ? u.email === id : samePhone(u.phone, id)));
    if (!u || u.password !== password) throw new Error('Email/teléfono o contraseña incorrectos');
    localStorage.setItem(SKEY, u.id);
    this._emit({ table: 'auth' });
    return this._profile(u);
  }
  async signOut() { localStorage.removeItem(SKEY); this._emit({ table: 'auth' }); }
  async updateProfile(patch) {
    const u = this._me(); Object.assign(u, patch, patch.phone ? { phone: normPhone(patch.phone) } : {});
    this._commit({ table: 'profiles' }); return this._profile(u);
  }

  // ── Empresas
  async listBusinesses() { return structuredClone(this.db.businesses); }
  async getBusiness(id) { return structuredClone(this.db.businesses.find((b) => b.id === id) || null); }
  async saveBusiness(patch) {
    const me = this._me(); const b = this.db.businesses.find((b) => b.owner_id === me?.id);
    if (!b) throw new Error('No tienes empresa');
    Object.assign(b, patch); this._commit({ table: 'businesses' }); return structuredClone(b);
  }
  async findContact(value) {
    const me = this._me(); const v = value.trim().toLowerCase();
    const match = (x) => (isEmail(v) ? x.email?.toLowerCase() === v : samePhone(x.phone, v));
    if (me?.role === 'empresa') {
      const c = this.db.users.find((u) => u.role === 'cliente' && match(u));
      return c ? { type: 'client', profile: this._profile(c) } : null;
    }
    const b = this.db.businesses.find(match);
    return b ? { type: 'business', business: structuredClone(b) } : null;
  }

  // ── Conversaciones
  _convView(c, me) {
    const business = this.db.businesses.find((b) => b.id === c.business_id);
    const client = this._profile(this.db.users.find((u) => u.id === c.client_id));
    const isClient = c.client_id === me.id;
    const myRead = isClient ? c.client_last_read : c.business_last_read;
    return { ...c, business: structuredClone(business), client, unread: c.last_sender_id && c.last_sender_id !== me.id && c.last_message_at > myRead };
  }
  async listConversations() {
    const me = this._me(); if (!me) return [];
    return this.db.conversations
      .filter((c) => c.client_id === me.id || this.db.businesses.find((b) => b.id === c.business_id)?.owner_id === me.id)
      .map((c) => this._convView(c, me))
      .sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''));
  }
  async getConversation(id) {
    const me = this._me(); const c = this.db.conversations.find((c) => c.id === id);
    return c && me ? this._convView(c, me) : null;
  }
  async openConversation({ businessId, clientId }) {
    let c = this.db.conversations.find((c) => c.business_id === businessId && c.client_id === clientId);
    if (!c) {
      const t = nowISO();
      c = { id: uid(), business_id: businessId, client_id: clientId, last_message: '', last_message_at: t, last_sender_id: null, client_last_read: t, business_last_read: t, created_at: t };
      this.db.conversations.push(c); this._commit({ table: 'conversations' });
    }
    return c.id;
  }
  async listMessages(convId) {
    return this.db.messages.filter((m) => m.conversation_id === convId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  _insertMessage(c, sender_id, body, kind = 'text', meta = null) {
    const m = { id: uid(), conversation_id: c.id, sender_id, body, kind, meta, created_at: nowISO() };
    this.db.messages.push(m);
    Object.assign(c, { last_message: body.slice(0, 140), last_message_at: m.created_at, last_sender_id: sender_id });
    return m;
  }
  async sendMessage(convId, body, kind = 'text', meta = null) {
    const me = this._me(); const c = this.db.conversations.find((c) => c.id === convId);
    const first = !this.db.messages.some((m) => m.conversation_id === convId);
    const m = this._insertMessage(c, me.id, body, kind, meta);
    if (me.id === c.client_id) c.client_last_read = m.created_at; else c.business_last_read = m.created_at;
    this._commit({ table: 'messages', row: m });
    const b = this.db.businesses.find((b) => b.id === c.business_id);
    if (first && kind === 'text' && me.id === c.client_id && b?.auto_reply) {
      setTimeout(() => { this._insertMessage(c, b.owner_id, b.auto_reply, 'auto'); this._commit({ table: 'messages' }); }, 1200);
    }
    return m;
  }
  async markRead(convId) {
    const me = this._me(); const c = this.db.conversations.find((c) => c.id === convId); if (!c || !me) return;
    const t = nowISO();
    if (c.client_id === me.id) c.client_last_read = t; else c.business_last_read = t;
    this._save();
  }

  // ── Citas
  async listAppointments() {
    const me = this._me(); if (!me) return [];
    return this.db.appointments
      .filter((a) => a.client_id === me.id || this.db.businesses.find((b) => b.id === a.business_id)?.owner_id === me.id)
      .map((a) => ({ ...a, business: structuredClone(this.db.businesses.find((b) => b.id === a.business_id)), client: this._profile(this.db.users.find((u) => u.id === a.client_id)) }))
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }
  async bookedSlots(businessId, dayStart, dayEnd) {
    return this.db.appointments
      .filter((a) => a.business_id === businessId && ['pendiente', 'confirmada'].includes(a.status) && a.starts_at >= dayStart && a.starts_at < dayEnd)
      .map((a) => a.starts_at);
  }
  async createAppointment({ businessId, startsAt, service, note }) {
    const me = this._me();
    if (this.db.appointments.some((a) => a.business_id === businessId && a.starts_at === startsAt && a.status !== 'rechazada' && a.status !== 'cancelada')) throw new Error('Esa hora acaba de ocuparse, elige otra');
    const convId = await this.openConversation({ businessId, clientId: me.id });
    const a = { id: uid(), business_id: businessId, client_id: me.id, conversation_id: convId, starts_at: startsAt, service, note, status: 'pendiente', created_at: nowISO() };
    this.db.appointments.push(a);
    await this.sendMessage(convId, `Solicitud de cita${service ? ': ' + service : ''}`, 'appointment', { appointment_id: a.id });
    return a;
  }
  async setAppointmentStatus(id, status, text) {
    const a = this.db.appointments.find((a) => a.id === id); a.status = status;
    const c = this.db.conversations.find((c) => c.id === a.conversation_id);
    if (c) { this._insertMessage(c, this._me().id, text, 'system', { appointment_id: id }); }
    this._commit({ table: 'appointments' });
  }

  // ── Administración
  _requireAdmin() { const me = this._me(); if (me?.role !== 'admin') throw new Error('Solo para administradores'); return me; }
  async listUsers() {
    this._requireAdmin();
    return this.db.users.map((u) => this._profile(u)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  _purgeBusiness(id) {
    const convs = new Set(this.db.conversations.filter((c) => c.business_id === id).map((c) => c.id));
    this.db.messages = this.db.messages.filter((m) => !convs.has(m.conversation_id));
    this.db.conversations = this.db.conversations.filter((c) => c.business_id !== id);
    this.db.appointments = this.db.appointments.filter((a) => a.business_id !== id);
    this.db.reviews = this.db.reviews.filter((r) => r.business_id !== id);
    this.db.favorites = this.db.favorites.filter((f) => f.business_id !== id);
    this.db.businesses = this.db.businesses.filter((b) => b.id !== id);
  }
  async deleteBusiness(id) { this._requireAdmin(); this._purgeBusiness(id); this._commit({ table: 'businesses' }); }
  async deleteUser(id) {
    const me = this._requireAdmin();
    if (id === me.id) throw new Error('No puedes eliminar tu propia cuenta de administrador');
    this.db.businesses.filter((b) => b.owner_id === id).forEach((b) => this._purgeBusiness(b.id));
    const convs = new Set(this.db.conversations.filter((c) => c.client_id === id).map((c) => c.id));
    this.db.messages = this.db.messages.filter((m) => !convs.has(m.conversation_id));
    this.db.conversations = this.db.conversations.filter((c) => c.client_id !== id);
    this.db.appointments = this.db.appointments.filter((a) => a.client_id !== id);
    this.db.reviews = this.db.reviews.filter((r) => r.client_id !== id);
    this.db.favorites = this.db.favorites.filter((f) => f.user_id !== id);
    this.db.users = this.db.users.filter((u) => u.id !== id);
    recalcRatings(this.db);
    this._commit({ table: 'businesses' });
  }
  async adminStats() {
    this._requireAdmin();
    const d = this.db;
    return { clients: d.users.filter((u) => u.role === 'cliente').length, companies: d.users.filter((u) => u.role === 'empresa').length, businesses: d.businesses.length, conversations: d.conversations.length, messages: d.messages.length, appointments: d.appointments.length };
  }

  // ── Reseñas y favoritos
  async listReviews(businessId) {
    return this.db.reviews.filter((r) => r.business_id === businessId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  async addReview(businessId, rating, comment) {
    const me = this._me();
    const ex = this.db.reviews.find((r) => r.business_id === businessId && r.client_id === me.id);
    if (ex) Object.assign(ex, { rating, comment, created_at: nowISO() });
    else this.db.reviews.push({ id: uid(), business_id: businessId, client_id: me.id, author_name: me.name, rating, comment, created_at: nowISO() });
    recalcRatings(this.db, businessId); this._commit({ table: 'reviews' });
  }
  async favorites() { const me = this._me(); return this.db.favorites.filter((f) => f.user_id === me?.id).map((f) => f.business_id); }
  async toggleFavorite(businessId) {
    const me = this._me(); const i = this.db.favorites.findIndex((f) => f.user_id === me.id && f.business_id === businessId);
    if (i >= 0) this.db.favorites.splice(i, 1); else this.db.favorites.push({ user_id: me.id, business_id: businessId });
    this._save(); return i < 0;
  }
}

// ═════════════════════════════════════════════════════════════
// SUPABASE (sincronización real entre dispositivos)
// ═════════════════════════════════════════════════════════════
class SupabaseStore {
  mode = 'cloud';
  constructor(sb) {
    this.sb = sb; this.listeners = new Set(); this.me = undefined;
    sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') { this.me = undefined; this._emit({ table: 'auth' }); }
    });
    const ch = sb.channel('cyv-live');
    for (const table of ['messages', 'conversations', 'appointments']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, (p) => this._emit({ table, row: p.new }));
    }
    ch.subscribe();
  }
  _emit(e) { this.listeners.forEach((cb) => cb(e)); }
  subscribe(cb) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  _ok({ data, error }) { if (error) throw new Error(error.message); return data; }

  async user() {
    if (this.me !== undefined) return this.me;
    const { data: { session } } = await this.sb.auth.getSession();
    if (!session) return (this.me = null);
    let p = (await this.sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()).data;
    if (!p) return (this.me = null);
    if (p.role === 'empresa') p.business_id = (await this.sb.from('businesses').select('id').eq('owner_id', p.id).maybeSingle()).data?.id || null;
    return (this.me = p);
  }
  async signUp({ role, name, email, phone, password, business }) {
    const { data, error } = await this.sb.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { role, name, phone: normPhone(phone), business_name: business?.name || '', category: business?.category || 'otros', city: business?.city || '' } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Te hemos enviado un email para confirmar la cuenta. Ábrelo y después inicia sesión.');
    this.me = undefined; return this.user();
  }
  async signIn(identifier, password) {
    let email = identifier.trim().toLowerCase();
    if (!isEmail(email)) {
      email = this._ok(await this.sb.rpc('email_for_phone', { p: identifier }));
      if (!email) throw new Error('No hay ninguna cuenta con ese teléfono');
    }
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email/teléfono o contraseña incorrectos');
    this.me = undefined; return this.user();
  }
  async signOut() { await this.sb.auth.signOut(); this.me = null; }
  async updateProfile(patch) {
    const me = await this.user(); if (patch.phone) patch.phone = normPhone(patch.phone);
    this._ok(await this.sb.from('profiles').update(patch).eq('id', me.id));
    this.me = undefined; return this.user();
  }

  async listBusinesses() { return this._ok(await this.sb.from('businesses').select('*').order('name')); }
  async getBusiness(id) { return this._ok(await this.sb.from('businesses').select('*').eq('id', id).maybeSingle()); }
  async saveBusiness(patch) {
    const me = await this.user();
    return this._ok(await this.sb.from('businesses').update(patch).eq('owner_id', me.id).select().single());
  }
  async findContact(value) {
    const me = await this.user(); const v = value.trim().toLowerCase();
    if (me?.role === 'empresa') {
      let q = this.sb.from('profiles').select('id,name,email,phone,role').eq('role', 'cliente');
      q = isEmail(v) ? q.ilike('email', v) : q.ilike('phone', `%${last9(v)}`);
      const p = this._ok(await q.limit(1)).at(0);
      return p ? { type: 'client', profile: p } : null;
    }
    let q = this.sb.from('businesses').select('*');
    q = isEmail(v) ? q.ilike('email', v) : q.ilike('phone', `%${last9(v)}`);
    const b = this._ok(await q.limit(1)).at(0);
    return b ? { type: 'business', business: b } : null;
  }

  _conv(c, me) {
    const myRead = c.client_id === me.id ? c.client_last_read : c.business_last_read;
    return { ...c, unread: c.last_sender_id && c.last_sender_id !== me.id && new Date(c.last_message_at) > new Date(myRead) };
  }
  async listConversations() {
    const me = await this.user(); if (!me) return [];
    const rows = this._ok(await this.sb.from('conversations').select('*, business:businesses(*), client:profiles!conversations_client_id_fkey(id,name,email,phone)').order('last_message_at', { ascending: false }));
    return rows.map((c) => this._conv(c, me));
  }
  async getConversation(id) {
    const me = await this.user();
    const c = this._ok(await this.sb.from('conversations').select('*, business:businesses(*), client:profiles!conversations_client_id_fkey(id,name,email,phone)').eq('id', id).maybeSingle());
    return c ? this._conv(c, me) : null;
  }
  async openConversation({ businessId, clientId }) {
    const find = async () => this._ok(await this.sb.from('conversations').select('id').eq('business_id', businessId).eq('client_id', clientId).maybeSingle());
    const ex = await find(); if (ex) return ex.id;
    const { data, error } = await this.sb.from('conversations').insert({ business_id: businessId, client_id: clientId }).select('id').single();
    if (error) { const again = await find(); if (again) return again.id; throw new Error(error.message); }
    return data.id;
  }
  async listMessages(convId) { return this._ok(await this.sb.from('messages').select('*').eq('conversation_id', convId).order('created_at')); }
  async sendMessage(convId, body, kind = 'text', meta = null) {
    const me = await this.user();
    const m = this._ok(await this.sb.from('messages').insert({ conversation_id: convId, sender_id: me.id, body, kind, meta }).select().single());
    this.markRead(convId); return m;
  }
  async markRead(convId) {
    const me = await this.user(); const c = await this.getConversation(convId); if (!c) return;
    const field = c.client_id === me.id ? 'client_last_read' : 'business_last_read';
    await this.sb.from('conversations').update({ [field]: new Date().toISOString() }).eq('id', convId);
  }

  async listAppointments() {
    const me = await this.user(); if (!me) return [];
    return this._ok(await this.sb.from('appointments').select('*, business:businesses(*), client:profiles!appointments_client_id_fkey(id,name,email,phone)').order('starts_at'));
  }
  async bookedSlots(businessId, dayStart, dayEnd) {
    const rows = this._ok(await this.sb.rpc('booked_slots', { bid: businessId, day_start: dayStart, day_end: dayEnd }));
    return rows.map((r) => new Date(typeof r === 'string' ? r : r.booked_slots).toISOString());
  }
  async createAppointment({ businessId, startsAt, service, note }) {
    const me = await this.user();
    const taken = await this.bookedSlots(businessId, startsAt, new Date(new Date(startsAt).getTime() + 1000).toISOString());
    if (taken.length) throw new Error('Esa hora acaba de ocuparse, elige otra');
    const convId = await this.openConversation({ businessId, clientId: me.id });
    const a = this._ok(await this.sb.from('appointments').insert({ business_id: businessId, client_id: me.id, conversation_id: convId, starts_at: startsAt, service, note }).select().single());
    await this.sendMessage(convId, `Solicitud de cita${service ? ': ' + service : ''}`, 'appointment', { appointment_id: a.id });
    return a;
  }
  async setAppointmentStatus(id, status, text) {
    const a = this._ok(await this.sb.from('appointments').update({ status }).eq('id', id).select().single());
    if (a.conversation_id) await this.sendMessage(a.conversation_id, text, 'system', { appointment_id: id });
  }

  async listUsers() { return this._ok(await this.sb.from('profiles').select('*').order('name')); }
  async deleteBusiness(id) { this._ok(await this.sb.from('businesses').delete().eq('id', id)); }
  async deleteUser(id) { this._ok(await this.sb.rpc('admin_delete_user', { uid: id })); }
  async adminStats() { return this._ok(await this.sb.rpc('admin_stats')); }

  async listReviews(businessId) { return this._ok(await this.sb.from('reviews').select('*').eq('business_id', businessId).order('created_at', { ascending: false })); }
  async addReview(businessId, rating, comment) {
    const me = await this.user();
    this._ok(await this.sb.from('reviews').upsert({ business_id: businessId, client_id: me.id, author_name: me.name, rating, comment, created_at: new Date().toISOString() }, { onConflict: 'business_id,client_id' }));
  }
  async favorites() { const me = await this.user(); if (!me) return []; return this._ok(await this.sb.from('favorites').select('business_id')).map((f) => f.business_id); }
  async toggleFavorite(businessId) {
    const me = await this.user();
    const ex = this._ok(await this.sb.from('favorites').select('business_id').eq('business_id', businessId).maybeSingle());
    if (ex) { this._ok(await this.sb.from('favorites').delete().eq('user_id', me.id).eq('business_id', businessId)); return false; }
    this._ok(await this.sb.from('favorites').insert({ user_id: me.id, business_id: businessId })); return true;
  }
}

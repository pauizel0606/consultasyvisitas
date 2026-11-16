// ─────────────────────────────────────────────────────────────
// Configuración del backend (Supabase)
//
// Si dejas estos valores vacíos, la app funciona en MODO DEMO:
// los datos se guardan en este navegador (persisten al cerrar la web).
//
// Para que los chats y citas se sincronicen entre dispositivos con la
// misma cuenta, crea un proyecto gratis en https://supabase.com,
// ejecuta supabase/schema.sql y pega aquí la URL y la "anon public key"
// (Project Settings → API). La anon key es pública por diseño: la
// seguridad la dan las políticas RLS del schema.
// ─────────────────────────────────────────────────────────────
export const SUPABASE_URL = 'https://oixqybyjrvdoeiljqhmf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9peHF5YnlqcnZkb2VpbGpxaG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MjA5OTMsImV4cCI6MjExMDM5Njk5M30.bnOY6zduENzso2cTgVcj9J3nuqhgsk2XaJsClto7F0Y';

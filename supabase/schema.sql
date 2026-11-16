-- ════════════════════════════════════════════════════════════════
-- Consultas & Visitas · esquema de Supabase
-- Pega todo este archivo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Tablas ──────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'cliente',
  name text not null default '',
  email text,
  phone text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  category text not null default 'otros',
  description text not null default '',
  address text not null default '',
  city text not null default '',
  phone text not null default '',
  email text not null default '',
  tags text not null default '',
  services jsonb not null default '[]',
  hours jsonb not null default '{"0":[],"1":[["09:00","14:00"],["16:00","20:00"]],"2":[["09:00","14:00"],["16:00","20:00"]],"3":[["09:00","14:00"],["16:00","20:00"]],"4":[["09:00","14:00"],["16:00","20:00"]],"5":[["09:00","14:00"],["16:00","20:00"]],"6":[["10:00","14:00"]]}',
  slot_minutes int not null default 30,
  auto_reply text not null default '',
  rating_avg numeric not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists businesses_category_idx on public.businesses(category);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  last_sender_id uuid,
  client_last_read timestamptz not null default now(),
  business_last_read timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (client_id, business_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid,
  body text not null default '',
  kind text not null default 'text' check (kind in ('text', 'auto', 'appointment', 'system')),
  meta jsonb,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  starts_at timestamptz not null,
  service text not null default '',
  note text not null default '',
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmada', 'rechazada', 'cancelada')),
  created_at timestamptz not null default now()
);
create index if not exists appointments_biz_idx on public.appointments(business_id, starts_at);
-- Impide dos reservas activas a la misma hora en la misma empresa
create unique index if not exists appointments_no_double
  on public.appointments(business_id, starts_at) where status in ('pendiente', 'confirmada');

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default '',
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (business_id, client_id)
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  primary key (user_id, business_id)
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('cliente', 'empresa', 'admin'));

-- Ajustes privados: el email que será administrador al registrarse
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  admin_email text not null default ''
);
alter table public.app_settings enable row level security; -- sin políticas: nadie la lee desde la web
insert into public.app_settings (id, admin_email) values (1, '') on conflict (id) do nothing;

-- ── Funciones auxiliares ────────────────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Administración: eliminar una cuenta (y su empresa, chats, citas...)
create or replace function public.admin_delete_user(uid uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Solo para administradores'; end if;
  if uid = auth.uid() then raise exception 'No puedes eliminar tu propia cuenta'; end if;
  delete from public.businesses where owner_id = uid;
  delete from auth.users where id = uid;
end $$;

create or replace function public.admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo para administradores'; end if;
  return json_build_object(
    'clients', (select count(*) from profiles where role = 'cliente'),
    'companies', (select count(*) from profiles where role = 'empresa'),
    'businesses', (select count(*) from businesses),
    'conversations', (select count(*) from conversations),
    'messages', (select count(*) from messages),
    'appointments', (select count(*) from appointments));
end $$;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_stats() to authenticated;

create or replace function public.is_owner(bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from businesses where id = bid and owner_id = auth.uid());
$$;

create or replace function public.is_participant(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from conversations c join businesses b on b.id = c.business_id
    where c.id = cid and (c.client_id = auth.uid() or b.owner_id = auth.uid())
  );
$$;

-- Permite iniciar sesión con el teléfono
create or replace function public.email_for_phone(p text) returns text
language sql stable security definer set search_path = public as $$
  select email from profiles
  where length(regexp_replace(p, '\D', '', 'g')) >= 9
    and right(regexp_replace(phone, '\D', '', 'g'), 9) = right(regexp_replace(p, '\D', '', 'g'), 9)
  limit 1;
$$;

-- Horas ocupadas (sin exponer datos del cliente)
create or replace function public.booked_slots(bid uuid, day_start timestamptz, day_end timestamptz)
returns setof timestamptz
language sql stable security definer set search_path = public as $$
  select starts_at from appointments
  where business_id = bid and status in ('pendiente', 'confirmada')
    and starts_at >= day_start and starts_at < day_end;
$$;

grant execute on function public.email_for_phone(text) to anon, authenticated;
grant execute on function public.booked_slots(uuid, timestamptz, timestamptz) to anon, authenticated;

-- ── Triggers ────────────────────────────────────────────────────
-- Crea perfil (y empresa) al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into profiles (id, role, name, email, phone)
  values (new.id, case when lower(new.email) = (select lower(admin_email) from app_settings where id = 1) and (select lower(admin_email) from app_settings where id = 1) <> '' then 'admin' when m->>'role' = 'empresa' then 'empresa' else 'cliente' end, coalesce(m->>'name', ''), new.email, coalesce(m->>'phone', ''));
  if m->>'role' = 'empresa' and lower(new.email) <> (select lower(admin_email) from app_settings where id = 1) then
    insert into businesses (owner_id, name, category, city, phone, email)
    values (new.id, coalesce(nullif(m->>'business_name', ''), m->>'name', 'Mi empresa'), coalesce(nullif(m->>'category', ''), 'otros'),
            coalesce(m->>'city', ''), coalesce(m->>'phone', ''), new.email);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Actualiza el resumen del chat y envía la respuesta automática
create or replace function public.on_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c conversations; b businesses;
begin
  select * into c from conversations where id = new.conversation_id;
  update conversations set last_message = left(new.body, 140), last_message_at = new.created_at, last_sender_id = new.sender_id
  where id = c.id;
  if new.sender_id = c.client_id and new.kind = 'text'
     and not exists (select 1 from messages where conversation_id = c.id and id <> new.id) then
    select * into b from businesses where id = c.business_id;
    if coalesce(b.auto_reply, '') <> '' then
      insert into messages (conversation_id, sender_id, body, kind) values (c.id, b.owner_id, b.auto_reply, 'auto');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages for each row execute function public.on_message();

-- Recalcula la valoración media
create or replace function public.on_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare bid uuid := coalesce(new.business_id, old.business_id);
begin
  update businesses set
    rating_avg = coalesce((select avg(rating) from reviews where business_id = bid), 0),
    rating_count = (select count(*) from reviews where business_id = bid)
  where id = bid;
  return null;
end $$;
drop trigger if exists reviews_after_change on public.reviews;
create trigger reviews_after_change after insert or update or delete on public.reviews for each row execute function public.on_review();

-- ── Seguridad (Row Level Security) ──────────────────────────────
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "businesses read" on public.businesses;
create policy "businesses read" on public.businesses for select using (true);
drop policy if exists "businesses update own" on public.businesses;
create policy "businesses update own" on public.businesses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "businesses delete" on public.businesses;
create policy "businesses delete" on public.businesses for delete to authenticated using (public.is_admin() or owner_id = auth.uid());

drop policy if exists "conversations read" on public.conversations;
create policy "conversations read" on public.conversations for select to authenticated using (client_id = auth.uid() or public.is_owner(business_id));
drop policy if exists "conversations insert" on public.conversations;
create policy "conversations insert" on public.conversations for insert to authenticated with check (client_id = auth.uid() or public.is_owner(business_id));
drop policy if exists "conversations update" on public.conversations;
create policy "conversations update" on public.conversations for update to authenticated using (client_id = auth.uid() or public.is_owner(business_id));

drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select to authenticated using (public.is_participant(conversation_id));
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert to authenticated with check (public.is_participant(conversation_id) and sender_id = auth.uid());

drop policy if exists "appointments read" on public.appointments;
create policy "appointments read" on public.appointments for select to authenticated using (client_id = auth.uid() or public.is_owner(business_id));
drop policy if exists "appointments insert" on public.appointments;
create policy "appointments insert" on public.appointments for insert to authenticated with check (client_id = auth.uid());
drop policy if exists "appointments update" on public.appointments;
create policy "appointments update" on public.appointments for update to authenticated using (client_id = auth.uid() or public.is_owner(business_id));

drop policy if exists "reviews read" on public.reviews;
create policy "reviews read" on public.reviews for select using (true);
drop policy if exists "reviews write own" on public.reviews;
create policy "reviews write own" on public.reviews for insert to authenticated with check (client_id = auth.uid());
drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews for update to authenticated using (client_id = auth.uid());
drop policy if exists "reviews delete own" on public.reviews;
create policy "reviews delete own" on public.reviews for delete to authenticated using (client_id = auth.uid());

drop policy if exists "favorites own" on public.favorites;
create policy "favorites own" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Tiempo real ─────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.messages, public.conversations, public.appointments;
exception when duplicate_object then null; end $$;

-- ── Crear el administrador ──────────────────────────────────────
-- Cambia el email por el tuyo y ejecuta esta línea. Después regístrate en la
-- web con ese email: la cuenta se creará directamente como administrador.
-- (Si ya estás registrado: update public.profiles set role = 'admin' where email = 'tu-email';)
update public.app_settings set admin_email = 'CAMBIA-ESTO@ejemplo.com' where id = 1;

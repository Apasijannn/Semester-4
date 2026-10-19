-- ============================================================================
-- Migration: AI Planner — Karsa (Fase 1)
-- Tabel    : routines, chat_logs, reminders, pending_actions
-- Referensi: PRD_Karsa_AI_Planner.md §7 (Struktur Data)
--
-- Catatan:
-- - Semua tabel memiliki user_id → auth.users, dengan RLS "user hanya bisa
--   akses row miliknya sendiri" (auth.uid() = user_id).
-- - pending_actions.target_id sengaja TANPA FK keras ke reminders, karena
--   pada action_type = 'create' reminder-nya memang belum ada (PRD §7.4).
-- - Urutan pembuatan: routines & chat_logs dulu, karena reminders dan
--   pending_actions ber-FK ke keduanya.
-- - Siap dijalankan langsung di Supabase SQL Editor (idempotent-safe untuk
--   enum via DO block; gen_random_uuid() sudah built-in di Postgres Supabase).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------

do $$
begin
  -- kategori reminder (selaras dengan modul Karsa: health, finance, task)
  if not exists (select 1 from pg_type where typname = 'reminder_category') then
    create type reminder_category as enum ('health', 'finance', 'task', 'general');
  end if;

  -- pola pengulangan reminder
  if not exists (select 1 from pg_type where typname = 'recurrence_type') then
    create type recurrence_type as enum ('none', 'daily', 'weekly', 'monthly');
  end if;

  -- status siklus hidup reminder
  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type reminder_status as enum ('active', 'done', 'skipped', 'cancelled');
  end if;

  -- peran pengirim pesan pada chat log
  if not exists (select 1 from pg_type where typname = 'chat_role') then
    create type chat_role as enum ('user', 'assistant');
  end if;

  -- jenis aksi yang menunggu konfirmasi user
  if not exists (select 1 from pg_type where typname = 'pending_action_type') then
    create type pending_action_type as enum ('create', 'update', 'delete');
  end if;

  -- status alur konfirmasi (PRD §9)
  if not exists (select 1 from pg_type where typname = 'pending_action_status') then
    create type pending_action_status as enum
      ('waiting_confirmation', 'confirmed', 'rejected', 'expired');
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. FUNGSI TRIGGER updated_at
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. TABEL: routines
-- ----------------------------------------------------------------------------
-- Ringkasan:
--   Pengelompokan reminder ke dalam rutinitas bernama (mis. "Rutinitas Pagi").
--   Kolom: id (uuid PK), user_id (FK auth.users), name (wajib),
--          description (opsional), created_at.
--   Relasi: 1 routine -> banyak reminders (via reminders.routine_id).
-- ----------------------------------------------------------------------------

create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_routines_user_id
  on public.routines (user_id);

-- ----------------------------------------------------------------------------
-- 4. TABEL: chat_logs
-- ----------------------------------------------------------------------------
-- Ringkasan:
--   Riwayat percakapan user <-> AI, sekaligus audit trail hasil extraction.
--   Kolom: id (uuid PK), user_id (FK auth.users), role (user/assistant),
--          message (wajib), extracted_json (hasil mentah Prompt A, opsional),
--          created_at.
--   Dipakai oleh: reminders.source_chat_log_id & pending_actions.chat_log_id.
-- ----------------------------------------------------------------------------

create table if not exists public.chat_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  role           chat_role not null,
  message        text not null,
  extracted_json jsonb,
  created_at     timestamptz not null default now()
);

-- query utama: ambil riwayat chat per user, urut terbaru
create index if not exists idx_chat_logs_user_id_created_at
  on public.chat_logs (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 5. TABEL: reminders
-- ----------------------------------------------------------------------------
-- Ringkasan:
--   Reminder terjadwal milik user, hasil eksekusi pending_actions yang sudah
--   confirmed (PRD §7.1). Mendukung recurring via recurrence +
--   recurrence_days (mis. [1,3,5] = Senin/Rabu/Jumat untuk weekly).
--   Kolom: id (uuid PK), user_id (FK auth.users), title (wajib),
--          description (opsional), category, scheduled_at,
--          recurrence (default 'none'), recurrence_days (opsional),
--          status (default 'active'), routine_id (opsional, FK routines),
--          source_chat_log_id (opsional, FK chat_logs — audit asal pembuatan),
--          created_at, updated_at (auto-update via trigger).
-- ----------------------------------------------------------------------------

create table if not exists public.reminders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  title              text not null,
  description        text,
  category           reminder_category not null default 'general',
  scheduled_at       timestamptz,
  recurrence         recurrence_type not null default 'none',
  recurrence_days    int[],
  status             reminder_status not null default 'active',
  routine_id         uuid references public.routines (id) on delete set null,
  source_chat_log_id uuid references public.chat_logs (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- query utama: daftar reminder user per status (mis. list reminder aktif)
create index if not exists idx_reminders_user_id_status
  on public.reminders (user_id, status);

-- untuk tampilan list/tabel terjadwal per user (PRD §11)
create index if not exists idx_reminders_user_id_scheduled_at
  on public.reminders (user_id, scheduled_at);

-- untuk grouping reminder per routine
create index if not exists idx_reminders_routine_id
  on public.reminders (routine_id)
  where routine_id is not null;

drop trigger if exists trg_reminders_updated_at on public.reminders;
create trigger trg_reminders_updated_at
  before update on public.reminders
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. TABEL: pending_actions
-- ----------------------------------------------------------------------------
-- Ringkasan:
--   Staging area alur konfirmasi (PRD §7.4 & §9): TIDAK ADA baris masuk /
--   berubah di reminders sampai status di sini = 'confirmed'.
--   Kolom: id (uuid PK), user_id (FK auth.users),
--          action_type (create/update/delete),
--          target_id (uuid opsional -> reminders.id, TANPA FK keras karena
--          reminder belum ada saat action_type = 'create'),
--          payload (jsonb wajib — hasil extraction lengkap),
--          confirmation_text (kalimat konfirmasi untuk user),
--          status (default 'waiting_confirmation'),
--          chat_log_id (FK chat_logs — pesan asal aksi), created_at.
-- ----------------------------------------------------------------------------

create table if not exists public.pending_actions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  action_type       pending_action_type not null,
  target_id         uuid,
  payload           jsonb not null,
  confirmation_text text,
  status            pending_action_status not null default 'waiting_confirmation',
  chat_log_id       uuid not null references public.chat_logs (id) on delete cascade,
  created_at        timestamptz not null default now()
);

-- query utama: cari pending action user yang masih menunggu konfirmasi
create index if not exists idx_pending_actions_user_id_status
  on public.pending_actions (user_id, status);

-- lookup cepat aksi yang menyasar reminder tertentu (update/delete)
create index if not exists idx_pending_actions_target_id
  on public.pending_actions (target_id)
  where target_id is not null;

create index if not exists idx_pending_actions_chat_log_id
  on public.pending_actions (chat_log_id);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Kebijakan dasar: user terautentikasi hanya bisa membaca & menulis row
-- miliknya sendiri (auth.uid() = user_id). auth.uid() dibungkus (select ...)
-- agar di-cache per-statement (rekomendasi performa Supabase).
-- ----------------------------------------------------------------------------

alter table public.routines        enable row level security;
alter table public.chat_logs       enable row level security;
alter table public.reminders       enable row level security;
alter table public.pending_actions enable row level security;

drop policy if exists "routines_owner_all" on public.routines;
create policy "routines_owner_all"
  on public.routines
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "chat_logs_owner_all" on public.chat_logs;
create policy "chat_logs_owner_all"
  on public.chat_logs
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "reminders_owner_all" on public.reminders;
create policy "reminders_owner_all"
  on public.reminders
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "pending_actions_owner_all" on public.pending_actions;
create policy "pending_actions_owner_all"
  on public.pending_actions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

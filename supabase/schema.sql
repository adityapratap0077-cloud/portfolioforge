-- ═══════════════════════════════════════════════════════════════════
-- PortfolioForge — Supabase schema
-- Run this once in your Supabase project's SQL editor (Database → SQL).
-- It creates the tables, indexes, Row Level Security policies and the
-- updated_at trigger. The site's anon key can only do what these policies
-- allow: owners manage their own rows; public portfolios are readable only
-- through the get_public_portfolio() RPC, which requires the exact
-- unguessable share token — public rows cannot be enumerated.
-- ═══════════════════════════════════════════════════════════════════

-- ── profiles: one row per user (created on first sign-in) ──────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ── portfolios: saved/generated portfolios ─────────────────────────
create table if not exists public.portfolios (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null default 'Untitled portfolio',
  source_type    text not null check (source_type in ('github', 'resume')),
  source_ref     text not null default '',
  portfolio_data jsonb not null default '{}'::jsonb,
  share_token    text not null unique,
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists portfolios_user_id_idx
  on public.portfolios (user_id);
create index if not exists portfolios_share_token_idx
  on public.portfolios (share_token);

-- ── Row Level Security ─────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.portfolios enable row level security;

-- profiles: each user reads/writes only their own row
drop policy if exists "profiles_owner_read"   on public.profiles;
drop policy if exists "profiles_owner_insert" on public.profiles;
drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles_owner_insert"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- portfolios: owners have full access to their own rows only.
-- There is deliberately NO direct anonymous select on this table: public
-- portfolios are readable only through the get_public_portfolio() RPC below,
-- which requires the unguessable share token. This keeps public portfolios
-- unlistable — nobody can enumerate them via the API.
drop policy if exists "portfolios_owner_all" on public.portfolios;
create policy "portfolios_owner_all"
  on public.portfolios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "portfolios_public_share" on public.portfolios;

-- ── public share-link reads via a narrow RPC ───────────────────────
-- Returns at most one portfolio, only when it is public AND the exact
-- share token matches. SECURITY DEFINER so it can read past RLS; the
-- token check inside is the entire authorization.
create or replace function public.get_public_portfolio(p_token text)
returns table (
  id uuid, user_id uuid, title text, source_type text, source_ref text,
  portfolio_data jsonb, share_token text, is_public boolean,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or p_token = '' then
    return;
  end if;
  return query
    select p.id, p.user_id, p.title, p.source_type, p.source_ref,
           p.portfolio_data, p.share_token, p.is_public,
           p.created_at, p.updated_at
    from public.portfolios p
    where p.share_token = p_token
      and p.is_public = true
    limit 1;
end;
$$;

revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;

-- ── keep updated_at fresh ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolios_set_updated_at on public.portfolios;
create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

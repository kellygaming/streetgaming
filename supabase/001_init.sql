-- StreetGame — schéma initial
-- Comptes, points, défis (avec preuve + validation modérateur), récompenses
-- (catalogue + commandes), chat par jeu (messages + fond personnalisé),
-- classement. Conçu pour scaler à N jeux (table `games`, pas de valeurs
-- en dur ailleurs que dans le seed).

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════════

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,
  cover_url text,
  icon text not null default 'ph-game-controller',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  points_balance int not null default 0,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

create table public.profile_game_handles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  handle text not null,
  primary key (profile_id, game_id)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  title text not null,
  description text not null,
  points_reward int not null default 0,
  reward_label text,
  status text not null default 'active' check (status in ('active', 'coming_soon', 'archived')),
  created_at timestamptz not null default now(),
  constraint challenges_game_title_key unique (game_id, title)
);

create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  proof_url text,
  proof_link text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_id uuid references public.profiles (id),
  moderator_note text,
  points_awarded int,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  title text not null,
  description text,
  points_cost int not null,
  icon text not null default 'ph-gift',
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint rewards_game_title_key unique (game_id, title)
);

create table public.reward_orders (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards (id),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  points_spent int not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'received', 'cancelled')),
  fulfillment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null,
  reason text not null check (reason in ('challenge_reward', 'reward_redeem', 'admin_adjust')),
  ref_id uuid,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create table public.chat_backgrounds (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  bg_type text not null default 'default' check (bg_type in ('default', 'color', 'image')),
  bg_value text,
  updated_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

create index challenge_submissions_challenge_idx on public.challenge_submissions (challenge_id);
create index challenge_submissions_profile_idx on public.challenge_submissions (profile_id);
create index reward_orders_profile_idx on public.reward_orders (profile_id);
create index points_transactions_profile_idx on public.points_transactions (profile_id);
create index chat_messages_game_idx on public.chat_messages (game_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════
-- Fonctions & triggers
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_reward_orders_updated_at
before update on public.reward_orders
for each row execute function public.set_updated_at();

-- Crée automatiquement un profil (avec pseudo unique dérivé) à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  );
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username) values (new.id, final_username);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Empêche un utilisateur de modifier son propre solde de points ou rôle
-- via une simple mise à jour de profil (seules les fonctions
-- security definer ci-dessous, ou la clé service_role, peuvent le faire).
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.points_balance := old.points_balance;
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger trg_protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role in ('moderator', 'admin')
  );
$$;

-- Soumet une preuve pour un défi.
create or replace function public.submit_challenge(
  p_challenge_id uuid,
  p_proof_url text default null,
  p_proof_link text default null
)
returns public.challenge_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.challenges;
  v_row public.challenge_submissions;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into v_challenge from public.challenges where id = p_challenge_id;
  if not found or v_challenge.status <> 'active' then
    raise exception 'Défi introuvable ou inactif';
  end if;

  if p_proof_url is null and (p_proof_link is null or trim(p_proof_link) = '') then
    raise exception 'Une preuve (capture ou lien replay) est requise';
  end if;

  insert into public.challenge_submissions (challenge_id, profile_id, proof_url, proof_link)
  values (p_challenge_id, auth.uid(), p_proof_url, nullif(trim(p_proof_link), ''))
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.submit_challenge(uuid, text, text) to authenticated;

-- Valide ou rejette une soumission (modérateur/admin uniquement) et
-- attribue les points en cas de validation.
create or replace function public.review_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_note text default null
)
returns public.challenge_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.challenge_submissions;
  v_challenge public.challenges;
begin
  if not public.is_moderator(auth.uid()) then
    raise exception 'Réservé aux modérateurs';
  end if;

  select * into v_sub from public.challenge_submissions where id = p_submission_id for update;
  if not found then
    raise exception 'Soumission introuvable';
  end if;
  if v_sub.status <> 'pending' then
    raise exception 'Soumission déjà traitée';
  end if;

  select * into v_challenge from public.challenges where id = v_sub.challenge_id;

  update public.challenge_submissions
  set status = case when p_approve then 'approved' else 'rejected' end,
      moderator_id = auth.uid(),
      moderator_note = p_note,
      points_awarded = case when p_approve then v_challenge.points_reward else 0 end,
      reviewed_at = now()
  where id = p_submission_id
  returning * into v_sub;

  if p_approve then
    insert into public.points_transactions (profile_id, amount, reason, ref_id)
    values (v_sub.profile_id, v_challenge.points_reward, 'challenge_reward', v_sub.id);

    update public.profiles
    set points_balance = points_balance + v_challenge.points_reward
    where id = v_sub.profile_id;
  end if;

  return v_sub;
end;
$$;

grant execute on function public.review_submission(uuid, boolean, text) to authenticated;

-- Échange des points contre une récompense du catalogue (débit atomique).
create or replace function public.redeem_reward(p_reward_id uuid)
returns public.reward_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward public.rewards;
  v_balance int;
  v_order public.reward_orders;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id for update;
  if not found or not v_reward.is_available then
    raise exception 'Récompense indisponible';
  end if;

  select points_balance into v_balance from public.profiles where id = auth.uid() for update;
  if v_balance is null or v_balance < v_reward.points_cost then
    raise exception 'Solde de points insuffisant';
  end if;

  update public.profiles set points_balance = points_balance - v_reward.points_cost where id = auth.uid();

  insert into public.reward_orders (reward_id, profile_id, points_spent)
  values (p_reward_id, auth.uid(), v_reward.points_cost)
  returning * into v_order;

  insert into public.points_transactions (profile_id, amount, reason, ref_id)
  values (auth.uid(), -v_reward.points_cost, 'reward_redeem', v_order.id);

  return v_order;
end;
$$;

grant execute on function public.redeem_reward(uuid) to authenticated;

-- Met à jour le statut de livraison d'une commande (modérateur/admin).
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns public.reward_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.reward_orders;
begin
  if not public.is_moderator(auth.uid()) then
    raise exception 'Réservé aux modérateurs';
  end if;
  if p_status not in ('pending', 'sent', 'received', 'cancelled') then
    raise exception 'Statut invalide';
  end if;

  update public.reward_orders
  set status = p_status, fulfillment_note = coalesce(p_note, fulfillment_note)
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'Commande introuvable';
  end if;

  return v_order;
end;
$$;

grant execute on function public.update_order_status(uuid, text, text) to authenticated;

-- Classement de la semaine : points gagnés sur 7 jours glissants, avec le
-- jeu principal du joueur (celui où il a validé le plus de points).
create or replace view public.weekly_leaderboard as
select
  p.id as profile_id,
  p.username,
  p.avatar_url,
  coalesce(
    sum(pt.amount) filter (where pt.amount > 0 and pt.created_at > now() - interval '7 days'),
    0
  )::bigint as weekly_points,
  pg.id as primary_game_id,
  pg.slug as primary_game_slug,
  pg.name as primary_game_name
from public.profiles p
left join public.points_transactions pt on pt.profile_id = p.id
left join lateral (
  select g.id, g.slug, g.name
  from public.challenge_submissions cs
  join public.challenges c on c.id = cs.challenge_id
  join public.games g on g.id = c.game_id
  where cs.profile_id = p.id and cs.status = 'approved'
  group by g.id, g.slug, g.name
  order by sum(coalesce(cs.points_awarded, 0)) desc
  limit 1
) pg on true
group by p.id, pg.id, pg.slug, pg.name
order by weekly_points desc, p.username asc;

alter view public.weekly_leaderboard set (security_invoker = true);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════

alter table public.games enable row level security;
create policy games_select_all on public.games for select using (true);

alter table public.profiles enable row level security;
create policy profiles_select_all on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

alter table public.profile_game_handles enable row level security;
create policy handles_select_all on public.profile_game_handles for select using (true);
create policy handles_insert_own on public.profile_game_handles for insert
  with check (auth.uid() = profile_id);
create policy handles_update_own on public.profile_game_handles for update
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy handles_delete_own on public.profile_game_handles for delete
  using (auth.uid() = profile_id);

alter table public.challenges enable row level security;
create policy challenges_select_all on public.challenges for select using (true);

alter table public.challenge_submissions enable row level security;
create policy submissions_select_own_or_mod on public.challenge_submissions for select
  using (auth.uid() = profile_id or public.is_moderator(auth.uid()));

alter table public.rewards enable row level security;
create policy rewards_select_all on public.rewards for select using (true);

alter table public.reward_orders enable row level security;
create policy orders_select_own_or_mod on public.reward_orders for select
  using (auth.uid() = profile_id or public.is_moderator(auth.uid()));

alter table public.points_transactions enable row level security;
create policy points_tx_select_own on public.points_transactions for select
  using (auth.uid() = profile_id);

alter table public.chat_messages enable row level security;
create policy chat_select_all on public.chat_messages for select using (true);
create policy chat_insert_own on public.chat_messages for insert
  with check (auth.uid() = profile_id);

alter table public.chat_backgrounds enable row level security;
create policy bg_select_own on public.chat_backgrounds for select using (auth.uid() = profile_id);
create policy bg_insert_own on public.chat_backgrounds for insert
  with check (auth.uid() = profile_id);
create policy bg_update_own on public.chat_backgrounds for update
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Realtime — messages de chat diffusés en direct
-- ═══════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.chat_messages;

-- ═══════════════════════════════════════════════════════════════════════
-- Storage — avatars, fonds de chat personnalisés, preuves de défis
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-backgrounds', 'chat-backgrounds', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('challenge-proofs', 'challenge-proofs', false)
on conflict (id) do nothing;

-- Convention de chemin : {user_id}/nom-de-fichier — le premier segment du
-- chemin sert de garde-fou RLS.
create policy avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');
create policy avatars_owner_write on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_owner_update on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy chat_bg_public_read on storage.objects for select
  using (bucket_id = 'chat-backgrounds');
create policy chat_bg_owner_write on storage.objects for insert
  with check (bucket_id = 'chat-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);
create policy chat_bg_owner_update on storage.objects for update
  using (bucket_id = 'chat-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);
create policy chat_bg_owner_delete on storage.objects for delete
  using (bucket_id = 'chat-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create policy proofs_owner_or_mod_read on storage.objects for select
  using (
    bucket_id = 'challenge-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_moderator(auth.uid()))
  );
create policy proofs_owner_write on storage.objects for insert
  with check (bucket_id = 'challenge-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════
-- Seed — jeux, défis et récompenses de lancement (repris du prototype)
-- ═══════════════════════════════════════════════════════════════════════

insert into public.games (slug, name, category, icon, is_active, sort_order) values
  ('free-fire', 'Free Fire', 'Battle Royale', 'ph-fire', true, 1),
  ('blood-strike', 'Blood Strike', 'Battle Royale', 'ph-skull', true, 2),
  ('roblox', 'Roblox', 'Multi-univers', 'ph-cube', false, 3)
on conflict (slug) do nothing;

insert into public.challenges (game_id, title, description, points_reward, reward_label, status)
select g.id, v.title, v.description, v.points_reward, v.reward_label, v.status
from (values
  ('free-fire', 'Booyah Sniper',
   'Remporte la partie (Booyah) avec un minimum de 10 éliminations et un taux de tirs à la tête d''au moins 8.',
   230, '230 Diamants', 'active'),
  ('blood-strike', 'Sang-froid Royal',
   'Remporte une victoire Battle Royale : 15 éliminations min., 50% de headshots, sans jamais être mis à terre ni réanimé.',
   300, '300 Crédits', 'active'),
  ('roblox', 'Premier défi à venir',
   'On prépare un défi Roblox — les détails arrivent très vite.',
   0, null, 'coming_soon')
) as v (slug, title, description, points_reward, reward_label, status)
join public.games g on g.slug = v.slug
on conflict (game_id, title) do nothing;

insert into public.rewards (game_id, title, description, points_cost, icon, is_available, sort_order)
select g.id, v.title, v.description, v.points_cost, v.icon, v.is_available, v.sort_order
from (values
  ('free-fire', '100 Diamants', 'Ajoutés directement à ton compte en jeu.', 450, 'ph-diamond', true, 1),
  ('free-fire', '230 Diamants', 'Récompense du défi Booyah Sniper.', 900, 'ph-diamond', true, 2),
  ('free-fire', '520 Diamants', 'Le pack le plus rentable pour les joueurs réguliers.', 1850, 'ph-diamond', true, 3),
  ('blood-strike', '150 Crédits', 'Monnaie du jeu pour la boutique en jeu.', 500, 'ph-coin', true, 1),
  ('blood-strike', '300 Crédits', 'Récompense du défi Sang-froid Royal.', 1100, 'ph-coin', true, 2),
  ('blood-strike', 'Skin exclusif', 'Skin d''arme en édition limitée StreetGame.', 2400, 'ph-t-shirt', true, 3),
  ('roblox', 'Robux', 'Les récompenses Roblox arrivent bientôt.', 0, 'ph-lock-simple', false, 1)
) as v (slug, title, description, points_cost, icon, is_available, sort_order)
join public.games g on g.slug = v.slug
on conflict (game_id, title) do nothing;

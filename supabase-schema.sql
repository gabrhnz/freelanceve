-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Profiles table
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  wallet_address text,
  nombre text not null default '',
  bio text,
  role text not null default 'freelancer' check (role in ('freelancer', 'employer', 'both')),
  categoria text,
  skills text[] default '{}',
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Services table
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  titulo text not null,
  descripcion text not null default '',
  precio_usdc numeric(12,2) not null,
  delivery_days integer not null default 7,
  categoria text not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- 3. Orders table
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references services(id) on delete set null,
  client_id uuid references profiles(id) on delete set null not null,
  freelancer_id uuid references profiles(id) on delete set null not null,
  amount_usdc numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'delivered', 'completed', 'refunded', 'cancelled')),
  tx_signature text,
  created_at timestamptz default now()
);

-- 4. Indexes
create index if not exists idx_services_owner on services(owner_id);
create index if not exists idx_services_categoria on services(categoria);
create index if not exists idx_services_activo on services(activo);
create index if not exists idx_orders_client on orders(client_id);
create index if not exists idx_orders_freelancer on orders(freelancer_id);
create index if not exists idx_profiles_email on profiles(email);

-- 5. Row Level Security (RLS) — allow all for now via anon key
alter table profiles enable row level security;
alter table services enable row level security;
alter table orders enable row level security;

create policy "Public read profiles" on profiles for select using (true);
create policy "Public insert profiles" on profiles for insert with check (true);
create policy "Public update profiles" on profiles for update using (true);

create policy "Public read services" on services for select using (true);
create policy "Public insert services" on services for insert with check (true);
create policy "Public update services" on services for update using (true);

create policy "Public read orders" on orders for select using (true);
create policy "Public insert orders" on orders for insert with check (true);
create policy "Public update orders" on orders for update using (true);

-- 6. Migration: allow wallet-only registration
alter table profiles alter column email drop not null;
create unique index if not exists idx_profiles_wallet on profiles(wallet_address) where wallet_address is not null;

-- 7. Migration: add username to profiles
alter table profiles add column if not exists username text unique;
create unique index if not exists idx_profiles_username on profiles(username) where username is not null;

-- 8. Migration: add social_links and portfolio to profiles
alter table profiles add column if not exists social_links jsonb default '{}';
alter table profiles add column if not exists portfolio jsonb default '[]';

-- 9. Messages table (order chat)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete set null not null,
  content text not null default '',
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz default now()
);

create index if not exists idx_messages_order on messages(order_id);
create index if not exists idx_messages_created on messages(order_id, created_at);

alter table messages enable row level security;
create policy "Public read messages" on messages for select using (true);
create policy "Public insert messages" on messages for insert with check (true);

-- 10. Reviews table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null unique,
  reviewer_id uuid references profiles(id) on delete set null not null,
  freelancer_id uuid references profiles(id) on delete set null not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_freelancer on reviews(freelancer_id);

alter table reviews enable row level security;
create policy "Public read reviews" on reviews for select using (true);
create policy "Public insert reviews" on reviews for insert with check (true);

-- 11. Migration: add accepted_at to orders and expand status constraint
alter table orders add column if not exists accepted_at timestamptz;
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'refunded', 'cancelled'));

-- 12. Migration: add delivered_at / read_at to direct_messages for read receipts
alter table direct_messages add column if not exists delivered_at timestamptz;
alter table direct_messages add column if not exists read_at timestamptz;
alter table direct_messages enable row level security;
create policy if not exists "Public read direct_messages" on direct_messages for select using (true);
create policy if not exists "Public insert direct_messages" on direct_messages for insert with check (true);
create policy if not exists "Public update direct_messages" on direct_messages for update using (true);

-- 13. Typing status table (ephemeral, rows auto-delete)
create table if not exists typing_status (
  user_id uuid references profiles(id) on delete cascade not null,
  chat_partner_id uuid references profiles(id) on delete cascade not null,
  is_typing boolean default false,
  updated_at timestamptz default now(),
  primary key (user_id, chat_partner_id)
);

alter table typing_status enable row level security;
create policy if not exists "Public read typing_status" on typing_status for select using (true);
create policy if not exists "Public insert typing_status" on typing_status for insert with check (true);
create policy if not exists "Public update typing_status" on typing_status for update using (true);
create policy if not exists "Public delete typing_status" on typing_status for delete using (true);

-- 14. Enable Realtime on direct_messages and typing_status
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table typing_status;


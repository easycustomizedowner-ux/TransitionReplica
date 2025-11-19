-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('customer', 'vendor', 'admin');
create type ad_status as enum ('open', 'closed', 'completed');
create type quote_status as enum ('pending', 'accepted', 'rejected');

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role user_role not null default 'customer',
  display_name text,
  avatar_url text,
  bio text,
  categories text[], -- Array of categories for vendors
  experience_years integer,
  portfolio_urls text[],
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ADS (Requirements)
create table public.ads (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  budget_min numeric,
  budget_max numeric,
  category text not null,
  location_text text,
  images text[],
  status ad_status default 'open' not null,
  approved boolean default false, -- For admin moderation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUOTES
create table public.quotes (
  id uuid default uuid_generate_v4() primary key,
  ad_id uuid references public.ads(id) on delete cascade not null,
  vendor_id uuid references public.profiles(id) not null,
  customer_id uuid references public.profiles(id) not null,
  price_total numeric not null,
  delivery_days integer not null,
  message text,
  status quote_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHAT THREADS
create table public.chat_threads (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references public.quotes(id) not null,
  customer_id uuid references public.profiles(id) not null,
  vendor_id uuid references public.profiles(id) not null,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unread_count_customer integer default 0,
  unread_count_vendor integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHAT MESSAGES
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text,
  attachments text[],
  read_by boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VENDOR INVENTORY (To replace Base44 VendorInventory)
create table public.vendor_inventory (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references public.profiles(id) not null,
  product_name text not null,
  description text,
  price numeric not null,
  category text,
  images text[],
  stock integer default 1,
  is_featured boolean default false,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES

-- Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Ads
alter table public.ads enable row level security;

create policy "Ads are viewable by everyone"
  on public.ads for select
  using ( true );

create policy "Customers can create ads"
  on public.ads for insert
  with check ( auth.uid() = created_by );

create policy "Customers can update own ads"
  on public.ads for update
  using ( auth.uid() = created_by );

create policy "Customers can delete own ads"
  on public.ads for delete
  using ( auth.uid() = created_by );

-- Quotes
alter table public.quotes enable row level security;

create policy "Vendors can create quotes"
  on public.quotes for insert
  with check ( auth.uid() = vendor_id );

create policy "Users can view quotes they are involved in"
  on public.quotes for select
  using ( auth.uid() = vendor_id or auth.uid() = customer_id );

create policy "Vendors can update own quotes"
  on public.quotes for update
  using ( auth.uid() = vendor_id );

-- Chat Threads
alter table public.chat_threads enable row level security;

create policy "Users can view their chat threads"
  on public.chat_threads for select
  using ( auth.uid() = customer_id or auth.uid() = vendor_id );

-- Chat Messages
alter table public.chat_messages enable row level security;

create policy "Users can view messages in their threads"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_threads
      where id = chat_messages.thread_id
      and (customer_id = auth.uid() or vendor_id = auth.uid())
    )
  );

create policy "Users can insert messages in their threads"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_threads
      where id = chat_messages.thread_id
      and (customer_id = auth.uid() or vendor_id = auth.uid())
    )
    and auth.uid() = sender_id
  );

-- Vendor Inventory
alter table public.vendor_inventory enable row level security;

create policy "Inventory is viewable by everyone"
  on public.vendor_inventory for select
  using ( true );

create policy "Vendors can manage own inventory"
  on public.vendor_inventory for all
  using ( auth.uid() = vendor_id );

-- STORAGE BUCKETS (SQL to set up storage is complex, usually done via UI, but here is policy logic)
-- We assume buckets 'ad-images', 'profile-images', 'message-attachments' exist.

-- Storage Policies (Conceptual - needs to be applied to storage.objects)
-- ad-images: Public Read, Authenticated Upload
-- profile-images: Public Read, Owner Upload/Update
-- message-attachments: Private Read (Participants), Participant Upload

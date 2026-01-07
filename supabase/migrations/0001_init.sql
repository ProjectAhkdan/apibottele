-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create bot_state table
create table if not exists bot_state (
    telegram_id bigint primary key,
    current_state text not null default 'idle',
    payload jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create orders table
create table if not exists orders (
    id uuid primary key default uuid_generate_v4(),
    order_code text unique not null,
    telegram_id bigint not null,
    game text not null,
    user_game_id text not null,
    server_id text,
    nominal text not null,
    price integer not null,
    payment_status text not null default 'UNPAID', -- UNPAID, PAID
    order_status text not null default 'PENDING', -- PENDING, PROCESSING, COMPLETED, REJECTED
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for performance
create index if not exists orders_telegram_id_idx on orders(telegram_id);
create index if not exists orders_status_idx on orders(order_status);

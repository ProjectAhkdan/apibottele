-- Create games table
create table if not exists games (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create pricelists table
create table if not exists pricelists (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references games(id) on delete cascade not null,
  item_name text not null,
  nominal integer not null,
  price integer not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes
create index if not exists pricelists_game_id_idx on pricelists(game_id);
create index if not exists games_code_idx on games(code);

-- Metric/Seed Data (Method: Using DO block to handle UUIDs comfortably)
do $$
declare
  ml_id uuid;
  ff_id uuid;
begin
  -- Insert Games and capture IDs
  if not exists (select 1 from games where code = 'MLBB') then
    insert into games (code, name) values ('MLBB', 'Mobile Legends') returning id into ml_id;
  else
    select id into ml_id from games where code = 'MLBB';
  end if;

  if not exists (select 1 from games where code = 'FF') then
    insert into games (code, name) values ('FF', 'Free Fire') returning id into ff_id;
  else
    select id into ff_id from games where code = 'FF';
  end if;

  -- Insert Pricelists for Mobile Legends
  if not exists (select 1 from pricelists where game_id = ml_id and nominal = 86) then
    insert into pricelists (game_id, item_name, nominal, price) values 
    (ml_id, '86 Diamond', 86, 20000),
    (ml_id, '172 Diamond', 172, 38000),
    (ml_id, '257 Diamond', 257, 56000);
  end if;

  -- Insert Pricelists for Free Fire
  if not exists (select 1 from pricelists where game_id = ff_id and nominal = 140) then
    insert into pricelists (game_id, item_name, nominal, price) values 
    (ff_id, '140 Diamond', 140, 25000),
    (ff_id, '355 Diamond', 355, 60000);
  end if;
end $$;

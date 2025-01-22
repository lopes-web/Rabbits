-- Habilita a extensão UUID
create extension if not exists "uuid-ossp";

-- Tabela de hábitos
create table habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  type text not null check (type in ('daily', 'counter')),
  recurrence text not null check (recurrence in ('daily', 'weekly', 'monthly')),
  target integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de checks
create table habit_checks (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, date)
);

-- Índices para melhor performance
create index habits_user_id_idx on habits(user_id);
create index habit_checks_habit_id_idx on habit_checks(habit_id);
create index habit_checks_user_id_idx on habit_checks(user_id);
create index habit_checks_date_idx on habit_checks(date);

-- Função para atualizar o updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar o updated_at
create trigger update_habits_updated_at
  before update on habits
  for each row
  execute function update_updated_at_column();

create trigger update_habit_checks_updated_at
  before update on habit_checks
  for each row
  execute function update_updated_at_column();

-- RLS (Row Level Security)
alter table habits enable row level security;
alter table habit_checks enable row level security;

-- Políticas de segurança para habits
create policy "Users can view their own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Políticas de segurança para habit_checks
create policy "Users can view their own habit checks"
  on habit_checks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habit checks"
  on habit_checks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habit checks"
  on habit_checks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habit checks"
  on habit_checks for delete
  using (auth.uid() = user_id); 
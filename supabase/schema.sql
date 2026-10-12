-- =====================================================================
--  «Наш список» — база данных для Supabase
--  Вставьте ВЕСЬ этот файл в Supabase → SQL Editor → Run.
--  Файл можно запускать повторно — он ничего не сломает.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
--  Таблицы
-- ---------------------------------------------------------------------

-- Пара: максимум два человека
create table if not exists public.couples (
  id          uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

-- Профиль человека: имя, цвет и пара
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  couple_id  uuid not null references public.couples (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  color      text not null check (color in ('blue', 'pink')),
  created_at timestamptz not null default now(),
  unique (couple_id, color)
);

-- Категории
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  icon       text not null default 'star' check (char_length(icon) <= 40),
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  unique (id, couple_id)
);

-- Записи
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references public.couples (id) on delete cascade,
  category_id uuid not null,
  title       text not null check (char_length(title) between 1 and 200),
  address     text check (char_length(address) <= 300),
  note        text check (char_length(note) <= 3000),
  photos      text[] not null default '{}' check (cardinality(photos) <= 10),
  status      text not null default 'want' check (status in ('want', 'done')),
  rating      int  check (rating between 1 and 5),
  visited_on  date,
  done_at     timestamptz,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- запись может лежать только в категории своей же пары;
  -- при удалении категории её записи тоже удаляются
  foreign key (category_id, couple_id)
    references public.categories (id, couple_id) on delete cascade
);

create index if not exists profiles_couple_idx   on public.profiles (couple_id);
create index if not exists categories_couple_idx on public.categories (couple_id);
create index if not exists items_couple_idx      on public.items (couple_id);
create index if not exists items_category_idx    on public.items (category_id, couple_id);

-- ---------------------------------------------------------------------
--  Вспомогательная функция: пара текущего пользователя
-- ---------------------------------------------------------------------
create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select couple_id from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
--  Автоматика для записей
-- ---------------------------------------------------------------------
create or replace function public.items_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    -- автора и пару изменить нельзя
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.couple_id  := old.couple_id;
  end if;

  new.updated_at := now();

  -- когда запись стала «Были» — запоминаем время
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.done_at := now();
  elsif new.status = 'want' then
    new.done_at    := null;
    new.rating     := null;
    new.visited_on := null;
  end if;

  return new;
end;
$$;

drop trigger if exists items_before_write on public.items;
create trigger items_before_write
  before insert or update on public.items
  for each row execute function public.items_before_write();

-- ---------------------------------------------------------------------
--  Создание пары и присоединение по коду
-- ---------------------------------------------------------------------

-- Первый человек: создаёт пару, получает код приглашения
create or replace function public.create_couple(p_name text, p_color text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_couple uuid;
  v_code   text;
  v_abc    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- без похожих 0/O, 1/I
  i        int;
begin
  if v_uid is null then
    raise exception 'Нужно войти в аккаунт';
  end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Вы уже состоите в паре';
  end if;
  if p_color not in ('blue', 'pink') then
    raise exception 'Неизвестный цвет';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Введите имя';
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_abc, 1 + floor(random() * length(v_abc))::int, 1);
    end loop;
    exit when not exists (select 1 from public.couples where invite_code = v_code);
  end loop;

  insert into public.couples (invite_code) values (v_code) returning id into v_couple;

  insert into public.profiles (id, couple_id, name, color)
  values (v_uid, v_couple, trim(p_name), p_color);

  insert into public.categories (couple_id, name, icon, position) values
    (v_couple, 'Места',   'map-pin',      1),
    (v_couple, 'Фильмы',  'clapperboard', 2),
    (v_couple, 'Рецепты', 'utensils',     3),
    (v_couple, 'Поездки', 'plane',        4),
    (v_couple, 'Разное',  'star',         5);

  return v_code;
end;
$$;

-- Второй человек: вводит код и присоединяется. Третий уже не сможет.
create or replace function public.join_couple(p_name text, p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_couple uuid;
  v_taken  text;
begin
  if v_uid is null then
    raise exception 'Нужно войти в аккаунт';
  end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Вы уже состоите в паре';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Введите имя';
  end if;

  -- блокируем строку пары, чтобы двое не вошли одновременно
  select id into v_couple
  from public.couples
  where invite_code = upper(trim(p_code))
  for update;

  if v_couple is null then
    raise exception 'Код не найден. Проверьте, нет ли опечатки';
  end if;

  if (select count(*) from public.profiles where couple_id = v_couple) >= 2 then
    raise exception 'В этой паре уже два человека';
  end if;

  select color into v_taken from public.profiles where couple_id = v_couple limit 1;

  insert into public.profiles (id, couple_id, name, color)
  values (v_uid, v_couple, trim(p_name),
          case when v_taken = 'blue' then 'pink' else 'blue' end);

  return v_couple;
end;
$$;

-- Функции можно вызывать только вошедшим пользователям
revoke all on function public.my_couple_id()               from public, anon;
revoke all on function public.create_couple(text, text)     from public, anon;
revoke all on function public.join_couple(text, text)       from public, anon;
revoke all on function public.items_before_write()          from public, anon, authenticated;
grant execute on function public.my_couple_id()             to authenticated;
grant execute on function public.create_couple(text, text)  to authenticated;
grant execute on function public.join_couple(text, text)    to authenticated;

-- ---------------------------------------------------------------------
--  Права на таблицы
-- ---------------------------------------------------------------------
revoke all on public.couples, public.profiles, public.categories, public.items from anon;
revoke all on public.couples, public.profiles from authenticated;

grant select on public.couples to authenticated;
grant select on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;  -- менять можно только имя
grant select, insert, update, delete on public.categories, public.items to authenticated;

-- ---------------------------------------------------------------------
--  Защита на уровне строк (RLS): видны только данные своей пары
-- ---------------------------------------------------------------------
alter table public.couples    enable row level security;
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.items      enable row level security;

drop policy if exists "couple: read own" on public.couples;
create policy "couple: read own" on public.couples
  for select to authenticated
  using (id = public.my_couple_id());

drop policy if exists "profiles: read couple" on public.profiles;
create policy "profiles: read couple" on public.profiles
  for select to authenticated
  using (id = auth.uid() or couple_id = public.my_couple_id());

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "categories: couple only" on public.categories;
create policy "categories: couple only" on public.categories
  for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

drop policy if exists "items: couple only" on public.items;
create policy "items: couple only" on public.items
  for all to authenticated
  using (couple_id = public.my_couple_id())
  with check (couple_id = public.my_couple_id());

-- ---------------------------------------------------------------------
--  Хранилище фото: закрытое, папка = id пары
--  Путь файла: <id пары>/<случайное имя>.jpg
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 1048576, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos: couple read"   on storage.objects;
drop policy if exists "photos: couple insert" on storage.objects;
drop policy if exists "photos: couple update" on storage.objects;
drop policy if exists "photos: couple delete" on storage.objects;

create policy "photos: couple read" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.my_couple_id()::text);

create policy "photos: couple insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos'
              and (storage.foldername(name))[1] = public.my_couple_id()::text);

create policy "photos: couple update" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.my_couple_id()::text)
  with check (bucket_id = 'photos'
              and (storage.foldername(name))[1] = public.my_couple_id()::text);

create policy "photos: couple delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos'
         and (storage.foldername(name))[1] = public.my_couple_id()::text);

-- ---------------------------------------------------------------------
--  «Будильник»: GitHub раз в 3 дня вызывает эту функцию,
--  чтобы бесплатный проект Supabase не засыпал. Ничего не раскрывает.
-- ---------------------------------------------------------------------
create or replace function public.keepalive()
returns text
language sql
security definer
set search_path = ''
as $$
  select 'ok' from (select count(*) from public.couples) as t
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;

-- Готово! Внизу должно появиться «Success. No rows returned».

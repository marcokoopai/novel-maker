create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  variant text not null default 'parchment' check (variant in ('parchment', 'midnight', 'minimal')),
  font_size int not null default 17 check (font_size between 10 and 40),
  line_height numeric not null default 2 check (line_height between 1 and 4),
  show_ai boolean not null default true,
  lang text not null default 'en' check (lang in ('zh-TW', 'zh-CN', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.novels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_language text not null default 'auto',
  archived_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  title text not null,
  summary text not null default '',
  content text not null default '',
  word_count int not null default 0 check (word_count >= 0),
  status text not null default 'draft' check (status in ('draft', 'writing', 'done')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  name text not null default '',
  age text not null default '',
  role text not null default '',
  appearance text not null default '',
  personality text not null default '',
  speech_style text not null default '',
  background text not null default '',
  relationships text not null default '',
  color text not null default '#C17F3E',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  title text not null,
  content text not null default '',
  kind text not null check (kind in ('background', 'outline', 'world')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (novel_id, kind)
);

create table public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  novel_init_count int not null default 0 check (novel_init_count >= 0),
  writing_ai_count int not null default 0 check (writing_ai_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index novels_owner_updated_idx on public.novels (owner_id, updated_at desc);
create index novels_owner_archived_idx on public.novels (owner_id, archived_at, updated_at desc);
create index chapters_novel_sort_idx on public.chapters (novel_id, sort_order, created_at);
create index characters_novel_sort_idx on public.characters (novel_id, sort_order, created_at);
create index notes_novel_sort_idx on public.notes (novel_id, sort_order, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger novels_set_updated_at
before update on public.novels
for each row execute function public.set_updated_at();

create trigger chapters_set_updated_at
before update on public.chapters
for each row execute function public.set_updated_at();

create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create trigger ai_usage_daily_set_updated_at
before update on public.ai_usage_daily
for each row execute function public.set_updated_at();

create or replace function public.touch_parent_novel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_novel_id uuid;
begin
  if tg_op = 'DELETE' then
    target_novel_id = old.novel_id;
  else
    target_novel_id = new.novel_id;
  end if;

  update public.novels
  set updated_at = now()
  where id = target_novel_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger chapters_touch_parent_novel
after insert or update or delete on public.chapters
for each row execute function public.touch_parent_novel();

create trigger characters_touch_parent_novel
after insert or update or delete on public.characters
for each row execute function public.touch_parent_novel();

create trigger notes_touch_parent_novel
after insert or update or delete on public.notes
for each row execute function public.touch_parent_novel();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.note_title_for_language(note_kind text, source_language text)
returns text
language plpgsql
immutable
as $$
begin
  if source_language = 'en' then
    return case note_kind
      when 'background' then 'Background'
      when 'outline' then 'Outline'
      else 'World Notes'
    end;
  elsif source_language = 'zh-CN' then
    return case note_kind
      when 'background' then '背景设定'
      when 'outline' then '故事大纲'
      else '世界观笔记'
    end;
  else
    return case note_kind
      when 'background' then '背景設定'
      when 'outline' then '故事大綱'
      else '世界觀筆記'
    end;
  end if;
end;
$$;

create or replace function public.create_empty_novel(
  p_title text,
  p_source_language text default 'auto'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  created_novel_id uuid;
  normalized_title text;
  normalized_language text;
begin
  current_user_id = auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  normalized_title = nullif(trim(p_title), '');
  if normalized_title is null then
    normalized_title = '未命名小說';
  end if;

  normalized_language = coalesce(nullif(trim(p_source_language), ''), 'auto');

  insert into public.novels (owner_id, title, source_language)
  values (current_user_id, normalized_title, normalized_language)
  returning id into created_novel_id;

  insert into public.chapters (novel_id, title, sort_order)
  values (created_novel_id, '無標題', 10);

  insert into public.notes (novel_id, kind, title, sort_order)
  values
    (created_novel_id, 'background', public.note_title_for_language('background', normalized_language), 10),
    (created_novel_id, 'outline', public.note_title_for_language('outline', normalized_language), 20),
    (created_novel_id, 'world', public.note_title_for_language('world', normalized_language), 30);

  return created_novel_id;
end;
$$;

create or replace function public.archive_novel(p_novel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id = auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.novels
  set archived_at = now(),
      purge_after = now() + interval '7 days'
  where id = p_novel_id
    and owner_id = current_user_id;

  if not found then
    raise exception 'Novel not found';
  end if;
end;
$$;

create or replace function public.restore_novel(p_novel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id = auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.novels
  set archived_at = null,
      purge_after = null
  where id = p_novel_id
    and owner_id = current_user_id;

  if not found then
    raise exception 'Novel not found';
  end if;
end;
$$;

create or replace function public.purge_expired_archived_novels()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.novels
  where archived_at is not null
    and purge_after <= now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

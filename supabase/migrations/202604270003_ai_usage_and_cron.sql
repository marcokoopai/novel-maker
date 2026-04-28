create or replace function public.free_novel_init_limit()
returns int
language sql
immutable
as $$
  select 1
$$;

create or replace function public.free_writing_ai_limit()
returns int
language sql
immutable
as $$
  select 20
$$;

create or replace function public.get_ai_usage_for_today()
returns table (
  usage_date date,
  novel_init_count int,
  novel_init_limit int,
  writing_ai_count int,
  writing_ai_limit int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  today date;
begin
  current_user_id = auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  today = current_date;

  insert into public.profiles (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  insert into public.ai_usage_daily (user_id, usage_date)
  values (current_user_id, today)
  on conflict (user_id, usage_date) do nothing;

  return query
    select
      u.usage_date,
      u.novel_init_count,
      public.free_novel_init_limit(),
      u.writing_ai_count,
      public.free_writing_ai_limit()
    from public.ai_usage_daily u
    where u.user_id = current_user_id
      and u.usage_date = today;
end;
$$;

create or replace function public.consume_novel_init_quota()
returns table (
  usage_date date,
  novel_init_count int,
  novel_init_limit int,
  writing_ai_count int,
  writing_ai_limit int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  today date;
  limit_count int;
  current_count int;
begin
  current_user_id = auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  today = current_date;
  limit_count = public.free_novel_init_limit();

  insert into public.ai_usage_daily (user_id, usage_date)
  values (current_user_id, today)
  on conflict (user_id, usage_date) do nothing;

  select u.novel_init_count
  into current_count
  from public.ai_usage_daily u
  where u.user_id = current_user_id
    and u.usage_date = today
  for update;

  if current_count >= limit_count then
    raise exception 'Daily AI novel initialization quota exceeded';
  end if;

  update public.ai_usage_daily
  set novel_init_count = novel_init_count + 1
  where user_id = current_user_id
    and usage_date = today;

  return query select * from public.get_ai_usage_for_today();
end;
$$;

create or replace function public.consume_writing_ai_quota()
returns table (
  usage_date date,
  novel_init_count int,
  novel_init_limit int,
  writing_ai_count int,
  writing_ai_limit int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  today date;
  limit_count int;
  current_count int;
begin
  current_user_id = auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  today = current_date;
  limit_count = public.free_writing_ai_limit();

  insert into public.ai_usage_daily (user_id, usage_date)
  values (current_user_id, today)
  on conflict (user_id, usage_date) do nothing;

  select u.writing_ai_count
  into current_count
  from public.ai_usage_daily u
  where u.user_id = current_user_id
    and u.usage_date = today
  for update;

  if current_count >= limit_count then
    raise exception 'Daily writing AI quota exceeded';
  end if;

  update public.ai_usage_daily
  set writing_ai_count = writing_ai_count + 1
  where user_id = current_user_id
    and usage_date = today;

  return query select * from public.get_ai_usage_for_today();
end;
$$;

-- Supabase Cron should call this once per day in dev and production:
-- select public.purge_expired_archived_novels();
--
-- The schedule is intentionally documented instead of forced here because
-- pg_cron availability and permissions vary by project configuration.

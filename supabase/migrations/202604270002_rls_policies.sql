alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.novels enable row level security;
alter table public.chapters enable row level security;
alter table public.characters enable row level security;
alter table public.notes enable row level security;
alter table public.ai_usage_daily enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_settings_select_own"
on public.user_settings
for select
to authenticated
using (user_id = auth.uid());

create policy "user_settings_insert_own"
on public.user_settings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_settings_update_own"
on public.user_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "novels_select_own"
on public.novels
for select
to authenticated
using (owner_id = auth.uid());

create policy "novels_insert_own"
on public.novels
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "novels_update_own"
on public.novels
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "chapters_select_own_active_novel"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1
    from public.novels
    where novels.id = chapters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "chapters_insert_own_active_novel"
on public.chapters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.novels
    where novels.id = chapters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "chapters_update_own_active_novel"
on public.chapters
for update
to authenticated
using (
  exists (
    select 1
    from public.novels
    where novels.id = chapters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
)
with check (
  exists (
    select 1
    from public.novels
    where novels.id = chapters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "characters_select_own_active_novel"
on public.characters
for select
to authenticated
using (
  exists (
    select 1
    from public.novels
    where novels.id = characters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "characters_insert_own_active_novel"
on public.characters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.novels
    where novels.id = characters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "characters_update_own_active_novel"
on public.characters
for update
to authenticated
using (
  exists (
    select 1
    from public.novels
    where novels.id = characters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
)
with check (
  exists (
    select 1
    from public.novels
    where novels.id = characters.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "notes_select_own_active_novel"
on public.notes
for select
to authenticated
using (
  exists (
    select 1
    from public.novels
    where novels.id = notes.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "notes_insert_own_active_novel"
on public.notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.novels
    where novels.id = notes.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "notes_update_own_active_novel"
on public.notes
for update
to authenticated
using (
  exists (
    select 1
    from public.novels
    where novels.id = notes.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
)
with check (
  exists (
    select 1
    from public.novels
    where novels.id = notes.novel_id
      and novels.owner_id = auth.uid()
      and novels.archived_at is null
  )
);

create policy "ai_usage_daily_select_own"
on public.ai_usage_daily
for select
to authenticated
using (user_id = auth.uid());

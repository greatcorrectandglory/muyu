create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  merit_total bigint not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_stats enable row level security;

drop policy if exists "Users can read own merit" on public.user_stats;
create policy "Users can read own merit"
  on public.user_stats
  for select
  using (auth.uid() = user_id);

grant select on public.user_stats to authenticated;

create or replace function public.increment_merit(p_delta integer)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_safe_delta integer;
  v_merit bigint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_safe_delta := greatest(coalesce(p_delta, 0), 0);

  insert into public.user_stats (user_id, merit_total, updated_at)
  values (v_user_id, v_safe_delta, timezone('utc', now()))
  on conflict (user_id)
  do update
    set merit_total = public.user_stats.merit_total + v_safe_delta,
        updated_at = timezone('utc', now())
  returning merit_total into v_merit;

  return v_merit;
end;
$$;

revoke all on function public.increment_merit(integer) from public;
grant execute on function public.increment_merit(integer) to authenticated;

-- Weather Dashboard: everything lives in its own `weather` schema.
create schema if not exists weather;
comment on schema weather is 'Weather Dashboard App (JoshuaMColon/Weather_Dashboard_App). Separate from the blog.';
revoke all on schema weather from public, anon;
grant usage on schema weather to authenticated, service_role;

create table weather.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  lat numeric(7,4) not null check (lat between -90 and 90),
  lon numeric(7,4) not null check (lon between -180 and 180),
  country text check (char_length(country) <= 80),
  admin1 text check (char_length(admin1) <= 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint saved_locations_user_lat_lon_key unique (user_id, lat, lon)
);
create index saved_locations_user_sort_idx on weather.saved_locations (user_id, sort_order);

create table weather.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  units text not null default 'F' check (units in ('F','C')),
  wind_unit text not null default 'mph' check (wind_unit in ('mph','kmh','ms','kn')),
  theme text not null default 'dynamic' check (theme in ('dynamic','midnight')),
  updated_at timestamptz not null default now()
);

-- Keep any one account from filling the table (guests included).
create or replace function weather.enforce_location_limit()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (select count(*) from weather.saved_locations where user_id = new.user_id) >= 25 then
    raise exception 'You can save up to 25 cities' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger saved_locations_limit before insert on weather.saved_locations
  for each row execute function weather.enforce_location_limit();

create or replace function weather.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger user_preferences_touch before update on weather.user_preferences
  for each row execute function weather.touch_updated_at();

alter table weather.saved_locations enable row level security;
alter table weather.user_preferences enable row level security;

-- Signed-in users, including anonymous guests from /demo, own their rows.
create policy "Users read own saved locations" on weather.saved_locations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own saved locations" on weather.saved_locations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own saved locations" on weather.saved_locations
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own saved locations" on weather.saved_locations
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own preferences" on weather.user_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own preferences" on weather.user_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own preferences" on weather.user_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own preferences" on weather.user_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on all tables in schema weather from public, anon;
grant select, insert, update, delete on weather.saved_locations, weather.user_preferences to authenticated;
grant all on weather.saved_locations, weather.user_preferences to service_role;
revoke all on function weather.enforce_location_limit(), weather.touch_updated_at() from public, anon;

-- Realtime sync of saved cities across tabs/devices (RLS still applies).
alter table weather.saved_locations replica identity full;
alter publication supabase_realtime add table weather.saved_locations;

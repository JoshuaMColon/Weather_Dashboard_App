-- The `weather` schema isn't in the Data API's exposed schemas (a dashboard-only setting),
-- so expose it through thin, auto-updatable views. security_invoker = true means the
-- caller's RLS policies on weather.* tables apply; the views add no privileges.
create view public.weather_saved_locations with (security_invoker = true) as
  select id, user_id, name, lat, lon, country, admin1, sort_order, created_at
  from weather.saved_locations;
create view public.weather_user_preferences with (security_invoker = true) as
  select user_id, units, wind_unit, theme, updated_at
  from weather.user_preferences;
comment on view public.weather_saved_locations is 'Weather Dashboard API surface for weather.saved_locations (RLS enforced via security_invoker).';
comment on view public.weather_user_preferences is 'Weather Dashboard API surface for weather.user_preferences (RLS enforced via security_invoker).';
revoke all on public.weather_saved_locations, public.weather_user_preferences from public, anon;
grant select, insert, update, delete on public.weather_saved_locations, public.weather_user_preferences to authenticated;
grant all on public.weather_saved_locations, public.weather_user_preferences to service_role;

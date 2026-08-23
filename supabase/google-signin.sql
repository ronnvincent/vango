-- ============================================================================
-- VanGo Google sign-in support
-- Code part: teaches the profile trigger to read Google account names.
--
-- DASHBOARD PARTS ONLY YOU CAN DO (do these first):
--
-- 1) Google Cloud Console (console.cloud.google.com), free project:
--      APIs & Services -> OAuth consent screen -> External ->
--      app name "VanGo", support email -> SAVE -> PUBLISH APP
--      (while in "Testing", only added test users can sign in!)
--      Credentials -> Create Credentials -> OAuth client ID -> Web application
--        Authorized JavaScript origins:
--          https://vangoe.vercel.app
--          http://localhost:5173            (local dev)
--        Authorized redirect URIs:
--          https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
--      Copy the Client ID and Client Secret.
--
-- 2) Supabase Dashboard:
--      Authentication -> Providers -> Google -> enable ->
--      paste Client ID + Client Secret -> Save
--      Authentication -> URL Configuration ->
--        Site URL: https://vangoe.vercel.app
--        Redirect URLs: add https://vangoe.vercel.app
--
-- 3) Run this whole file in the SQL Editor.
--
-- Cost check: free on both sides; logins count as normal Supabase MAUs;
-- one profiles row per user exactly like email signup.
-- ============================================================================

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, phone)
  values (
    new.id,
    -- email signups store full_name in metadata; Google stores "name"
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end $$;

-- Done. Test: login page -> Continue with Google -> should land signed in
-- with your Google name on the profile. Phone stays blank until they fill
-- it in Profile — expected, Google doesn't share phone numbers.

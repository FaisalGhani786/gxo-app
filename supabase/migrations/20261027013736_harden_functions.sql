-- The signup trigger is never called directly, and slot availability is only
-- shown to signed-in clients. is_admin()/is_enrolled() stay executable because
-- RLS policies evaluate them as the caller (including anonymous visitors).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.booked_slots(timestamptz, timestamptz) from public, anon;

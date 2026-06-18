-- Harden SECURITY DEFINER function grants (advisor 0028/0029).
revoke execute on function public.submit_intake(uuid) from public;
revoke execute on function public.convert_lead_to_client(uuid) from public;
grant execute on function public.submit_intake(uuid) to authenticated;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;
revoke all on function public.handle_new_user() from public;
-- capture_lead + upsert_booking remain intentionally anon-callable (marketing site + Cal webhook).

-- Public RPC for anonymous lead capture from the marketing site (SECURITY DEFINER).
create or replace function public.capture_lead(
  p_tenant uuid, p_full_name text, p_email text, p_locale text default 'en', p_source text default 'website'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_email is null or position('@' in p_email) = 0 then raise exception 'invalid_email'; end if;
  if not exists (select 1 from core.tenants t where t.id = p_tenant and t.status = 'active') then raise exception 'unknown_tenant'; end if;
  insert into core.leads (tenant_id, full_name, email, locale, source, status)
  values (p_tenant, nullif(trim(p_full_name), ''), lower(trim(p_email)), coalesce(nullif(p_locale,''),'en'), coalesce(nullif(p_source,''),'website'), 'new')
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.capture_lead(uuid,text,text,text,text) from public;
grant execute on function public.capture_lead(uuid,text,text,text,text) to anon, authenticated;

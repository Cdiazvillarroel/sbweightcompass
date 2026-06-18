-- Upsert a Cal.com booking into core: find-or-create the lead, mirror the appointment.
create or replace function public.upsert_booking(
  p_tenant uuid, p_email text, p_full_name text, p_booking_uid text,
  p_starts_at timestamptz, p_ends_at timestamptz, p_status text default 'scheduled', p_locale text default 'en'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_lead uuid; v_email text;
begin
  if p_email is null or position('@' in p_email) = 0 then raise exception 'invalid_email'; end if;
  if not exists (select 1 from core.tenants t where t.id = p_tenant and t.status = 'active') then raise exception 'unknown_tenant'; end if;
  v_email := lower(trim(p_email));
  select id into v_lead from core.leads where tenant_id=p_tenant and email=v_email and deleted_at is null order by created_at desc limit 1;
  if v_lead is null then
    insert into core.leads (tenant_id, full_name, email, locale, source, status)
    values (p_tenant, nullif(trim(p_full_name),''), v_email, coalesce(nullif(p_locale,''),'en'), 'cal.com',
            (case when p_status='cancelled' then 'new' else 'consult_booked' end)::core.lead_status) returning id into v_lead;
  else
    update core.leads set status=(case when status='converted' then status when p_status='cancelled' then status else 'consult_booked' end)::core.lead_status,
           full_name=coalesce(full_name, nullif(trim(p_full_name),'')) where id=v_lead;
  end if;
  insert into core.appointments (tenant_id, lead_id, provider, provider_booking_id, starts_at, ends_at, status)
  values (p_tenant, v_lead, 'cal.com', p_booking_uid, p_starts_at, p_ends_at,
          (case when p_status='cancelled' then 'cancelled' else 'scheduled' end)::core.appointment_status)
  on conflict (provider, provider_booking_id) do update set starts_at=excluded.starts_at, ends_at=excluded.ends_at, status=excluded.status;
  return v_lead;
end $$;
revoke all on function public.upsert_booking(uuid,text,text,text,timestamptz,timestamptz,text,text) from public;
grant execute on function public.upsert_booking(uuid,text,text,text,timestamptz,timestamptz,text,text) to anon, authenticated, service_role;

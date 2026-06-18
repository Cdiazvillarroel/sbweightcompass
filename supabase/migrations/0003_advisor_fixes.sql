-- Advisor fixes after initial provisioning.

-- 1) metric_definitions had RLS enabled but no policy
create policy staff_all on core.metric_definitions
  for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id));
create policy member_read on core.metric_definitions
  for select to authenticated using (core.is_member(tenant_id));

-- 2) pin search_path on the trigger function
alter function core.set_updated_at() set search_path = '';

-- 3) tighten audit_log insert (was WITH CHECK true)
drop policy if exists audit_insert on core.audit_log;
create policy audit_insert on core.audit_log
  for insert to authenticated
  with check (tenant_id is null or core.is_member(tenant_id));

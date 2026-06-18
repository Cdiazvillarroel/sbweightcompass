-- =====================================================================
-- ADR-0001 — Row-Level Security for the core schema
-- Two intents: "belongs to this professional's tenant" (staff) and
-- "the client sees only their own". Helpers are SECURITY DEFINER so they
-- bypass RLS internally and avoid recursive policy evaluation.
-- =====================================================================

-- ---------- Helper functions --------------------------------------------
create or replace function core.is_member(p_tenant uuid)
returns boolean language sql stable security definer set search_path = core, pg_temp as $$
  select exists (
    select 1 from core.memberships m
    where m.tenant_id = p_tenant and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function core.is_staff(p_tenant uuid)
returns boolean language sql stable security definer set search_path = core, pg_temp as $$
  select exists (
    select 1 from core.memberships m
    where m.tenant_id = p_tenant and m.user_id = auth.uid()
      and m.status = 'active' and m.role in ('owner', 'professional', 'staff')
  );
$$;

create or replace function core.my_client_id(p_tenant uuid)
returns uuid language sql stable security definer set search_path = core, pg_temp as $$
  select c.id from core.clients c
  join core.memberships m on m.id = c.membership_id
  where c.tenant_id = p_tenant and m.user_id = auth.uid()
  limit 1;
$$;

-- ---------- Enable RLS on every core table ------------------------------
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'core'
  loop
    execute format('alter table core.%I enable row level security', r.tablename);
  end loop;
end $$;

-- ---------- Tenancy & identity ------------------------------------------
create policy tenant_member_read on core.tenants
  for select to authenticated using (core.is_member(id));
create policy tenant_staff_all on core.tenants
  for all to authenticated using (core.is_staff(id)) with check (core.is_staff(id));

create policy cfg_member_read on core.tenant_config
  for select to authenticated using (core.is_member(tenant_id));
create policy cfg_staff_all on core.tenant_config
  for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id));

create policy mem_self_read on core.memberships
  for select to authenticated using (user_id = auth.uid() or core.is_staff(tenant_id));
create policy mem_staff_all on core.memberships
  for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id));

-- ---------- Staff-only tables -------------------------------------------
-- (client-facing policies are added when the client app lands in Phase 3)
do $$
declare t text;
begin
  foreach t in array array[
    'leads', 'intake_templates', 'intake_questions', 'intake_answers',
    'plan_templates', 'plan_template_items', 'plan_items', 'messages',
    'guardrail_rules', 'agent_prompts', 'risk_flags'
  ]
  loop
    execute format(
      'create policy staff_all on core.%I for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id))',
      t
    );
  end loop;
end $$;

-- ---------- Staff full + client reads own (tables with client_id) -------
do $$
declare t text;
begin
  foreach t in array array[
    'appointments', 'intake_submissions', 'plans',
    'metric_entries', 'message_threads', 'consents'
  ]
  loop
    execute format(
      'create policy staff_all on core.%I for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id))',
      t
    );
    execute format(
      'create policy client_read_own on core.%I for select to authenticated using (client_id = core.my_client_id(tenant_id))',
      t
    );
  end loop;
end $$;

-- clients: staff full; the client may read their own row
create policy clients_staff_all on core.clients
  for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id));
create policy clients_read_self on core.clients
  for select to authenticated using (id = core.my_client_id(tenant_id));

-- disclaimers: staff manage; public (anon) read of localized copy for the site
create policy disclaimers_staff_all on core.disclaimers
  for all to authenticated using (core.is_staff(tenant_id)) with check (core.is_staff(tenant_id));
create policy disclaimers_public_read on core.disclaimers
  for select to anon, authenticated using (true);

-- audit_log: append-only; staff of the tenant may read
create policy audit_staff_read on core.audit_log
  for select to authenticated using (tenant_id is not null and core.is_staff(tenant_id));
create policy audit_insert on core.audit_log
  for insert to authenticated with check (true);

-- ADR-0002: client app foundations (expose core w/ RLS, client policies, RPCs, auth link)
-- (Applied live 2026-06-18. See ADR-0002.)

alter table core.clients add column if not exists email text;
create index if not exists clients_tenant_email_idx on core.clients (tenant_id, email);

grant usage on schema core to authenticated, anon;
grant select, insert, update, delete on all tables in schema core to authenticated;
grant select on core.disclaimers to anon;
alter default privileges in schema core grant select, insert, update, delete on tables to authenticated;

create policy member_read on core.intake_templates for select to authenticated using (core.is_member(tenant_id));
create policy member_read on core.intake_questions for select to authenticated using (core.is_member(tenant_id));
create policy client_insert_own on core.metric_entries for insert to authenticated with check (client_id = core.my_client_id(tenant_id));
create policy client_insert_own on core.intake_submissions for insert to authenticated with check (client_id = core.my_client_id(tenant_id));
create policy client_update_own on core.intake_submissions for update to authenticated using (client_id = core.my_client_id(tenant_id)) with check (client_id = core.my_client_id(tenant_id));

create or replace function core.owns_submission(p_submission uuid)
returns boolean language sql stable security definer set search_path = core, pg_temp as $$
  select exists (select 1 from core.intake_submissions s where s.id = p_submission and s.client_id = core.my_client_id(s.tenant_id));
$$;
create policy client_rw_own on core.intake_answers for all to authenticated using (core.owns_submission(submission_id)) with check (core.owns_submission(submission_id));

create or replace function core.owns_plan(p_plan uuid)
returns boolean language sql stable security definer set search_path = core, pg_temp as $$
  select exists (select 1 from core.plans p where p.id = p_plan and p.client_id = core.my_client_id(p.tenant_id));
$$;
create policy client_read_own on core.plan_items for select to authenticated using (core.owns_plan(plan_id));

-- submit_intake: mark submitted + evaluate screening -> risk_flags (+ gp_clearance)
create or replace function public.submit_intake(p_submission uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid; v_client uuid; r record; v_text text;
begin
  select tenant_id, client_id into v_tenant, v_client from core.intake_submissions where id = p_submission;
  if v_tenant is null then raise exception 'unknown_submission'; end if;
  if not (core.is_staff(v_tenant) or v_client = core.my_client_id(v_tenant)) then raise exception 'forbidden'; end if;
  update core.intake_submissions set status='submitted', submitted_at=now() where id=p_submission;
  for r in select a.value, q.code from core.intake_answers a join core.intake_questions q on q.id=a.question_id
           where a.submission_id=p_submission and q.is_screening loop
    v_text := lower(coalesce(r.value::text,''));
    insert into core.risk_flags (tenant_id, client_id, level, category, rule_id, detail, status)
    select v_tenant, v_client, gr.default_level, gr.category, gr.id, 'intake:'||r.code, 'open'
    from core.guardrail_rules gr
    where gr.tenant_id=v_tenant and gr.active and v_text ~* gr.pattern
      and not exists (select 1 from core.risk_flags rf where rf.client_id=v_client and rf.rule_id=gr.id and rf.status='open');
  end loop;
  if exists (select 1 from core.intake_answers a join core.intake_questions q on q.id=a.question_id
             where a.submission_id=p_submission and q.code='medical_conditions' and a.value::text ~* '(diabetes|cardiac|thyroid|pregnancy)') then
    insert into core.risk_flags (tenant_id, client_id, level, category, detail, status)
    select v_tenant, v_client, 'amber', 'gp_clearance', 'intake:medical_conditions', 'open'
    where not exists (select 1 from core.risk_flags rf where rf.client_id=v_client and rf.category='gp_clearance' and rf.status='open');
  end if;
  update core.clients c set risk_state = (
    select case when bool_or(level='red') then 'red' when bool_or(level='amber') then 'amber' else 'green' end::core.risk_level
    from core.risk_flags where client_id=v_client and status='open') where c.id=v_client;
end $$;
grant execute on function public.submit_intake(uuid) to authenticated;

create or replace function public.convert_lead_to_client(p_lead uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid; v_email text; v_name text; v_locale text; v_client uuid;
begin
  select tenant_id, email, full_name, locale into v_tenant, v_email, v_name, v_locale from core.leads where id=p_lead;
  if v_tenant is null then raise exception 'unknown_lead'; end if;
  if not core.is_staff(v_tenant) then raise exception 'forbidden'; end if;
  select id into v_client from core.clients where tenant_id=v_tenant and lead_id=p_lead limit 1;
  if v_client is null then
    insert into core.clients (tenant_id, lead_id, email, display_name, locale, status)
    values (v_tenant, p_lead, lower(v_email), v_name, coalesce(nullif(v_locale,''),'en'), 'invited') returning id into v_client;
  end if;
  update core.leads set status='converted' where id=p_lead;
  return v_client;
end $$;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record; v_membership uuid;
begin
  for c in select * from core.clients where email = lower(new.email) and membership_id is null loop
    insert into core.memberships (tenant_id, user_id, role, status) values (c.tenant_id, new.id, 'client', 'active')
      on conflict (tenant_id, user_id) do nothing;
    select id into v_membership from core.memberships where tenant_id=c.tenant_id and user_id=new.id;
    update core.clients set membership_id=v_membership, status='active' where id=c.id;
  end loop;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, core';
notify pgrst, 'reload config';

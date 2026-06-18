-- Phase 1 (ADR-0003): self-tracking data. Seed metric definitions for tenant #1
-- and add a weekly check-in table. RLS lets clients read/write only their own.
-- (Applied live 2026-06-18.)

insert into core.metric_definitions (tenant_id, code, label, unit, value_type)
select '00000000-0000-0000-0000-000000000001', v.code, v.label::jsonb, v.unit, 'number'
from (values
  ('weight',   '{"en":"Weight","es":"Peso"}',                 'kg'),
  ('waist',    '{"en":"Waist","es":"Cintura"}',               'cm'),
  ('hip',      '{"en":"Hip","es":"Cadera"}',                  'cm'),
  ('body_fat', '{"en":"Body fat","es":"% de grasa"}',         '%'),
  ('water',    '{"en":"Water","es":"Agua"}',                  'glasses'),
  ('sleep',    '{"en":"Sleep","es":"Sueño"}',                 'h'),
  ('mood',     '{"en":"Mood","es":"Ánimo"}',                  'scale')
) as v(code, label, unit)
where not exists (
  select 1 from core.metric_definitions d
  where d.tenant_id='00000000-0000-0000-0000-000000000001' and d.code=v.code
);

create table if not exists core.check_ins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null references core.clients(id),
  week_of date not null default current_date,
  adherence int,
  energy int,
  obstacles text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists check_ins_client_idx on core.check_ins (tenant_id, client_id, week_of desc);

alter table core.check_ins enable row level security;
drop policy if exists client_rw_own on core.check_ins;
create policy client_rw_own on core.check_ins for all to authenticated
  using (client_id = core.my_client_id(tenant_id))
  with check (client_id = core.my_client_id(tenant_id));
drop policy if exists staff_read on core.check_ins;
create policy staff_read on core.check_ins for select to authenticated
  using (core.is_staff(tenant_id));
grant select, insert, update, delete on core.check_ins to authenticated;

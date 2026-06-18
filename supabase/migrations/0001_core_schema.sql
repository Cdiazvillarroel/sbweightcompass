-- =====================================================================
-- ADR-0001 — Core schema for the multi-tenant coaching platform
-- Generic CORE lives in schema `core`; the nutrition vertical in `nutrition`.
-- Hard rule: `nutrition` may reference `core`, never the reverse.
-- Every core entity carries tenant_id; isolation is enforced by RLS (0002).
-- =====================================================================

create schema if not exists core;
create schema if not exists nutrition;

-- ---------- Enums --------------------------------------------------------
create type core.membership_role as enum ('owner', 'professional', 'staff', 'client');
create type core.lead_status      as enum ('new', 'consult_booked', 'consult_done', 'converted', 'disqualified');
create type core.client_status    as enum ('invited', 'active', 'paused', 'archived');
create type core.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type core.plan_kind        as enum ('nutrition', 'exercise', 'habit', 'other');
create type core.plan_status      as enum ('draft', 'active', 'completed', 'archived');
create type core.risk_level       as enum ('green', 'amber', 'red');
create type core.consent_purpose  as enum ('intake', 'health_data', 'marketing', 'ai_processing');
create type core.message_sender   as enum ('client', 'professional', 'agent');
create type core.message_status   as enum ('draft', 'pending_review', 'sent');
create type core.question_type    as enum ('text', 'long_text', 'single_choice', 'multi_choice', 'number', 'boolean', 'date', 'scale');

-- ---------- Tenancy & identity ------------------------------------------
create table core.tenants (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  status         text not null default 'active',
  default_locale text not null default 'en',
  region         text not null default 'ap-southeast-2',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table core.tenant_config (
  tenant_id     uuid primary key references core.tenants(id) on delete cascade,
  branding      jsonb not null default '{}',   -- logo, palette, copy overrides
  scope         jsonb not null default '{}',   -- coaching scope / guardrail config
  feature_flags jsonb not null default '{}',
  updated_at    timestamptz not null default now()
);

create table core.memberships (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       core.membership_role not null,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index on core.memberships (user_id);
create index on core.memberships (tenant_id);

-- ---------- Lead -> client lifecycle ------------------------------------
create table core.leads (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  full_name  text,
  email      text,
  phone      text,
  locale     text not null default 'en',
  source     text,
  status     core.lead_status not null default 'new',
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on core.leads (tenant_id, status);

create table core.clients (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references core.tenants(id) on delete cascade,
  lead_id       uuid references core.leads(id) on delete set null,
  membership_id uuid references core.memberships(id) on delete set null, -- login (set on invite accept)
  display_name  text,
  locale        text not null default 'en',
  status        core.client_status not null default 'invited',
  risk_state    core.risk_level not null default 'green',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on core.clients (tenant_id, status);
create index on core.clients (membership_id);

-- ---------- Appointments / consultations (Cal.com mirror) ---------------
create table core.appointments (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references core.tenants(id) on delete cascade,
  lead_id             uuid references core.leads(id) on delete set null,
  client_id           uuid references core.clients(id) on delete set null,
  provider            text not null default 'cal.com',
  provider_booking_id text,
  title               text,
  starts_at           timestamptz,
  ends_at             timestamptz,
  status              core.appointment_status not null default 'scheduled',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (provider, provider_booking_id)
);
create index on core.appointments (tenant_id, starts_at);

-- ---------- Configurable intake / onboarding ----------------------------
create table core.intake_templates (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  key        text not null,
  title      jsonb not null default '{}',   -- localized { en, es }
  version    int not null default 1,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key, version)
);

create table core.intake_questions (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references core.intake_templates(id) on delete cascade,
  tenant_id   uuid not null references core.tenants(id) on delete cascade,
  code        text not null,
  prompt      jsonb not null default '{}',   -- localized
  type        core.question_type not null default 'text',
  options     jsonb not null default '[]',   -- for choice types, localized labels
  is_screening boolean not null default false, -- active medical screening -> can raise gp_clearance
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on core.intake_questions (template_id, position);

create table core.intake_submissions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references core.tenants(id) on delete cascade,
  client_id    uuid not null references core.clients(id) on delete cascade,
  template_id  uuid not null references core.intake_templates(id),
  status       text not null default 'in_progress',
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table core.intake_answers (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references core.intake_submissions(id) on delete cascade,
  question_id   uuid not null references core.intake_questions(id),
  tenant_id     uuid not null references core.tenants(id) on delete cascade,
  value         jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on core.intake_answers (submission_id);

-- ---------- Plans (generic: a plan is items) ----------------------------
create table core.plan_templates (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  title      jsonb not null default '{}',
  kind       core.plan_kind not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table core.plan_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references core.plan_templates(id) on delete cascade,
  tenant_id   uuid not null references core.tenants(id) on delete cascade,
  position    int not null default 0,
  body        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table core.plans (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references core.tenants(id) on delete cascade,
  client_id   uuid not null references core.clients(id) on delete cascade,
  template_id uuid references core.plan_templates(id) on delete set null,
  kind        core.plan_kind not null default 'other',
  status      core.plan_status not null default 'draft',
  approved_by uuid references auth.users(id),  -- human-in-the-loop sign-off
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index on core.plans (tenant_id, client_id);

create table core.plan_items (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references core.plans(id) on delete cascade,
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  position   int not null default 0,
  body       jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on core.plan_items (plan_id, position);

-- ---------- Metrics & tracking (generic) --------------------------------
create table core.metric_definitions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  code       text not null,
  label      jsonb not null default '{}',
  unit       text,
  value_type text not null default 'number',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table core.metric_entries (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references core.tenants(id) on delete cascade,
  client_id     uuid not null references core.clients(id) on delete cascade,
  metric_def_id uuid not null references core.metric_definitions(id) on delete cascade,
  value         numeric,
  value_text    text,
  recorded_at   timestamptz not null default now(),
  source        text not null default 'manual',  -- manual | wearable | agent
  created_at    timestamptz not null default now()
);
create index on core.metric_entries (tenant_id, client_id, metric_def_id, recorded_at);

-- ---------- Messaging (human-in-the-loop) -------------------------------
create table core.message_threads (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  client_id  uuid not null references core.clients(id) on delete cascade,
  subject    text,
  status     text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table core.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references core.message_threads(id) on delete cascade,
  tenant_id   uuid not null references core.tenants(id) on delete cascade,
  sender_type core.message_sender not null,
  sender_id   uuid references auth.users(id),
  body        text not null,
  ai_draft    boolean not null default false,
  approved_by uuid references auth.users(id),
  status      core.message_status not null default 'sent',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on core.messages (thread_id, created_at);

-- ---------- Consent, guardrails, audit (privacy by design) --------------
create table core.consents (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  client_id  uuid not null references core.clients(id) on delete cascade,
  purpose    core.consent_purpose not null,
  version    text not null,
  granted    boolean not null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on core.consents (tenant_id, client_id, purpose);

create table core.guardrail_rules (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references core.tenants(id) on delete cascade,
  category      text not null,   -- medical_condition | medication | eating_disorder | ...
  pattern       text not null,   -- keyword / regex supplied by the vertical module
  default_level core.risk_level not null default 'amber',
  action        text not null default 'escalate', -- escalate | refer | block_plan
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table core.risk_flags (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references core.tenants(id) on delete cascade,
  client_id   uuid not null references core.clients(id) on delete cascade,
  level       core.risk_level not null,
  category    text not null,
  rule_id     uuid references core.guardrail_rules(id) on delete set null,
  detail      text,
  status      text not null default 'open',  -- open | acknowledged | resolved
  resolved_by uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on core.risk_flags (tenant_id, client_id, status);

create table core.agent_prompts (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  agent_key  text not null,   -- cooking | comms | social
  prompt     jsonb not null default '{}',
  version    int not null default 1,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, agent_key, version)
);

create table core.disclaimers (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references core.tenants(id) on delete cascade,
  key        text not null,
  body       jsonb not null default '{}',   -- localized
  placement  text,   -- footer | intake | plan | ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key)
);

create table core.audit_log (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references core.tenants(id) on delete set null,
  actor      uuid references auth.users(id),
  action     text not null,
  entity     text,
  entity_id  uuid,
  meta       jsonb not null default '{}',
  at         timestamptz not null default now()
);
create index on core.audit_log (tenant_id, at);

-- ---------- updated_at automation ---------------------------------------
create or replace function core.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare r record;
begin
  for r in
    select table_name from information_schema.columns
    where table_schema = 'core' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger set_updated_at before update on core.%I for each row execute function core.set_updated_at()',
      r.table_name
    );
  end loop;
end $$;

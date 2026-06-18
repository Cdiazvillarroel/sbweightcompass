-- =====================================================================
-- Seed: SB My Weight Compass as tenant #1 (config-as-data).
-- Idempotent: safe to re-run.
-- =====================================================================

-- Tenant #1
insert into core.tenants (id, name, slug, default_locale, region)
values ('00000000-0000-0000-0000-000000000001',
        'SB My Weight Compass', 'sb-my-weight-compass', 'en', 'ap-southeast-2')
on conflict (id) do nothing;

-- Branding + scope as data (white-label-ready)
insert into core.tenant_config (tenant_id, branding, scope, feature_flags)
values (
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'name', 'SB My Weight Compass',
    'motif', 'compass',
    'palette', jsonb_build_object(
      'green600', '#0EA672', 'green700', '#0B3D33',
      'green50', '#ECFBF4', 'amber', '#E0A340'
    )
  ),
  jsonb_build_object('type', 'weight_lifestyle_coaching', 'clinical', false, 'country', 'AU'),
  jsonb_build_object('cooking_assistant', false, 'wearables', false, 'community', false)
)
on conflict (tenant_id) do nothing;

-- Footer disclaimer (coaching, not clinical) — bilingual
insert into core.disclaimers (tenant_id, key, body, placement)
values (
  '00000000-0000-0000-0000-000000000001', 'footer',
  jsonb_build_object(
    'en', 'SB My Weight Compass provides non-clinical lifestyle and weight coaching. It is not medical advice, diagnosis or treatment. Always consult your GP or a qualified health professional about your individual circumstances.',
    'es', 'SB My Weight Compass ofrece coaching de estilo de vida y peso de carácter no clínico. No es consejo médico, diagnóstico ni tratamiento. Consulta siempre a tu médico (GP) o a un profesional de salud calificado sobre tu situación individual.'
  ),
  'footer'
)
on conflict (tenant_id, key) do nothing;

-- Onboarding / intake template
insert into core.intake_templates (tenant_id, key, title, version, active)
values (
  '00000000-0000-0000-0000-000000000001', 'onboarding',
  jsonb_build_object('en', 'Onboarding & health screening', 'es', 'Onboarding y screening de salud'),
  1, true
)
on conflict (tenant_id, key, version) do nothing;

-- Screening questions (active screening raises GP-clearance flags downstream)
insert into core.intake_questions (template_id, tenant_id, code, prompt, type, options, is_screening, position)
select t.id, t.tenant_id, 'medical_conditions',
  jsonb_build_object('en', 'Do you have any diagnosed medical conditions?', 'es', '¿Tienes alguna condición médica diagnosticada?'),
  'multi_choice',
  jsonb_build_array(
    jsonb_build_object('value','diabetes','en','Diabetes','es','Diabetes'),
    jsonb_build_object('value','cardiac','en','Heart condition','es','Condición cardíaca'),
    jsonb_build_object('value','thyroid','en','Thyroid condition','es','Condición de tiroides'),
    jsonb_build_object('value','pregnancy','en','Pregnant / breastfeeding','es','Embarazo / lactancia'),
    jsonb_build_object('value','none','en','None of the above','es','Ninguna de las anteriores')
  ),
  true, 1
from core.intake_templates t
where t.tenant_id = '00000000-0000-0000-0000-000000000001' and t.key = 'onboarding' and t.version = 1
  and not exists (select 1 from core.intake_questions q where q.template_id = t.id and q.code = 'medical_conditions');

insert into core.intake_questions (template_id, tenant_id, code, prompt, type, options, is_screening, position)
select t.id, t.tenant_id, 'medications',
  jsonb_build_object('en', 'Are you currently taking any medications?', 'es', '¿Tomas algún medicamento actualmente?'),
  'long_text', '[]'::jsonb, true, 2
from core.intake_templates t
where t.tenant_id = '00000000-0000-0000-0000-000000000001' and t.key = 'onboarding' and t.version = 1
  and not exists (select 1 from core.intake_questions q where q.template_id = t.id and q.code = 'medications');

insert into core.intake_questions (template_id, tenant_id, code, prompt, type, options, is_screening, position)
select t.id, t.tenant_id, 'ed_history',
  jsonb_build_object('en', 'Have you ever had a relationship with food or eating that worried you?', 'es', '¿Has tenido alguna vez una relación con la comida que te preocupara?'),
  'boolean', '[]'::jsonb, true, 3
from core.intake_templates t
where t.tenant_id = '00000000-0000-0000-0000-000000000001' and t.key = 'onboarding' and t.version = 1
  and not exists (select 1 from core.intake_questions q where q.template_id = t.id and q.code = 'ed_history');

insert into core.intake_questions (template_id, tenant_id, code, prompt, type, options, is_screening, position)
select t.id, t.tenant_id, 'primary_goal',
  jsonb_build_object('en', 'What is your main goal right now?', 'es', '¿Cuál es tu meta principal ahora mismo?'),
  'long_text', '[]'::jsonb, false, 4
from core.intake_templates t
where t.tenant_id = '00000000-0000-0000-0000-000000000001' and t.key = 'onboarding' and t.version = 1
  and not exists (select 1 from core.intake_questions q where q.template_id = t.id and q.code = 'primary_goal');

-- Guardrail rules (coaching-not-clinical). Patterns are illustrative starters.
insert into core.guardrail_rules (tenant_id, category, pattern, default_level, action)
select v.tenant_id::uuid, v.category, v.pattern, v.level::core.risk_level, v.action
from (values
  ('00000000-0000-0000-0000-000000000001', 'eating_disorder', 'anorexi|bulimi|purg|laxative|starv', 'red', 'refer'),
  ('00000000-0000-0000-0000-000000000001', 'medical_condition', 'diabet|cardiac|pregnan|thyroid|kidney', 'amber', 'escalate'),
  ('00000000-0000-0000-0000-000000000001', 'medication', 'insulin|warfarin|chemo|steroid', 'amber', 'escalate')
) as v(tenant_id, category, pattern, level, action)
where not exists (
  select 1 from core.guardrail_rules g
  where g.tenant_id = v.tenant_id::uuid and g.category = v.category and g.pattern = v.pattern
);

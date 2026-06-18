-- ADR-0002 follow-up: optimized bilingual onboarding (v2) from the real Client Profile Questionnaire.
-- Deactivates v1, seeds v2 (11 questions, 3 screening), broadens the medical guardrail + GP-clearance.
-- (Applied live 2026-06-18. Full question seed is in the live DB; see core.intake_questions for template v2.)

update core.intake_templates set active = false
 where tenant_id = '00000000-0000-0000-0000-000000000001' and key = 'onboarding' and version = 1;

insert into core.intake_templates (tenant_id, key, title, version, active)
values ('00000000-0000-0000-0000-000000000001', 'onboarding',
  jsonb_build_object('en','Onboarding & health profile','es','Onboarding y perfil de salud'), 2, true)
on conflict (tenant_id, key, version) do update set active = true, title = excluded.title;

-- v2 questions: primary_goals(multi), goal_weight(number), activity_level(single), exercise_now(long_text),
-- body_type(single), medical_conditions(multi, SCREENING), medications(long_text, SCREENING),
-- ed_history(boolean, SCREENING), injuries(long_text), lifestyle_notes(long_text), accountability(text).
-- (Seeded with bilingual prompts/options; see live DB.)

update core.guardrail_rules
set pattern = 'heart_disease|hypertension|diabet|hypoglyc|thyroid|liver|kidney|pancrea|anemia|pregnan'
where tenant_id = '00000000-0000-0000-0000-000000000001' and category = 'medical_condition';

-- submit_intake gp_clearance detection broadened to the v2 condition values (function body in 0006 + this update).

# ADR-0003 — Client app roadmap & information architecture

Status: Accepted (2026-06-18)
Context: Builds on ADR-0001 (core data model) and ADR-0002 (client app auth & onboarding). Onboarding (the redesigned multi-step wizard) is live; this ADR defines what the authenticated client app becomes over the 3–6 month coaching relationship.

## Decision

The client app is the ongoing engagement surface between sessions. It serves two goals at once: keep the client following their plan, logging progress and feeling supported; and free up the coach's time (the product North Star — 24/7 assistance that handles routine work and surfaces only what needs a human). All client-facing capability stays within the coaching-not-clinical guardrail.

### Information architecture (5 sections)

1. **Mi cuerpo** (body / composition)
   - Weight → trend curve vs. onboarding goal.
   - Anthropometry dashboard (waist, hip, body-fat %, BMI, trends).
   - Daily habits (water, sleep, mood).
   - Wearables → device data turned into readable insights (deferred to Phase 3; aggregator).
2. **Nutrición**
   - Requirements from assessment — presented as *orientative guidance, not clinical prescription* (guardrail).
   - Meal plan (coach-authored).
   - Recipe library.
   - Calorie/meal logger (heavier build; food DB or photo+AI; Phase 3).
   - Grocery guidance (ships with the plan; part of Premium).
3. **Movimiento** (movement / exercise)
   - Steps & calories burned (from wearable; Phase 3).
   - Training plan (coach-authored).
   - Exercise library with demos; workout logging; streak.
4. **Planificación / Mi coach**
   - Agenda — upcoming appointments (Cal.com, already integrated) + rebook link.
   - Meeting minutes (coach-authored after each session).
   - Plan + progress summary.
5. **Mi perfil**
   - Account details and goals (editable).
   - Membership — package status (Basic/Premium), dates, what's included (read-only).
   - Billing — payment processing is OUT OF SCOPE for now (no prices set, no Stripe). Show membership status only; real billing is a later phase.

Cross-cutting (Phase 3): an AI assistant (coaching, non-clinical, traffic-light guardrail: green answers / amber escalates to coach / red refers) and coach messaging via Telegram/WhatsApp.

### Phasing

- **Phase 1 — Self-tracking (client-only, no coach-panel dependency).** Home dashboard, Mi cuerpo (weight curve + anthropometry + daily habits), weekly check-in, Agenda (read), Mi perfil + membership (read). Produces the data later consumed by the AI and the coach panel.
- **Phase 2 — Plans (needs a minimal coach panel).** Coach authors nutrition/training plans → `plan_items`; client sees "Mi plan" and marks adherence. Recipe library, grocery guidance, meeting minutes. This minimal coach surface is the first brick of the full professional panel.
- **Phase 3 — AI assistant + wearables + calorie logger + real billing.** Highest leverage on the North Star; sequenced last because it is most valuable with profile + tracking + plan as context, and carries the largest risk surface (model choice, key custody, clinical guardrail).

### Data model

- Reuse `core.metric_entries` (+ `core.metric_definitions`) for weight, anthropometry and habits. Seed definitions for tenant #1: `weight, waist, hip, body_fat, water, sleep, mood`. RLS already allows client read/write of own entries.
- Add `core.check_ins` (weekly): adherence, energy, obstacles, notes — RLS client read/write own, staff read.
- Plans use existing `core.plans` / `core.plan_items` (Phase 2).
- Appointments already populated by the Cal.com webhook (`core.appointments`).

### Guardrails / non-goals (unchanged)

- Coaching, not clinical: nutrition "requirements" are orientative ranges with a disclaimer; the AI never gives clinical advice and follows the traffic-light escalation.
- Not building yet: professional self-signup, billing to professionals (Stripe Connect), marketplace, white-label engine, super-admin, client payment processing.

## Consequences

Phase 1 ships fast and is self-contained; each phase leaves the next ready (tracking feeds the AI; the Phase 2 minimal panel starts the professional panel). The dependency to watch: "Mi plan" requires coach authoring, so Phase 2 pulls in a thin slice of the coach side rather than the full panel.

# Brand direction — modern compass identity (proposal)

> Status: **DRAFT FOR REVIEW** · Date: 2026-06-18
> Brief: keep the **compass** concept from SB My Weight Compass, but evolve it into something conceptually more modern. This is a starting point to react to, not a final identity. Hex values are a proposed palette to refine against the real logo if/when we want exact continuity.

## Concept — "True North"

The compass stays, but we abstract it. Instead of a literal nautical compass, the mark is a **single wayfinding needle** resolving toward north — the client's goal. It ties directly to the product **North Star** ("give the professional their time back") and to the name (*Weight Compass*): the platform is the instrument that keeps each client pointed at their goal while the human steers only when it matters.

Visual language: geometric, minimal, lots of breathing room, one confident needle, a soft circular bezel. The needle can double as a live element — a progress/loading indicator that "finds north," and a subtle motif in empty states and the traffic-light status.

## Palette (proposed)

**Brand greens** — fresher and slightly teal-leaning, away from the generic "wellness sage."

| Token | Hex | Use |
|---|---|---|
| `compass-green-700` (True North ink) | `#0B3D33` | Dark surfaces, headings on light |
| `compass-green-600` (Primary) | `#0EA672` | Primary actions, brand fills |
| `compass-green-500` | `#15B981` | Hover, accents |
| `compass-green-200` | `#A7E8CF` | Tints, chips, illustrations |
| `compass-green-50` | `#ECFBF4` | Backgrounds, surfaces |

**Accent — wayfinding needle**

| Token | Hex | Use |
|---|---|---|
| `wayfinding-amber` | `#E0A340` | The needle highlight, sparing accents, CTAs that aren't primary |

**Neutrals — warm, not cold**

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#11201C` | Body text |
| `ink-500` | `#5C6B66` | Secondary text |
| `line-200` | `#E3E8E6` | Borders, dividers |
| `surface-0` | `#FFFFFF` | Base surface |

**Semantic traffic-light** (the coaching-not-clinical guardrail — kept distinct from brand green so "go" never gets confused with "brand")

| Token | Hex | Meaning |
|---|---|---|
| `status-green` | `#16A34A` | Go / on track |
| `status-amber` | `#D97706` | Caution / needs review (e.g. GP clearance pending) |
| `status-red` | `#DC2626` | Stop / escalate / refer |

## Typography (proposed)

- **Display / headings:** a modern geometric-humanist sans (e.g. *Geist*, *Inter Display*, or *Hanken Grotesk*) — clean, confident, free, EN/ES coverage.
- **Body:** *Inter* — excellent legibility, full Latin-extended for Spanish.
- Bilingual rule: every type ramp must look right in both EN and ES (Spanish runs longer — components and tokens are designed with that slack).

## How this maps to the build

These become Figma design tokens and Tailwind theme variables, consumed by Next.js. The compass needle ships as an SVG component reused for the logo, the loading state, and the traffic-light status indicator. Branding is stored in `tenant_config.branding` (config-as-data) so a future tenant can re-skin without code changes.

See `compass-mark-concept.svg` for a first sketch of the modern mark.

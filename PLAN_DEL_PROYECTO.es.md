# Plan del proyecto — Plataforma de apoyo para coaching (nombre de trabajo: **Compass**)

> Estado: **BORRADOR PARA REVISIÓN** · Responsable: Claudio · Fecha: 2026-06-18
> Primer tenant: **SB My Weight Compass** (Sebastián Barrón — coach de peso y estilo de vida, AU, EN/ES, no clínico)
> Nada de este plan se construye hasta que lo apruebes. La documentación, el código, el esquema y los commits van en inglés; el contenido de producto es bilingüe EN/ES. *(Esta es una copia en español para lectura; la versión oficial es la inglesa.)*

---

## 1. North Star

**Devolverle el tiempo al profesional.** Mover el seguimiento rutinario y asíncrono de clientes a agentes de IA que operan 24/7, para que el tiempo sincrónico del profesional quede reservado solo para lo que requiere criterio humano y relación.

Cada decisión del roadmap se juzga con una pregunta: *¿esto saca carga asíncrona del humano, o protege su tiempo sincrónico de alto valor?*

---

## 2. Frame estratégico (esto define la arquitectura)

Hecho a medida para Sebastián, pero diseñado como **SaaS multi-tenant** para profesionales independientes y creadores de contenido. En concreto:

- **Multi-tenant desde el día 1, un solo tenant activo.** Sebastián se siembra como tenant #1. Cada entidad del núcleo lleva una referencia `coach_id` / tenant; RLS aplica el aislamiento desde la primera migración.
- **CORE genérico vs MÓDULOS verticales.** Una costura limpia entre el motor reutilizable y el comportamiento específico de nutrición que pertenece al tenant de Sebastián. La vertical de nutrición es un *módulo del tenant*, nunca parte del core.
- **Las reglas del profesional son DATOS, no código.** Scope, preguntas de intake, disclaimers, plantillas de plan, prompts de agentes y branding viven en tablas de configuración — así un segundo tenant es un ejercicio de configuración, no un fork de código, y el white-label queda posible más adelante.

### Mapa core vs módulo vertical

| CORE GENÉRICO (motor reutilizable) | MÓDULO VERTICAL — Nutrición (tenant SB) |
|---|---|
| Tenant / profesional, branding y config | Estructura y plantillas del plan nutricional |
| Registros de cliente, ciclo lead→cliente | Asistente de cocina con IA + datos de alimentos **AUSNUT** |
| Citas / consultas (Cal.com) | Checklist de screening de condiciones médicas (intake) |
| Motor configurable de intake/onboarding | Estructura del plan de ejercicio |
| Entrega de contenido (planes, recursos) | Modelo de dominio del recetario |
| Motor de seguimiento por IA (scheduling, gatillos, escalada) | Mapeo de wearables → métricas de peso/estilo de vida |
| Mensajería (cliente↔profesional, humano en el loop) | Guardrails de seguridad ante trastornos alimentarios (reglas de dominio) |
| Marco de métricas y seguimiento (genérico) | Disclaimers y lógica de derivación (copy) |
| Consentimiento, auditoría, export/borrado de datos | |
| Guardrail de alcance tipo semáforo (transversal) | |

> La línea que hay que sostener: el core sabe de *"una métrica seguida"*, *"un plan hecho de ítems"*, *"un intake hecho de preguntas"*. **No** sabe qué es un macro, una receta o un clearance del GP — eso es asunto del módulo de nutrición.

---

## 3. Stack y residencia

- **Frontend / app:** Next.js en **Vercel** (deploy preview por PR).
- **Control de versiones:** **GitHub**, trunk-based con PRs.
- **Backend:** **Supabase** — Postgres, Auth, RLS, Realtime, Storage, Edge Functions — aprovisionado en la región **Australia (Sídney)** por residencia de datos.
- **Diseño:** sistema de diseño en **Figma** (tokens + componentes), identidad de brújula moderna.
- **Pagos (fase posterior):** **Stripe** para los paquetes del cliente (Basic 3 meses, Premium 6 meses) + add-ons.

---

## 4. Roadmap por fases

Secuenciado para que el valor llegue temprano y el modelo de datos quede estable. **Hacemos checkpoint en cada hito**, y cualquier cambio al modelo de datos o al alcance dispara una ADR + una pausa.

### Fase 0 — Fundaciones (infra + sistema de diseño)
Repo en GitHub, app Next.js, preview en Vercel, Supabase (Sídney) con Auth + RLS base + scaffolding de i18n, Sebastián sembrado como tenant #1. Tokens + componentes base en Figma desde la identidad de brújula moderna.
*Salida:* un shell bilingüe desplegado que prueba la espina multi-tenant + RLS + i18n.

### Fase 1 — Comercial (puerta de entrada que genera ingresos) ⭐ primer valor real
Sitio público bilingüe: landing de marketing → **agenda de consulta inicial gratuita (Cal.com)** → **captura de leads** → **formulario de onboarding/intake** (motor configurable, con el checklist de screening médico del módulo de nutrición). El coach puede ver los leads capturados.
*Salida:* un lead real puede encontrar el sitio, agendar la consulta gratis y enviar el intake; el coach lo recibe.

### Fase 2 — Panel del profesional (el motor de "devolver tiempo", v1)
Gestión de clientes + CRM ligero, conversión lead→cliente, KPIs, alertas de clientes en riesgo, brief pre-consulta y resumen+plan post-consulta generados por IA (aprobación con humano en el loop).

### Fase 3 — App del cliente
Resultados del onboarding, plan nutricional + de ejercicio, recetario + asistente de cocina con IA, metas y seguimiento, wearables.

### Fase 4 — Agentes de IA (motor asíncrono completo)
Asistente de cocina, agente de comunicación cliente↔profesional (humano en el loop), automatización de RRSS. Aquí es donde el North Star se realiza más plenamente.

### Fase 5 — Monetización
Stripe para paquetes del cliente + add-ons (Basic/Premium).

### Fase 6 — Comunidad
Funcionalidades de comunidad (fase posterior).

> El fraseo por fases es sobre *secuencia*, no un compromiso de construirlo todo ahora. Solo construimos Fase 0 + Fase 1 tras aprobar este plan; cada fase posterior tiene su propio pase de plan/ADR.

---

## 5. Principios de arquitectura no negociables

1. **Tenant en cada entidad del core.** FK `coach_id` / tenant en todo; RLS escrito como *"pertenece a este profesional"* y *"el cliente ve solo lo suyo"*.
2. **Reglas como datos.** Scope, preguntas de intake, disclaimers, plantillas de plan, prompts de agentes, branding → tablas de config. Nada específico del tenant está hardcodeado.
3. **Bilingüe desde el esquema.** i18n EN/ES diseñado dentro del almacenamiento de contenido, no añadido encima.
4. **Privacidad por diseño.** Los datos de salud = información sensible bajo el **Privacy Act federal** y el **Health Records Act de Victoria**. RLS, cifrado, registro de consentimiento, residencia en AU, auditoría y export/borrado de datos son de primera clase.
5. **Humano en el loop** en todo lo clínico-adyacente o publicable.

---

## 6. "Coaching, no clínico" — guardrail de producto

- Un modelo **semáforo verde / ámbar / rojo** aplicado tanto al profesional como a los agentes de IA.
- Los agentes **nunca dan consejo clínico**; detectan gatillos (condiciones médicas, medicación, lenguaje de trastorno alimentario) y **escalan / derivan**.
- El checklist de condiciones médicas del intake es **screening activo** → levanta una **bandera de "clearance del GP"**.
- Disclaimers y lógica de derivación son **visibles por diseño**; los guardrails de seguridad ante trastornos alimentarios están integrados, no son opcionales.

Esto se implementa como un concern transversal del core (el estado del semáforo + el ruteo de escalada) al que el módulo de nutrición le aporta las reglas de gatillo.

---

## 7. Lo que explícitamente NO construimos todavía

Self-signup de profesionales, billing a profesionales (Stripe Connect), marketplace, motor white-label, super-admin. **El branding queda en config** para que el white-label siga siendo posible después sin rehacer trabajo.

---

## 8. Forma de trabajar

- **Primero plan, después ejecución incremental.** Commit a GitHub vía PRs, deploys de preview en Vercel, checkpoint con Claudio en cada hito.
- **Decisiones registradas como ADRs** en `docs/adr/`.
- **Regla de detenerse y preguntar:** cualquier decisión que cambie el modelo de datos o el alcance → pausa y confirma antes de seguir.

---

## 9. Próximos pasos inmediatos (solo tras aprobar este plan + la ADR-0001)

1. Aprovisionar repo en GitHub + app Next.js + preview en Vercel.
2. Aprovisionar proyecto Supabase en **Sídney**, aplicar la migración del esquema core de la ADR-0001 con RLS, sembrar a Sebastián como tenant #1.
3. Levantar tokens + componentes base en Figma desde la dirección de brújula aprobada.
4. Arrancar la Fase 1 (comercial).

**Los puntos abiertos que necesitan tu visto bueno están al final de la ADR-0001.**

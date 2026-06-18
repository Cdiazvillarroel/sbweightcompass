# ADR-0003 — Roadmap y arquitectura de la app del cliente

Estado: Aceptado (2026-06-18)
Contexto: Continúa el ADR-0001 (modelo de datos core) y el ADR-0002 (auth y onboarding de la app del cliente). El onboarding (el nuevo wizard de varios pasos) ya está en producción; este ADR define en qué se convierte la app del cliente autenticada durante la relación de coaching de 3–6 meses.

## Decisión

La app del cliente es la superficie de acompañamiento entre sesiones. Persigue dos objetivos a la vez: que el cliente siga su plan, registre su progreso y se sienta acompañado; y liberar tiempo del coach (el North Star del producto — asistencia 24/7 que resuelve lo rutinario y solo eleva al humano lo que lo requiere). Toda capacidad de cara al cliente se mantiene dentro del guardrail "coaching, no clínico".

### Arquitectura de información (5 secciones)

1. **Mi cuerpo** (composición corporal)
   - Peso → curva de tendencia vs. la meta del onboarding.
   - Dashboard de antropometría (cintura, cadera, % grasa, IMC, tendencias).
   - Hábitos diarios (agua, sueño, ánimo).
   - Wearables → data del dispositivo convertida en insights legibles (Fase 3; agregador).
2. **Nutrición**
   - Requerimientos según evaluación — presentados como *guía orientativa, no prescripción clínica* (guardrail).
   - Plan alimenticio (lo crea el coach).
   - Recetario.
   - Medidor de calorías/comidas (build pesado; base de alimentos o foto+IA; Fase 3).
   - Lista de compras / grocery guidance (acompaña al plan; parte de Premium).
3. **Movimiento** (ejercicio)
   - Pasos y calorías quemadas (desde wearable; Fase 3).
   - Plan de entrenamiento (lo crea el coach).
   - Biblioteca de ejercicios con demos; registro de entrenos; racha.
4. **Planificación / Mi coach**
   - Agenda — próximas citas (Cal.com, ya integrado) + link para reagendar.
   - Minutas de reunión (las escribe el coach tras cada sesión).
   - Resumen de plan + progreso.
5. **Mi perfil**
   - Datos de cuenta y objetivos (editables).
   - Membresía — estado del paquete (Basic/Premium), fechas, qué incluye (solo lectura).
   - Facturación — el procesamiento de pagos está FUERA DE ALCANCE por ahora (sin precios ni Stripe). Solo se muestra el estado de la membresía; el cobro real es una fase posterior.

Transversal (Fase 3): asistente IA (coaching, no clínico, semáforo: verde responde / ámbar escala al coach / rojo deriva) y mensajería con el coach vía Telegram/WhatsApp.

### Fases

- **Fase 1 — Seguimiento (solo cliente, sin depender del panel del coach).** Home, Mi cuerpo (curva de peso + antropometría + hábitos diarios), check-in semanal, Agenda (lectura), Mi perfil + membresía (lectura). Genera los datos que luego consumen la IA y el panel del coach.
- **Fase 2 — Planes (requiere un panel mínimo del coach).** El coach crea planes de nutrición/entrenamiento → `plan_items`; el cliente ve "Mi plan" y marca cumplimiento. Recetario, lista de compras, minutas. Este mínimo del lado coach es el primer ladrillo del panel del profesional completo.
- **Fase 3 — Asistente IA + wearables + medidor de calorías + facturación real.** Máxima palanca del North Star; va al final porque rinde más con perfil + tracking + plan como contexto, y por su mayor superficie de riesgo (elección de modelo, custodia de llaves, guardrail clínico).

### Modelo de datos

- Reutilizar `core.metric_entries` (+ `core.metric_definitions`) para peso, antropometría y hábitos. Semilla de definiciones para el tenant #1: `weight, waist, hip, body_fat, water, sleep, mood`. La RLS ya permite al cliente leer/escribir sus propios registros.
- Agregar `core.check_ins` (semanal): adherencia, energía, obstáculos, notas — RLS cliente lee/escribe lo suyo, staff lee.
- Los planes usan `core.plans` / `core.plan_items` existentes (Fase 2).
- Las citas ya las puebla el webhook de Cal.com (`core.appointments`).

### Guardrails / no-objetivos (sin cambios)

- Coaching, no clínico: los "requerimientos" de nutrición son rangos orientativos con disclaimer; la IA nunca da consejo clínico y sigue la escalada del semáforo.
- Aún no se construye: alta de profesionales por su cuenta, cobro a profesionales (Stripe Connect), marketplace, motor white-label, super-admin, procesamiento de pagos del cliente.

## Consecuencias

La Fase 1 se entrega rápido y es autocontenida; cada fase deja lista la siguiente (el tracking alimenta a la IA; el panel mínimo de la Fase 2 inicia el panel del profesional). La dependencia a vigilar: "Mi plan" requiere autoría del coach, así que la Fase 2 incorpora una rebanada delgada del lado coach en vez del panel completo.

# Dirección de marca — identidad de brújula moderna (propuesta)

> Estado: **BORRADOR PARA REVISIÓN** · Fecha: 2026-06-18
> *(Copia en español para lectura. Versión oficial del repo: `brand-direction.md`.)*
> Brief: mantener el concepto de **brújula** de SB My Weight Compass, pero evolucionarlo a algo conceptualmente más moderno. Esto es un punto de partida para reaccionar, no una identidad final. Los valores hex son una paleta propuesta para afinar contra el logo real si queremos continuidad exacta.

## Concepto — "True North"

La brújula se queda, pero la abstraemos. En vez de una brújula náutica literal, el mark es una **única aguja de orientación** resolviendo hacia el norte — la meta del cliente. Se conecta directamente con el **North Star** del producto ("devolverle el tiempo al profesional") y con el nombre (*Weight Compass*): la plataforma es el instrumento que mantiene a cada cliente apuntado a su meta, mientras el humano solo toma el timón cuando importa.

Lenguaje visual: geométrico, minimal, mucho aire, una aguja segura, un bisel circular suave. La aguja puede funcionar como elemento vivo — un indicador de progreso/carga que "encuentra el norte", y un motivo sutil en estados vacíos y en el semáforo de estado.

## Paleta (propuesta)

**Verdes de marca** — más frescos y ligeramente hacia el teal, lejos del genérico "sage de wellness".

| Token | Hex | Uso |
|---|---|---|
| `compass-green-700` (tinta True North) | `#0B3D33` | Superficies oscuras, títulos sobre claro |
| `compass-green-600` (Primario) | `#0EA672` | Acciones primarias, rellenos de marca |
| `compass-green-500` | `#15B981` | Hover, acentos |
| `compass-green-200` | `#A7E8CF` | Tintes, chips, ilustraciones |
| `compass-green-50` | `#ECFBF4` | Fondos, superficies |

**Acento — aguja de orientación**

| Token | Hex | Uso |
|---|---|---|
| `wayfinding-amber` | `#E0A340` | El destaque de la aguja, acentos puntuales, CTAs no primarios |

**Neutros — cálidos, no fríos**

| Token | Hex | Uso |
|---|---|---|
| `ink-900` | `#11201C` | Texto del cuerpo |
| `ink-500` | `#5C6B66` | Texto secundario |
| `line-200` | `#E3E8E6` | Bordes, divisores |
| `surface-0` | `#FFFFFF` | Superficie base |

**Semáforo semántico** (el guardrail de coaching-no-clínico — mantenido distinto del verde de marca para que "go" nunca se confunda con "marca")

| Token | Hex | Significado |
|---|---|---|
| `status-green` | `#16A34A` | Avanza / en camino |
| `status-amber` | `#D97706` | Precaución / necesita revisión (p. ej. clearance del GP pendiente) |
| `status-red` | `#DC2626` | Detente / escala / deriva |

## Tipografía (propuesta)

- **Display / títulos:** una sans geométrica-humanista moderna (p. ej. *Geist*, *Inter Display* o *Hanken Grotesk*) — limpia, segura, gratuita, con cobertura EN/ES.
- **Cuerpo:** *Inter* — excelente legibilidad, latín extendido completo para el español.
- Regla bilingüe: cada escala tipográfica debe verse bien en EN y ES (el español corre más largo — los componentes y tokens se diseñan con ese margen).

## Cómo mapea esto al build

Estos se vuelven tokens de diseño en Figma y variables de tema de Tailwind, consumidos por Next.js. La aguja de brújula se entrega como un componente SVG reutilizado para el logo, el estado de carga y el indicador de estado del semáforo. El branding se guarda en `tenant_config.branding` (config-as-data) para que un futuro tenant pueda re-skinear sin cambios de código.

Ver `compass-mark-concept.svg` para un primer boceto del mark moderno.

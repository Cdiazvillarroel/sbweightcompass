type Props = {
  size?: number;
  className?: string;
};

/**
 * "True North" compass mark — a single wayfinding needle resolving toward north.
 * Brand identity primitive, reused for the logo, loading states and status.
 */
export function CompassMark({ size = 48, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      role="img"
      aria-label="SB My Weight Compass"
      className={className}
    >
      <circle
        cx="120"
        cy="120"
        r="78"
        fill="none"
        stroke="var(--compass-green-600)"
        strokeWidth="10"
      />
      <g stroke="var(--compass-green-700)" strokeWidth="4" strokeLinecap="round" opacity="0.55">
        <line x1="120" y1="30" x2="120" y2="44" />
        <line x1="120" y1="196" x2="120" y2="210" />
        <line x1="30" y1="120" x2="44" y2="120" />
        <line x1="196" y1="120" x2="210" y2="120" />
      </g>
      <polygon points="120,52 138,120 120,128 102,120" fill="var(--wayfinding-amber)" />
      <polygon points="120,188 138,120 120,112 102,120" fill="var(--compass-green-700)" />
      <circle cx="120" cy="120" r="9" fill="#ffffff" stroke="var(--compass-green-700)" strokeWidth="3" />
    </svg>
  );
}

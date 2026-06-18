type Props = {
  size?: number;
  className?: string;
};

/**
 * SB My Weight Compass — official logo ("True North" compass).
 * Wayfinding arrow (dark-green / emerald halves, amber tip) inside a compass
 * ring with cardinal points. Reused for the logo, favicon and brand marks.
 */
export function CompassMark({ size = 48, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      role="img"
      aria-label="SB My Weight Compass"
      className={className}
    >
      <path d="M 138.01 64.79 A 64 64 0 0 1 191.21 117.99" stroke="#A7E8CF" strokeWidth={6} />
      <path d="M 191.21 138.01 A 64 64 0 0 1 138.01 191.21" stroke="#A7E8CF" strokeWidth={6} />
      <path d="M 117.99 191.21 A 64 64 0 0 1 64.79 138.01" stroke="#A7E8CF" strokeWidth={6} />
      <path d="M 64.79 117.99 A 64 64 0 0 1 117.99 64.79" stroke="#A7E8CF" strokeWidth={6} />
      <path d="M 141.45 43.06 A 86 86 0 0 1 212.94 114.55" stroke="#1E9E72" strokeWidth={11} />
      <path d="M 212.94 141.45 A 86 86 0 0 1 141.45 212.94" stroke="#1E9E72" strokeWidth={11} />
      <path d="M 114.55 212.94 A 86 86 0 0 1 43.06 141.45" stroke="#1E9E72" strokeWidth={11} />
      <path d="M 43.06 114.55 A 86 86 0 0 1 114.55 43.06" stroke="#1E9E72" strokeWidth={11} />
      <polygon points="230,128 184,120 150,128 184,136" fill="#1E9E72" />
      <polygon points="26,128 72,120 106,128 72,136" fill="#1E9E72" />
      <polygon points="128,232 120,188 128,158 136,188" fill="#1E9E72" />
      <polygon points="128,34 72,198 128,166" fill="#0B3D33" />
      <polygon points="128,34 184,198 128,166" fill="#2BA876" />
      <polygon points="128,34 106.15,98 128,98" fill="#D2922F" />
      <polygon points="128,34 149.85,98 128,98" fill="#E8A94A" />
    </svg>
  );
}

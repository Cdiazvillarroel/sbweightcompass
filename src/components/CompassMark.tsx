type Props = {
  size?: number;
  className?: string;
};

/**
 * SB My Weight Compass — official brand logo.
 * Renders the official logo asset (public/logo.svg).
 */
export function CompassMark({ size = 48, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt="SB My Weight Compass"
      className={className}
    />
  );
}

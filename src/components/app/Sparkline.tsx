type P = { t: number; v: number };

export function Sparkline({
  points, goal, width = 560, height = 170, unit = "",
}: { points: P[]; goal?: number | null; width?: number; height?: number; unit?: string }) {
  if (!points.length) return null;
  const pad = 26;
  const xs = points.map((p) => p.t);
  const ys = points.map((p) => p.v);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const goalN = typeof goal === "number" ? goal : undefined;
  let minY = Math.min(...ys, goalN ?? Infinity);
  let maxY = Math.max(...ys, goalN ?? -Infinity);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const sx = (x: number) => pad + (maxX === minX ? (width - 2 * pad) / 2 : ((x - minX) / (maxX - minX)) * (width - 2 * pad));
  const sy = (y: number) => pad + (1 - (y - minY) / (maxY - minY)) * (height - 2 * pad);
  const d = points.map((p, i) => (i ? "L" : "M") + sx(p.t).toFixed(1) + " " + sy(p.v).toFixed(1)).join(" ");
  const area = d + ` L ${sx(maxX).toFixed(1)} ${height - pad} L ${sx(minX).toFixed(1)} ${height - pad} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="trend">
      <defs>
        <linearGradient id="spkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0EA672" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0EA672" stopOpacity="0" />
        </linearGradient>
      </defs>
      {goalN !== undefined && (
        <g>
          <line x1={pad} y1={sy(goalN)} x2={width - pad} y2={sy(goalN)} stroke="#E0A340" strokeWidth="1.5" strokeDasharray="5 5" />
          <text x={width - pad} y={sy(goalN) - 6} textAnchor="end" fontSize="11" fill="#B5841F">{goalN}{unit}</text>
        </g>
      )}
      <path d={area} fill="url(#spkFill)" />
      <path d={d} fill="none" stroke="#0EA672" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (<circle key={i} cx={sx(p.t)} cy={sy(p.v)} r={i === points.length - 1 ? 4 : 2.5} fill="#0EA672" />))}
      <text x={sx(last.t)} y={sy(last.v) - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0B3D33">{last.v}{unit}</text>
    </svg>
  );
}

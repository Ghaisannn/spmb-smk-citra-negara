type Pt = { label: string; n: number };

export function TrenChart({ data }: { data: Pt[] }) {
  const W = 540, H = 250, L = 40, R = 10, T = 14, B = 46;
  const pw = W - L - R;
  const ph = H - T - B;
  const max = Math.max(1, ...data.map((d) => d.n));
  const top = Math.max(3, Math.ceil(max / 3) * 3);
  const avg = data.length ? data.reduce((a, d) => a + d.n, 0) / data.length : 0;
  const step = pw / Math.max(data.length, 1);
  const bw = Math.min(30, step * 0.62);
  const y = (v: number) => T + ph - (v / top) * ph;
  const cx = (i: number) => L + step * i + step / 2;
  const peak = data.reduce((m, d, i) => (d.n > data[m].n ? i : m), 0);
  const ticks = [0, 1, 2, 3].map((i) => (top / 3) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Tren pendaftaran mingguan">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e3ece6" />
          <text x={L - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#5b6b62">{t}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <rect
          key={i}
          x={cx(i) - bw / 2}
          y={y(d.n)}
          width={bw}
          height={Math.max(ph - (y(d.n) - T), 0)}
          rx="3"
          fill={i === peak && d.n > 0 ? "#005c34" : d.n >= avg && d.n > 0 ? "#0b7a42" : "#e3efe6"}
        />
      ))}
      <line x1={L} x2={W - R} y1={y(avg)} y2={y(avg)} stroke="#22a06b" strokeDasharray="5 4" />
      <polyline
        fill="none"
        stroke="#0f5530"
        strokeWidth="1.6"
        points={data.map((d, i) => `${cx(i)},${y(d.n)}`).join(" ")}
      />
      {data.map((d, i) => (
        <circle key={i} cx={cx(i)} cy={y(d.n)} r="3" fill="#fff" stroke="#005c34" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={cx(i)}
          y={H - 24}
          textAnchor="middle"
          fontSize="10"
          fontWeight={i === peak ? 700 : 400}
          fill={i === peak ? "#005c34" : "#5b6b62"}
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

export function ProgramBars({
  rows,
}: {
  rows: { label: string; pendaftar: number; diterima: number }[];
}) {
  const W = 520, H = 250, L = 34, R = 8, T = 22, B = 30;
  const pw = W - L - R;
  const ph = H - T - B;
  const max = Math.max(1, ...rows.map((r) => r.pendaftar));
  const top = Math.max(20, Math.ceil(max / 20) * 20);
  const gw = pw / Math.max(rows.length, 1);
  const bw = Math.min(20, gw * 0.3);
  const y = (v: number) => T + ph - (v / top) * ph;
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Penerimaan per program">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e3ece6" strokeDasharray="2 3" />
          <text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#5b6b62">{t}</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const x0 = L + gw * i + gw / 2;
        return (
          <g key={r.label}>
            <rect x={x0 - bw - 2} y={y(r.pendaftar)} width={bw} height={ph - (y(r.pendaftar) - T)} rx="2" fill="#7bd8a0" />
            <rect x={x0 + 2} y={y(r.diterima)} width={bw} height={ph - (y(r.diterima) - T)} rx="2" fill="#005c34" />
            <text x={x0 - bw / 2 - 2} y={y(r.pendaftar) - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#0f5530">{r.pendaftar}</text>
            <text x={x0 + bw / 2 + 2} y={y(r.diterima) - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#0f5530">{r.diterima}</text>
            <text x={x0} y={H - 10} textAnchor="middle" fontSize="10" fill="#0f1f17">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function CumLine({ labels, a, b }: { labels: string[]; a: number[]; b: number[] }) {
  const W = 340, H = 150, L = 8, R = 8, T = 10, B = 22;
  const pw = W - L - R;
  const ph = H - T - B;
  const max = Math.max(1, ...a, ...b);
  const x = (i: number) => L + (pw / Math.max(a.length - 1, 1)) * i;
  const y = (v: number) => T + ph - (v / max) * ph;
  const line = (s: number[]) => s.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${L},${T + ph} ${line(a)} ${x(a.length - 1)},${T + ph}`;
  const show = new Set([0, Math.floor((a.length - 1) / 2), a.length - 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Tren pendaftaran kumulatif">
      <polygon points={area} fill="#dff3e6" opacity="0.75" />
      <polyline fill="none" stroke="#7bd8a0" strokeDasharray="4 3" strokeWidth="1.6" points={line(b)} />
      <polyline fill="none" stroke="#005c34" strokeWidth="2" points={line(a)} />
      <circle cx={x(a.length - 1)} cy={y(a[a.length - 1])} r="3.5" fill="#005c34" />
      {labels.map((l, i) =>
        show.has(i) ? (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === a.length - 1 ? "end" : "middle"} fontSize="9" fill="#5b6b62">{l}</text>
        ) : null
      )}
    </svg>
  );
}
export const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

export function StatCard({
  label,
  icon,
  value,
  unit,
  tone = "bg-wash text-forest",
  valueClass = "text-ink",
  children,
}: {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  tone?: string;
  valueClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${card} flex flex-col p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-ink/65">{label}</p>
        <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className={`mt-1 text-[32px] font-semibold leading-none ${valueClass}`}>
        {value} {unit && <span className="text-[14px] font-normal text-ink/70">{unit}</span>}
      </p>
      {children && <div className="mt-auto pt-4 text-[12px] text-ink/65">{children}</div>}
    </div>
  );
}

export function Avatar({ text, bad }: { text: string; bad?: boolean }) {
  return (
    <span
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
        bad ? "bg-red-100 text-[#c00000]" : "bg-pastel text-forest"
      }`}
    >
      {text}
    </span>
  );
}
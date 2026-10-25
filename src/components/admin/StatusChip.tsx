import { STATUS_LABEL, type StatusPendaftar } from "@/lib/admin-format";

const STYLE: Record<StatusPendaftar, { box: string; dot: string }> = {
  terverifikasi: { box: "bg-chip text-forest", dot: "bg-forest" },
  menunggu: { box: "bg-[#fff1b8] text-[#8a5a00]", dot: "bg-orange-500" },
  revisi: { box: "bg-red-100 text-[#c00000]", dot: "bg-[#c00000]" },
  biodata: { box: "bg-pastel text-ink/75", dot: "bg-ink/45" },
  draft: { box: "bg-white text-ink/55 ring-1 ring-line", dot: "bg-ink/30" },
};

export default function StatusChip({ status }: { status: StatusPendaftar }) {
  const s = STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold ${s.box}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
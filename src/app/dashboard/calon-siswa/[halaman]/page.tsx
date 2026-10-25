import { notFound } from "next/navigation";
import { Construction } from "lucide-react";

const pages: Record<string, { title: string; desc: string }> = {
  profil: { title: "Profil", desc: "Kelola data akun Anda." },
};

export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ halaman: string }>;
}) {
  const { halaman } = await params;
  const info = pages[halaman];
  if (!info) notFound();

  return (
    <div className="mx-auto mt-8 w-full max-w-[640px] rounded-2xl bg-white p-10 text-center shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-chip text-forest">
        <Construction size={26} />
      </span>
      <h1 className="mt-5 text-[26px] font-semibold text-ink">{info.title}</h1>
      <p className="mt-2 text-[15px] text-ink/70">{info.desc}</p>
      <p className="mt-4 inline-block rounded-full bg-pastel px-3 py-1 text-[12px] font-semibold text-forest">
        Segera hadir
      </p>
    </div>
  );
}
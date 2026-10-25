import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import { requireRole } from "@/lib/auth";

const pages: Record<string, { title: string; desc: string }> = {
  "jadwal-cbt": {
    title: "Jadwal Tes & Bank Soal CBT",
    desc: "Atur jadwal ujian CBT dan kelola bank soal seleksi.",
  },
  hasil: { title: "Hasil Seleksi", desc: "Input dan publikasi hasil seleksi penerimaan." },
  pengumuman: { title: "Pengumuman", desc: "Buat dan terbitkan pengumuman ke portal siswa." },
  profil: { title: "Profil", desc: "Kelola data akun admin." },
};

export default async function AdminPlaceholderPage({
  params,
}: {
  params: Promise<{ halaman: string }>;
}) {
  await requireRole("admin");
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
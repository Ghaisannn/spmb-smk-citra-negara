import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  Contact,
  Download,
  Eye,
  FileText,
  Headset,
  Megaphone,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { HELPDESK } from "@/lib/jadwal-config";
import { FAQ, POSTS, type Post } from "@/lib/pengumuman-data";
import { getPengumumanPublik } from "@/lib/pengumuman";

export const metadata = { title: "Pengumuman | SMK Citra Negara" };

const card = "rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]";

const metaIcon = {
  clock: Clock,
  cbt: CalendarCheck,
  id: Contact,
  megaphone: Megaphone,
} as const;

const aksiIcon = {
  down: ChevronDown,
  right: ChevronRight,
  download: Download,
  file: FileText,
} as const;

function Isi({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[\[.+?\]\])/g).map((part, i) =>
        part.startsWith("[[") ? (
          <span key={i} className="text-forest">
            {part.slice(2, -2)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Berita({ p }: { p: Post }) {
  const tone =
    p.tone === "urgent"
      ? "bg-[#ffe3e3] text-[#c00000]"
      : p.tone === "green"
        ? "bg-chip text-forest"
        : "bg-pastel text-ink/70";
  const Meta = p.metaKanan ? metaIcon[p.metaKanan.icon] : null;

  return (
    <article className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink/75">
          <span className={`rounded px-2 py-0.5 text-[11.5px] font-semibold ${tone}`}>
            {p.tone === "urgent" && "! "}
            {p.kategori}
          </span>
          <span>• {p.tanggal}</span>
        </div>
        {Meta && p.metaKanan && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/75">
            <Meta size={13} />
            {p.metaKanan.teks}
          </span>
        )}
      </div>

      <h2
        className={`mt-3 font-medium leading-snug text-ink ${
          p.featured ? "text-[26px]" : "text-[19px]"
        }`}
      >
        {p.judul}
      </h2>
      <p
        className={`mt-2 text-[15px] leading-relaxed text-ink/75 ${
          p.featured ? "" : "line-clamp-2"
        }`}
      >
        <Isi text={p.isi} />
      </p>

      {p.file && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-wash p-3">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-white text-forest">
            <FileText size={22} />
          </span>
          <div className="min-w-0 flex-1 leading-snug">
            <p className="truncate text-[15px] font-medium text-ink">{p.file.nama}</p>
            <p className="text-[11.5px] text-ink/70">{p.file.info}</p>
          </div>
          <a
            href={p.file.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded bg-forest px-4 text-[12.5px] font-semibold text-white transition hover:bg-brand-800"
          >
            <Download size={14} />
            Unduh Berkas
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-pastel px-2 py-1 text-[11.5px] font-medium text-ink/80"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {p.dilihat !== undefined && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink/70">
              <Eye size={14} />
              Dilihat {p.dilihat.toLocaleString("id-ID")} kali
            </span>
          )}
          {p.aksi?.map((a) => {
            const Icon = aksiIcon[a.icon];
            return a.gaya === "tombol" ? (
              <a
                key={a.label}
                href={a.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded bg-wash px-3.5 text-[12.5px] font-semibold text-forest transition hover:bg-[#d9f0e0]"
              >
                <Icon size={14} />
                {a.label}
              </a>
            ) : (
              <Link
                key={a.label}
                href={a.href}
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-forest hover:underline"
              >
                {a.label}
                <Icon size={14} />
              </Link>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export default async function PengumumanPage() {
  const session = await requireRole("calon_siswa");
  const dbPosts = await getPengumumanPublik(session.id);

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-pastel px-2.5 py-1 text-[11.5px] font-medium text-forest">
            <span className="size-1.5 rounded-full bg-forest" />
            Pemberitahuan Resmi
          </span>
          <h1 className="mt-3 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">
            Pengumuman &amp; Informasi SPMB
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/75">
            Informasi resmi, edaran panitia, dan jadwal penting pelaksanaan SPMB SMK Citra Negara Tahun Ajaran 2026/2027.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-end rounded-md bg-pastel px-3 py-2 text-[12.5px] font-medium text-ink/80">
          <Calendar size={14} />
          Update Terakhir: 12 April 2026
        </span>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_295px]">
        <div className="space-y-4">
            {[...dbPosts, ...POSTS].map((p) => (
            <Berita key={p.id} p={p} />
          ))}
        </div>

        <aside className="space-y-6">
          <section className={`${card} p-5`}>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-forest text-white">
                <Headset size={21} />
              </span>
              <div className="leading-tight">
                <h3 className="text-[17px] font-medium text-ink">Pusat Layanan SPMB</h3>
                <p className="text-[11.5px] text-ink/70">Sekretariat Helpdesk Resmi</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink/75">
              Mengalami kendala berkas, login CBT, atau pertanyaan seputar daftar ulang? Hubungi tim panitia SPMB berikut:
            </p>

            <div className="mt-3 space-y-2">
              <a
                href={HELPDESK.wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg bg-wash p-2.5"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-forest text-white">
                  <MessageSquare size={18} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[11px] text-ink/70">WhatsApp Panitia</span>
                  <span className="block text-[15px] font-bold text-ink">{HELPDESK.telp}</span>
                </span>
              </a>
              <div className="flex items-center gap-3 rounded-lg bg-wash p-2.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-pastel text-ink/70">
                  <Clock size={18} />
                </span>
                <span className="text-[11.5px] leading-snug text-ink/75">
                  <span className="block text-[11px]">Waktu Operasional</span>
                  <span className="block font-semibold text-ink">Senin - Sabtu, 08:00 - 15:00 WIB</span>
                  Hari Minggu &amp; Libur Nasional Tutup
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-wash p-2.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-pastel text-ink/70">
                  <MapPin size={18} />
                </span>
                <span className="text-[11.5px] leading-snug text-ink/75">
                  <span className="block text-[11px]">Lokasi Fisik Panitia</span>
                  <span className="block font-semibold text-ink">Gedung C Administrasi</span>
                  SMK Citra Negara Depok
                </span>
              </div>
            </div>
          </section>

          <section className={`${card} p-5`}>
            <h3 className="flex items-center gap-3 text-[17px] font-medium text-ink">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-wash text-forest">
                <CircleHelp size={18} />
              </span>
              FAQ SPMB Terpopuler
            </h3>
            <div className="mt-4 space-y-2">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-lg bg-wash">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[12.5px] font-semibold leading-snug text-ink">
                    {f.q}
                    <ChevronDown
                      size={15}
                      className="shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="px-3 pb-3 text-[12px] leading-relaxed text-ink/75">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-nav p-5 text-white">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/85">
              <ShieldCheck size={14} />
              Integritas Seleksi
            </p>
            <h3 className="mt-2 text-[19px] font-semibold leading-snug">
              Pengumuman Resmi &amp; Bebas Pungli
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-white/85">
              Seluruh pengumuman hasil seleksi hanya dikeluarkan resmi melalui portal web ini dan surat berkop sekolah bertanda tangan Kepala SMK Citra Negara.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
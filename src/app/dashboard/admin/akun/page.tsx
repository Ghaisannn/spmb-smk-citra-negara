import Link from "next/link";
import { Ban, History, KeyRound, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import KepsekManager from "@/components/admin/KepsekManager";
import Pagination from "@/components/admin/Pagination";
import SiswaManager from "@/components/admin/SiswaManager";
import { StatCard, card } from "@/components/kepsek/Ui";
import { requireRole } from "@/lib/auth";
import { getAkunCounts, getAkunLog, listKepsek, listSiswa } from "@/lib/akun";
import { buildQuery, relTime } from "@/lib/admin-format";

export const metadata = { title: "Kelola Akun | SMK Citra Negara" };

const base = "/dashboard/admin/akun";

const AKSI: Record<string, { t: string; c: string }> = {
  tambah: { t: "Akun dibuat", c: "bg-chip text-forest" },
  ubah: { t: "Data diubah", c: "bg-pastel text-ink/75" },
  reset_sandi: { t: "Kata sandi direset", c: "bg-[#fff1b8] text-[#8a5a00]" },
  nonaktif: { t: "Akun dinonaktifkan", c: "bg-red-100 text-[#c00000]" },
  aktif: { t: "Akun diaktifkan kembali", c: "bg-chip text-forest" },
  hapus: { t: "Akun dihapus", c: "bg-red-100 text-[#c00000]" },
};

export default async function KelolaAkunPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; status?: string; page?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;

  const tab = sp.tab === "kepsek" ? "kepsek" : "siswa";
  const status = sp.status === "aktif" || sp.status === "nonaktif" ? sp.status : "semua";
  const q = (sp.q ?? "").slice(0, 100);
  const page = Math.max(Number(sp.page) || 1, 1);

  const [c, log] = await Promise.all([getAkunCounts(), getAkunLog(8)]);
  const siswa = tab === "siswa" ? await listSiswa({ q, status, page, perPage: 6 }) : null;
  const kepsek = tab === "kepsek" ? await listKepsek() : null;

  const hrefSiswa = (o: { status?: string; page?: number }) =>
    `${base}${buildQuery({
      q,
      status: (o.status ?? status) === "semua" ? undefined : (o.status ?? status),
      page: o.page && o.page > 1 ? o.page : undefined,
    })}`;

  const totalPages = siswa ? Math.max(Math.ceil(siswa.total / siswa.perPage), 1) : 1;
  const offset = siswa ? (siswa.page - 1) * siswa.perPage : 0;

  const pill = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
      active ? "bg-forest text-white" : "bg-wash text-ink hover:bg-[#d9f0e0]"
    }`;
  const count = (active: boolean) =>
    `rounded-full px-1.5 text-[11px] ${active ? "bg-white/20" : "bg-white text-ink/70"}`;

  const filters: [string, string, number][] = [
    ["semua", "Semua", c.siswa],
    ["aktif", "Aktif", c.siswaAktif],
    ["nonaktif", "Dinonaktifkan", c.siswaNonaktif],
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-forest">
        <span className="size-1.5 rounded-full bg-forest" />
        Manajemen Akses Pengguna
      </span>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink sm:text-[38px]">Kelola Akun</h1>
      <p className="mt-1 max-w-[620px] text-[14.5px] leading-relaxed text-ink/75">
        Kelola akun calon siswa dan Kepala Sekolah: ubah data, reset kata sandi, nonaktifkan akses, atau hapus akun. Akun Admin tidak dikelola dari halaman ini.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Akun Siswa" icon={<Users size={20} />} value={c.siswa} unit="Akun">
          Terdaftar lewat halaman pendaftaran
        </StatCard>
        <StatCard label="Akun Siswa Aktif" icon={<UserCheck size={20} />} value={c.siswaAktif} unit="Akun" tone="bg-chip text-forest" valueClass="text-forest">
          Dapat login ke portal
        </StatCard>
        <StatCard label="Dinonaktifkan" icon={<Ban size={20} />} value={c.siswaNonaktif} unit="Akun" tone="bg-red-100 text-[#c00000]" valueClass={c.siswaNonaktif > 0 ? "text-[#c00000]" : "text-ink"}>
          Akses login ditutup sementara
        </StatCard>
        <StatCard label="Akun Kepala Sekolah" icon={<ShieldCheck size={20} />} value={c.kepsek} unit="Akun">
          {c.kepsekAktif} akun aktif
        </StatCard>
      </div>

      <section className={`${card} mt-6 p-5 sm:p-6`}>
        <div className="flex flex-wrap gap-2">
          <Link href={base} className={pill(tab === "siswa")}>
            Akun Calon Siswa
            <span className={count(tab === "siswa")}>{c.siswa}</span>
          </Link>
          <Link href={`${base}?tab=kepsek`} className={pill(tab === "kepsek")}>
            Akun Kepala Sekolah
            <span className={count(tab === "kepsek")}>{c.kepsek}</span>
          </Link>
        </div>

        {tab === "siswa" && siswa && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form method="get" className="flex h-11 min-w-[240px] flex-1 items-center gap-3 rounded-lg bg-wash px-4">
                <Search size={17} className="text-ink/55" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Cari nama, email, NIK, WhatsApp, atau nomor registrasi..."
                  className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink/45"
                />
                {status !== "semua" && <input type="hidden" name="status" value={status} />}
              </form>
              <div className="flex flex-wrap gap-2">
                {filters.map(([k, label, n]) => (
                  <Link key={k} href={hrefSiswa({ status: k, page: 1 })} className={pill(status === k)}>
                    {label}
                    <span className={count(status === k)}>{n}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <SiswaManager rows={siswa.rows} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px] text-ink/70">
                Menampilkan{" "}
                <b className="text-ink">
                  {siswa.total === 0 ? 0 : offset + 1}–{offset + siswa.rows.length}
                </b>{" "}
                dari <b className="text-ink">{siswa.total}</b> akun
              </p>
              <Pagination page={siswa.page} totalPages={totalPages} hrefFor={(p) => hrefSiswa({ page: p })} />
            </div>
          </div>
        )}

        {tab === "kepsek" && kepsek && (
          <div className="mt-5">
            <KepsekManager rows={kepsek} jumlahAktif={c.kepsekAktif} />
          </div>
        )}
      </section>

      <section className={`${card} mt-6 p-5 sm:p-6`}>
        <h2 className="flex items-center gap-2.5 text-[19px] font-medium text-ink">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-wash text-forest">
            <History size={18} />
          </span>
          Riwayat Perubahan Akun
        </h2>
        <p className="mt-1 text-[12.5px] text-ink/65">Delapan aksi terakhir yang dilakukan admin pada akun siswa dan Kepala Sekolah.</p>

        <ul className="mt-4 space-y-2">
          {log.length === 0 && (
            <li className="rounded-lg bg-wash py-8 text-center text-[13.5px] text-ink/60">Belum ada perubahan akun.</li>
          )}
          {log.map((l, i) => {
            const a = AKSI[l.aksi] ?? { t: l.aksi, c: "bg-pastel text-ink/75" };
            return (
              <li key={i} className="flex flex-wrap items-start gap-3 rounded-lg bg-wash px-4 py-3">
                <span className={`mt-0.5 rounded px-2 py-0.5 text-[11px] font-semibold ${a.c}`}>{a.t}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink">
                    {l.targetNama}
                    <span className="ml-2 text-[11.5px] font-normal text-ink/55">
                      {l.targetRole === "kepsek" ? "Kepala Sekolah" : "Calon Siswa"}
                    </span>
                  </p>
                  {l.detail && <p className="mt-0.5 break-words text-[12px] text-ink/65">{l.detail}</p>}
                </div>
                <span className="text-[11.5px] text-ink/55">{relTime(l.at)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink/55">
          <KeyRound size={12} />
          Kata sandi tidak pernah dicatat di riwayat.
        </p>
      </section>
    </div>
  );
}
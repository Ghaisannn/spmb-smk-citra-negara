"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CircleCheck,
  Contact,
  DoorOpen,
  GraduationCap,
  Headset,
  Info,
  Lock,
  Mailbox,
  Map,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  User,
  UserCog,
  Users,
} from "lucide-react";
import {
  AGAMA,
  JENIS_KELAMIN,
  KECAMATAN,
  STATUS_SEKOLAH,
  STATUS_TINGGAL,
  TAHUN_LULUS,
  localWa,
  validateStep,
  type BiodataData,
  type FieldErrors,
  type FieldName,
} from "@/lib/biodata-schema";
import {
  AreaBox,
  CheckDot,
  Field,
  RadioGroup,
  SelectBox,
  TextBox,
} from "./FormParts";

type Step = 1 | 2 | 3;

const stepLabels = ["Data Pribadi", "Kontak & Alamat", "Data Sekolah"];

const tinggalIcons = {
  "Bersama Orang Tua": Users,
  "Tinggal Bersama Wali": UserCog,
  "Kos / Mandiri": DoorOpen,
  "Asrama / Pondok": Building2,
} as const;

const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-forest px-6 text-[14px] font-semibold text-white shadow-[0_4px_10px_rgba(0,92,52,0.25)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70";

function Stepper({ current }: { current: Step }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_4px_16px_rgba(20,114,57,0.06)] sm:px-6">
      <div className="flex items-center justify-between gap-2">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const lit = done || active;
          return (
            <Fragment key={n}>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold ${
                    lit ? "bg-forest text-white" : "bg-pastel text-ink/45"
                  }`}
                >
                  {done ? <Check size={18} strokeWidth={3} /> : n}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span
                    className={`block text-[11px] font-semibold uppercase tracking-wide ${
                      lit ? "text-forest" : "text-ink/45"
                    }`}
                  >
                    Tahap {n}
                  </span>
                  <span
                    className={`block text-[15px] font-semibold ${
                      lit ? "text-ink" : "text-ink/45"
                    }`}
                  >
                    {label}
                  </span>
                </span>
              </div>
              {n < 3 && (
                <span
                  className={`hidden h-[3px] w-[72px] shrink-0 rounded-full sm:block ${
                    n <= current ? "bg-chip" : "bg-pastel"
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-chip text-forest">
        {icon}
      </span>
      <div>
        <h3 className="text-[18px] font-semibold leading-tight text-ink">{title}</h3>
        <p className="mt-0.5 text-[12.5px] text-ink/70">{desc}</p>
      </div>
    </div>
  );
}

export default function BiodataWizard({
  initial,
  nama,
  nik,
  email,
  initialStep,
}: {
  initial: BiodataData;
  nama: string;
  nik: string;
  email: string;
  initialStep: Step;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [data, setData] = useState<BiodataData>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const dirty = useRef(false);

  const set = (name: FieldName, value: string) => {
    dirty.current = true;
    setData((p) => ({ ...p, [name]: value }));
    setErrors((p) => {
      if (!p[name]) return p;
      const n = { ...p };
      delete n[name];
      return n;
    });
  };

  // Simpan draft otomatis 1,2 detik setelah berhenti mengetik.
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(async () => {
      setAutosaving(true);
      try {
        const res = await fetch("/api/biodata", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        if (res.ok) dirty.current = false;
      } catch {
        // abaikan, akan dicoba lagi saat data berubah
      } finally {
        setAutosaving(false);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [data]);

  const goTo = (s: Step) => {
    setErrors({});
    setServerError("");
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = async () => {
    const errs = validateStep(step, data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setServerError("");
    dirty.current = false;

    try {
      const res = await fetch("/api/biodata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(json.message || "Gagal menyimpan data.");
        if (json.errors) setErrors(json.errors);
        return;
      }

      if (step === 3) {
        router.push("/dashboard/calon-siswa/program");
        router.refresh();
      } else {
        goTo((step + 1) as Step);
      }
    } catch {
      setServerError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const autosaveLabel = (text: string) => (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-forest">
      <CircleCheck size={15} />
      {autosaving ? "Menyimpan draft..." : text}
    </span>
  );

  const errorBox = serverError && (
    <p className="mt-5 rounded bg-red-50 px-3 py-2 text-[13px] text-[#c00000]">
      {serverError}
    </p>
  );

  return (
    <div
      className={`mx-auto w-full pt-2 sm:pt-8 ${
        step === 1 ? "max-w-[768px]" : "max-w-[944px]"
      }`}
    >
      <Stepper current={step} />

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(20,114,57,0.06)]">
        {/* ================= TAHAP 1 ================= */}
        {step === 1 && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-pastel px-2.5 py-1 text-[12px] font-medium text-ink/80">
                Langkah 1 dari 3
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-chip px-2.5 py-1 text-[12px] font-semibold text-forest">
                <span className="size-1.5 rounded-full bg-forest" />
                Wajib KTP/KK
              </span>
            </div>
            <h2 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
              Data Pribadi Calon Siswa
            </h2>
            <p className="mt-1 text-[15px] text-ink/75">
              Isi data pribadi calon siswa sesuai dengan Akta Kelahiran dan Kartu Keluarga (KK).
            </p>

            <div className="mt-6 flex gap-3 rounded-xl bg-wash px-4 py-3.5">
              <span className="mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-forest text-white">
                <Info size={12} strokeWidth={3} />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-ink">
                  Validasi NIK Otomatis Terhubung ke Dukcapil
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink/75">
                  Pastikan 16 digit NIK tidak keliru agar proses verifikasi berkas kelulusan tidak tertunda.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <Field label="Nama Lengkap Siswa" required hint="Sesuai Ijazah SMP" htmlFor="nama">
                <TextBox id="nama" icon={<User size={18} />} value={nama} readOnly />
              </Field>

              <Field
                label="Nomor Induk Kependudukan (NIK)"
                required
                htmlFor="nik"
                hint={
                  nik.length === 16 ? (
                    <span className="font-medium text-forest">16 Digit Valid</span>
                  ) : undefined
                }
              >
                <TextBox id="nik" icon={<Contact size={18} />} value={nik} readOnly />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Tempat Lahir" required htmlFor="tempat_lahir" error={errors.tempat_lahir}>
                  <TextBox
                    id="tempat_lahir"
                    icon={<Building2 size={18} />}
                    value={data.tempat_lahir}
                    onChange={(e) => set("tempat_lahir", e.target.value)}
                    error={errors.tempat_lahir}
                    placeholder="Contoh: Depok"
                    maxLength={100}
                  />
                </Field>
                <Field label="Tanggal Lahir" required htmlFor="tanggal_lahir" error={errors.tanggal_lahir}>
                  <TextBox
                    id="tanggal_lahir"
                    type="date"
                    icon={<Calendar size={18} />}
                    value={data.tanggal_lahir}
                    onChange={(e) => set("tanggal_lahir", e.target.value)}
                    error={errors.tanggal_lahir}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
              </div>

              <Field label="Jenis Kelamin" required>
                <RadioGroup
                  name="jenis_kelamin"
                  value={data.jenis_kelamin}
                  options={JENIS_KELAMIN}
                  onChange={(v) => set("jenis_kelamin", v)}
                  error={errors.jenis_kelamin}
                />
              </Field>

              <Field label="Agama" required htmlFor="agama" error={errors.agama}>
                <SelectBox
                  id="agama"
                  icon={<Users size={18} />}
                  value={data.agama}
                  onChange={(e) => set("agama", e.target.value)}
                  error={errors.agama}
                >
                  <option value="">Pilih agama</option>
                  {AGAMA.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </SelectBox>
              </Field>
            </div>

            {errorBox}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              {autosaveLabel("Otomatis tersimpan sebagai draft")}
              <button type="button" onClick={handleNext} disabled={saving} className={btnPrimary}>
                {saving ? "Menyimpan..." : "Lanjutkan ke Langkah 2"}
                {!saving && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 2 ================= */}
        {step === 2 && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-chip text-forest">
                  <Contact size={20} />
                </span>
                <div>
                  <h2 className="text-[24px] font-semibold leading-tight text-ink">
                    Kontak &amp; Alamat Domisili Calon Siswa
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-wash px-3 py-2">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-forest">
                  <MapPin size={17} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[11px] text-ink/70">Zonasi Afiliasi</span>
                  <span className="block text-[13px] font-bold text-forest">Depok &amp; Sekitarnya</span>
                </span>
              </div>
            </div>
            <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink/75">
              Lengkapi informasi nomor kontak aktif dan alamat tempat tinggal untuk kebutuhan verifikasi identitas, notifikasi resmi SPMB, dan pengiriman berkas kelulusan.
            </p>

            <div className="mt-5 flex gap-3 rounded-xl bg-wash px-4 py-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-chip/70 text-forest">
                <MessageSquareText size={20} />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-forest">
                  Pemberitahuan Validasi Saluran Komunikasi
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink/75">
                  Pastikan nomor WhatsApp dan email calon siswa atau orang tua dalam keadaan aktif. Notifikasi jadwal tes seleksi, link CBT, serta berkas bukti registrasi resmi akan dikirimkan otomatis melalui saluran ini.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nomor WhatsApp Calon Siswa"
                  required
                  htmlFor="whatsapp"
                  error={errors.whatsapp}
                  help="Digunakan untuk notifikasi token OTP dan pengumuman instan."
                  helpIcon={<MessageSquareText size={14} className="mt-0.5 shrink-0 text-forest" />}
                >
                  <TextBox
                    id="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    icon={<Smartphone size={18} />}
                    prefixText="+62"
                    value={data.whatsapp}
                    onChange={(e) => set("whatsapp", localWa(e.target.value))}
                    error={errors.whatsapp}
                    placeholder="81298765432"
                  />
                </Field>

                <Field
                  label="Alamat Email Aktif"
                  required
                  htmlFor="email"
                  hint={
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-chip px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                      <span className="size-1.5 rounded-full bg-forest" />
                      Terverifikasi
                    </span>
                  }
                  help="Akun email terhubung dengan akun Google Workspace SPMB."
                >
                  <TextBox
                    id="email"
                    icon={<AtSign size={18} />}
                    value={email}
                    readOnly
                    right={<CheckDot />}
                  />
                </Field>
              </div>

              <Field
                label="Alamat Rumah Lengkap (Jalan, Gang, Blok, No. Rumah)"
                required
                htmlFor="alamat"
                error={errors.alamat}
                help="Tuliskan nama jalan dan nomor rumah sesuai data KTP/Kartu Keluarga (KK)."
              >
                <AreaBox
                  id="alamat"
                  value={data.alamat}
                  onChange={(e) => set("alamat", e.target.value)}
                  error={errors.alamat}
                  maxLength={250}
                  placeholder="Contoh: Jl. Pitara Raya No.33"
                  counter="Maks. 250 Karakter"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="RT / RW"
                  required
                  htmlFor="rt_rw"
                  error={errors.rt_rw}
                  help="Format: 3 digit RT / 3 digit RW."
                >
                  <TextBox
                    id="rt_rw"
                    icon={<span className="text-[18px] font-medium leading-none">#</span>}
                    value={data.rt_rw}
                    onChange={(e) => set("rt_rw", e.target.value.replace(/[^\d/\s]/g, ""))}
                    error={errors.rt_rw}
                    placeholder="005 / 15"
                    maxLength={12}
                  />
                </Field>
                <Field
                  label="Kelurahan / Desa"
                  required
                  htmlFor="kelurahan"
                  error={errors.kelurahan}
                  help="Pilih kelurahan domisili saat ini."
                >
                  <TextBox
                    id="kelurahan"
                    icon={<Building2 size={18} />}
                    value={data.kelurahan}
                    onChange={(e) => set("kelurahan", e.target.value)}
                    error={errors.kelurahan}
                    placeholder="Contoh: Pancoran Mas"
                    maxLength={100}
                  />
                </Field>

                <Field
                  label="Kecamatan"
                  required
                  htmlFor="kecamatan"
                  error={errors.kecamatan}
                  help="Kecamatan domisili pendaftar."
                >
                  <SelectBox
                    id="kecamatan"
                    icon={<Building2 size={18} />}
                    value={data.kecamatan}
                    onChange={(e) => set("kecamatan", e.target.value)}
                    error={errors.kecamatan}
                  >
                    <option value="">Pilih kecamatan</option>
                    {KECAMATAN.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </SelectBox>
                </Field>
                <Field
                  label="Kota / Kabupaten & Provinsi"
                  required
                  help="Wilayah administrasi otomatis disesuaikan."
                >
                  <div className="flex h-11 items-center gap-3 rounded-lg border border-[#e4ebe6] bg-wash px-3.5">
                    <Map size={18} className="shrink-0 text-ink/60" />
                    <span className="flex-1 text-[15px] text-ink">Kota Depok, Jawa Barat</span>
                    <Lock size={16} className="text-forest" />
                  </div>
                </Field>

                <Field
                  label="Kode Pos"
                  required
                  htmlFor="kode_pos"
                  error={errors.kode_pos}
                  help="5 Digit angka pos."
                >
                  <TextBox
                    id="kode_pos"
                    inputMode="numeric"
                    icon={<Mailbox size={18} />}
                    value={data.kode_pos}
                    onChange={(e) => set("kode_pos", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    error={errors.kode_pos}
                    placeholder="16424"
                    maxLength={5}
                  />
                </Field>
                <Field
                  label="Status Kepemilikan / Tempat Tinggal"
                  required
                  error={errors.status_tinggal}
                  help="Pilih status hunian tempat tinggal calon siswa saat menjalani proses studi."
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUS_TINGGAL.map((s) => {
                      const Icon = tinggalIcons[s];
                      const selected = data.status_tinggal === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => set("status_tinggal", s)}
                          aria-pressed={selected}
                          className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-[12.5px] leading-tight transition ${
                            selected
                              ? "bg-wash font-semibold text-ink"
                              : "bg-white text-ink/85 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-wash/60"
                          }`}
                        >
                          <Icon size={20} className={selected ? "text-forest" : "text-ink/75"} />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>

            {errorBox}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <button
                type="button"
                onClick={() => goTo(1)}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-lg bg-white px-5 py-2 text-left text-[14px] font-medium text-ink shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition hover:bg-wash"
              >
                <ArrowLeft size={16} />
                Kembali ke Tahap 1 (Data Pribadi)
              </button>
              <button type="button" onClick={handleNext} disabled={saving} className={btnPrimary}>
                {saving ? "Menyimpan..." : "Lanjutkan ke Langkah 3"}
                {!saving && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3 ================= */}
        {step === 3 && (
          <>
            <div className="bg-wash px-6 py-8 sm:px-8">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-forest">
                Biodata Akademik &amp; Keluarga
              </p>
              <h2 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
                Data Asal Sekolah &amp; Orang Tua / Wali
              </h2>
              <p className="mt-1 max-w-[640px] text-[15px] leading-relaxed text-ink/75">
                Lengkapi riwayat pendidikan tingkat SMP/MTs sederajat serta data penanggung jawab calon siswa secara valid sesuai dokumen resmi (Kartu Keluarga &amp; Rapor).
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {/* A. Asal sekolah */}
              <SectionTitle
                icon={<GraduationCap size={19} />}
                title="A. Riwayat Asal Sekolah (SMP / MTs)"
                desc="Informasi data kelembagaan sekolah menengah pertama calon peserta didik"
              />

              <div className="mt-6 grid gap-x-4 gap-y-5 md:grid-cols-3">
                <Field
                  label="NPSN Sekolah Asal"
                  required
                  hint="8 Digit"
                  htmlFor="npsn"
                  error={errors.npsn}
                  help="Dapat dilihat pada data Kemendikbudristek"
                >
                  <TextBox
                    id="npsn"
                    inputMode="numeric"
                    value={data.npsn}
                    onChange={(e) => set("npsn", e.target.value.replace(/\D/g, "").slice(0, 8))}
                    error={errors.npsn}
                    placeholder="20229045"
                    maxLength={8}
                    right={data.npsn.length === 8 ? <CircleCheck size={20} className="text-forest" /> : undefined}
                  />
                </Field>
                <Field
                  label="Nama Lengkap Asal Sekolah"
                  required
                  htmlFor="nama_sekolah"
                  className="md:col-span-2"
                  error={errors.nama_sekolah}
                  help="Tuliskan nama resmi sekolah tanpa singkatan rancu"
                >
                  <TextBox
                    id="nama_sekolah"
                    value={data.nama_sekolah}
                    onChange={(e) => set("nama_sekolah", e.target.value)}
                    error={errors.nama_sekolah}
                    placeholder="Contoh: SMP Setia Negara"
                    maxLength={150}
                    right={<Building2 size={18} />}
                  />
                </Field>

                <Field label="Status Sekolah Asal" required>
                  <RadioGroup
                    name="status_sekolah"
                    value={data.status_sekolah}
                    options={STATUS_SEKOLAH}
                    onChange={(v) => set("status_sekolah", v)}
                    error={errors.status_sekolah}
                  />
                </Field>
                <Field label="Tahun Kelulusan" required htmlFor="tahun_lulus" error={errors.tahun_lulus}>
                  <SelectBox
                    id="tahun_lulus"
                    value={data.tahun_lulus}
                    onChange={(e) => set("tahun_lulus", e.target.value)}
                    error={errors.tahun_lulus}
                  >
                    <option value="">Pilih tahun</option>
                    {TAHUN_LULUS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </SelectBox>
                </Field>
                <Field
                  label="NISN (10 Digit)"
                  required
                  hint="Wajib Aktif"
                  htmlFor="nisn"
                  error={errors.nisn}
                  help="Sesuai data Dapodik/Kemenag"
                >
                  <TextBox
                    id="nisn"
                    inputMode="numeric"
                    value={data.nisn}
                    onChange={(e) => set("nisn", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    error={errors.nisn}
                    placeholder="0084512980"
                    maxLength={10}
                    right={<Contact size={18} />}
                  />
                </Field>
              </div>

              <div className="my-8 border-t border-line" />

              {/* B. Orang tua */}
              <SectionTitle
                icon={<Users size={19} />}
                title="B. Data Orang Tua / Wali Calon Siswa"
                desc="Data penanggung jawab siswa untuk keperluan administratif dan korespondensi resmi"
              />

              <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
                <Field label="Nama Lengkap Ayah / Wali" required htmlFor="nama_ayah" error={errors.nama_ayah}>
                  <TextBox
                    id="nama_ayah"
                    value={data.nama_ayah}
                    onChange={(e) => set("nama_ayah", e.target.value)}
                    error={errors.nama_ayah}
                    placeholder="Nama lengkap ayah / wali"
                    maxLength={100}
                    right={<User size={18} />}
                  />
                </Field>
                <Field label="Pekerjaan Ayah / Wali" required htmlFor="pekerjaan_ayah" error={errors.pekerjaan_ayah}>
                  <TextBox
                    id="pekerjaan_ayah"
                    value={data.pekerjaan_ayah}
                    onChange={(e) => set("pekerjaan_ayah", e.target.value)}
                    error={errors.pekerjaan_ayah}
                    placeholder="Contoh: Wiraswasta"
                    maxLength={100}
                    right={<Briefcase size={18} />}
                  />
                </Field>
                <Field label="Nama Lengkap Ibu Kandung" required htmlFor="nama_ibu" error={errors.nama_ibu}>
                  <TextBox
                    id="nama_ibu"
                    value={data.nama_ibu}
                    onChange={(e) => set("nama_ibu", e.target.value)}
                    error={errors.nama_ibu}
                    placeholder="Nama lengkap ibu kandung"
                    maxLength={100}
                    right={<Users size={18} />}
                  />
                </Field>
                <Field
                  label="Nomor WhatsApp Aktif Orang Tua / Wali"
                  required
                  hint={<span className="font-medium text-forest">WhatsApp Aktif</span>}
                  htmlFor="whatsapp_ortu"
                  error={errors.whatsapp_ortu}
                  help="Digunakan untuk konfirmasi kehadiran wali dan pemberitahuan jadwal seleksi masuk."
                >
                  <TextBox
                    id="whatsapp_ortu"
                    type="tel"
                    inputMode="numeric"
                    icon={<Smartphone size={18} />}
                    prefixText="+62"
                    value={data.whatsapp_ortu}
                    onChange={(e) => set("whatsapp_ortu", localWa(e.target.value))}
                    error={errors.whatsapp_ortu}
                    placeholder="81388997711"
                  />
                </Field>
              </div>

              <div className="mt-8 flex gap-3 rounded-xl bg-wash px-4 py-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-chip text-forest">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-ink">Pemeriksaan &amp; Validasi Data</p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-ink/75">
                    Periksa kembali data Anda secara saksama. Setelah disimpan, data ini akan disinkronisasikan secara otomatis ke berkas verifikasi pendaftaran serta kartu peserta tes seleksi calon siswa SPMB 2026/2027.
                  </p>
                </div>
              </div>

              {errorBox}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-wash px-4 text-[14px] font-medium text-ink transition hover:bg-[#d9f0e0]"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Tahap 2 (Kontak &amp; Alamat)
                </button>
                <div className="flex flex-wrap items-center gap-5">
                  {autosaveLabel("Draft tersimpan otomatis")}
                  <button type="button" onClick={handleNext} disabled={saving} className={btnPrimary}>
                    {saving ? "Menyimpan..." : "Konfirmasi & Simpan"}
                    {!saving && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-center text-[12.5px] text-ink/70">
        <Headset size={15} className="text-forest" />
        Butuh bantuan pengisian? Hubungi Helpdesk SPMB:
        <span className="font-semibold text-ink">0811-2345-6789</span>
      </p>
    </div>
  );
}
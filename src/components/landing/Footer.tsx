import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import Logo from "./Logo";

const quickLinks = [
  { label: "Tentang SPMB", href: "#tentang" },
  { label: "Alur Pendaftaran", href: "#alur" },
  { label: "Syarat & Berkas", href: "#persyaratan" },
  { label: "Program Keahlian", href: "#jurusan" },
  { label: "Biaya Pendidikan", href: "#" },
];

const programs = [
  "Teknik Komputer & Jaringan (TJKT)",
  "Pengembangan Perangkat Lunak Dan Gim (PPLG)",
  "Multimedia / DKV",
  "Pemasaran",
  "Otomatisasi & Tata Kelola Perkantoran",
];

export default function Footer() {
  return (
    <footer id="kontak" className="scroll-mt-24 border-t border-line bg-white">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1.3fr]">
          <Reveal>
            <Logo variant="footer" />
            <p className="mt-4 max-w-[300px] text-[12.5px] leading-relaxed text-muted">
              Lembaga Pendidikan Vokasi Unggulan Berwawasan Teknologi dan
              Berkarakter Akhlakul Karimah. Mencetak lulusan kompeten siap kerja
              dan berwirausaha.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700">
              <span className="size-1.5 rounded-full bg-brand-500" />
              Terakreditasi A (Unggul)
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h4 className="text-[15px] font-bold text-ink">Tautan Cepat</h4>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[12.5px] text-muted transition hover:text-brand-600"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={200}>
            <h4 className="text-[15px] font-bold text-ink">Program Keahlian</h4>
            <ul className="mt-4 space-y-2.5">
              {programs.map((p) => (
                <li key={p} className="text-[12.5px] text-muted">
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={300}>
            <h4 className="text-[15px] font-bold text-ink">Sekretariat SPMB</h4>
            <ul className="mt-4 space-y-2.5 text-[12.5px] leading-relaxed text-muted">
              <li>
                Jl. Raya Tanah Baru No. 100, Beji, Kota Depok, Jawa Barat 16421
              </li>
              <li>Telp: (021) 7720–3456</li>
              <li>WhatsApp: +62 812–3456–7890</li>
              <li>Email: spmb@smkcitranegara.sch.id</li>
            </ul>
          </Reveal>
        </div>

        <div className="flex flex-col gap-3 border-t border-line py-6 text-[11.5px] text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Panitia SPMB SMK Citra Negara Depok. Hak Cipta Dilindungi
            Undang-Undang.
          </p>
          <div className="flex gap-6 font-semibold text-ink">
            <a href="#" className="hover:text-brand-600">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-brand-600">
              Syarat &amp; Ketentuan
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
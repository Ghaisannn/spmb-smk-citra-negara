import Image from "next/image";
import Link from "next/link";

export default function AuthHeader() {
  return (
    <header className="flex items-center gap-4 px-3 pt-3 sm:px-4">
      <Link href="/" className="flex items-center gap-4">
        <Image
          src="/images/logo/logo-smk-citra-negara.png"
          alt="Logo SMK Citra Negara"
          width={90}
          height={90}
          className="h-[72px] w-[72px] object-contain sm:h-[90px] sm:w-[90px]"
        />
        <div className="leading-tight">
          <p className="text-[18px] font-semibold tracking-tight text-forest sm:text-[22px]">
            SMK CITRA NEGARA
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-muted sm:text-[11px]">
            Sistem Penerimaan Murid Baru 2026/2027
          </p>
        </div>
      </Link>
    </header>
  );
}
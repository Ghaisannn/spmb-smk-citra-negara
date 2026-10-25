import Image from "next/image";

export default function Logo({
  variant = "navbar",
}: {
  variant?: "navbar" | "footer";
}) {
  if (variant === "footer") {
    return (
      <a href="#beranda" className="flex items-center gap-3">
        <Image
          src="/images/logo/logo-smk-citra-negara.png"
          alt="Logo SMK Citra Negara"
          width={52}
          height={52}
          className="h-[52px] w-[52px] object-contain"
        />
        <span className="text-lg font-extrabold uppercase tracking-tight text-brand-700">
          SMK Citra Negara
        </span>
      </a>
    );
  }

  return (
    <a href="#beranda" className="flex items-center gap-2.5">
      <Image
        src="/images/logo/logo-smk-citra-negara.png"
        alt="Logo SMK Citra Negara"
        width={52}
        height={52}
        className="h-[52px] w-[52px] object-contain"
      />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold uppercase tracking-tight text-brand-700">
          SMK Citra Negara
        </span>
        <span className="block text-[11px] font-medium text-muted">
          SPMB Online TP 2026/2027
        </span>
      </span>
    </a>
  );
}
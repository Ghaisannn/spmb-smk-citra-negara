import AuthHeader from "./AuthHeader";
import LogoutButton from "./LogoutButton";

export default function DashboardShell({
  roleLabel,
  nama,
  title,
  description,
}: {
  roleLabel: string;
  nama: string;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-mint">
      <div className="flex items-center justify-between pr-4 sm:pr-8">
        <AuthHeader />
        <LogoutButton />
      </div>

      <div className="mx-auto mt-8 w-full max-w-[900px] px-4 pb-16">
        <div className="rounded-md border-t-[6px] border-forest bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <span className="rounded-full bg-pastel px-3 py-1 text-[11px] font-bold text-forest">
            {roleLabel}
          </span>
          <h1 className="mt-4 text-[26px] font-bold text-ink">{title}</h1>
          <p className="mt-1 text-[15px] text-ink/80">
            Selamat datang, <strong>{nama}</strong>.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
    </main>
  );
}
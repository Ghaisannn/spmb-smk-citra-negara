type Props = {
  label: string;
  title: string;
  subtitle: string;
  align?: "center" | "left";
};

export default function SectionHeading({
  label,
  title,
  subtitle,
  align = "center",
}: Props) {
  if (align === "left") {
    return (
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-brand-700">
          {label}
        </p>
        <h2 className="mt-2 text-[32px] font-bold leading-tight text-ink sm:text-[36px]">
          {title}
        </h2>
        <p className="mt-1 text-[15px] text-muted">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-brand-700">
        {label}
      </span>
      <h2 className="mt-3 text-[32px] font-bold leading-tight text-ink sm:text-[36px]">
        {title}
      </h2>
      <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
    </div>
  );
}
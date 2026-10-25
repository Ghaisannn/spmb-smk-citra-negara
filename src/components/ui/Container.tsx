export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1368px] px-6 sm:px-9 ${className}`}>
      {children}
    </div>
  );
}
import { ChevronDown } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const shell =
  "flex items-center gap-3 rounded-lg border bg-white px-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition focus-within:ring-2";
const ok = "border-[#e4ebe6] focus-within:border-forest focus-within:ring-forest/15";
const bad = "border-[#c00000] focus-within:ring-[#c00000]/15";

export function Field({
  label,
  required,
  hint,
  help,
  helpIcon,
  error,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  help?: string;
  helpIcon?: ReactNode;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ink">
          {label}
          {required && <span className="ml-1 text-[#c00000]">*</span>}
        </label>
        {hint && <span className="text-[11.5px] text-ink/70">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1.5 text-[12px] text-[#c00000]">{error}</p>
      ) : help ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-ink/65">
          {helpIcon}
          {help}
        </p>
      ) : null}
    </div>
  );
}

type TextBoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  icon?: ReactNode;
  right?: ReactNode;
  error?: string;
  prefixText?: string;
  muted?: boolean;
};

export function TextBox({ icon, right, error, prefixText, muted, ...props }: TextBoxProps) {
  return (
    <div className={`${shell} h-11 ${error ? bad : ok} ${muted ? "bg-[#f6faf7]" : ""}`}>
      {icon && <span className="shrink-0 text-ink/60">{icon}</span>}
      {prefixText && (
        <span className="shrink-0 rounded bg-pastel px-2 py-0.5 text-[13px] text-ink/80">
          {prefixText}
        </span>
      )}
      <input
        {...props}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/40 read-only:cursor-default"
      />
      {right && <span className="shrink-0 text-ink/60">{right}</span>}
    </div>
  );
}

type SelectBoxProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  icon?: ReactNode;
  error?: string;
};

export function SelectBox({ icon, error, children, ...props }: SelectBoxProps) {
  return (
    <div className={`${shell} relative h-11 ${error ? bad : ok}`}>
      {icon && <span className="shrink-0 text-ink/60">{icon}</span>}
      <select
        {...props}
        className="min-w-0 flex-1 appearance-none bg-transparent pr-7 text-[15px] text-ink outline-none"
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3.5 text-ink/60"
      />
    </div>
  );
}

type AreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  error?: string;
  counter?: string;
};

export function AreaBox({ error, counter, ...props }: AreaProps) {
  return (
    <div className={`${shell} relative flex-col items-stretch gap-0 p-3.5 ${error ? bad : ok}`}>
      <textarea
        {...props}
        rows={4}
        className="w-full resize-none bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/40"
      />
      {counter && (
        <span className="self-end rounded bg-pastel px-2 py-0.5 text-[11px] font-medium text-ink/70">
          {counter}
        </span>
      )}
    </div>
  );
}

export function RadioGroup({
  name,
  value,
  options,
  onChange,
  error,
}: {
  name: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <label
              key={opt}
              className={`flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3.5 text-[15px] transition ${
                selected ? "bg-[#d9f0e0] font-semibold text-ink" : "bg-wash text-ink/85"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={selected}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              <span
                className={`inline-flex size-[18px] items-center justify-center rounded-full border-2 ${
                  selected ? "border-forest" : "border-ink/55"
                }`}
              >
                {selected && <span className="size-2 rounded-full bg-forest" />}
              </span>
              {opt}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-[12px] text-[#c00000]">{error}</p>}
    </div>
  );
}

export function CheckDot() {
  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-forest text-white">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7" />
      </svg>
    </span>
  );
}
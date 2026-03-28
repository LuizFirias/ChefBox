import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  icon?: ReactNode;
};

const variants = {
  primary:
    "bg-[#FF6B35] text-white shadow-[0_18px_36px_rgba(255,107,53,0.22)] hover:bg-[#e85d2b]",
  secondary:
    "border border-slate-200 bg-white text-[#2D3142] hover:border-slate-300",
  ghost: "bg-transparent text-slate-500 hover:bg-white/70",
};

export function AppButton({
  children,
  className = "",
  fullWidth,
  icon,
  type = "button",
  variant = "primary",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
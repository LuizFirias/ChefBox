type ProBadgeProps = {
  variant?: "primary" | "secondary" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function ProBadge({ 
  variant = "primary", 
  size = "md",
  className = "" 
}: ProBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };

  const variantClasses = {
    primary: "bg-[#EEF5EE] text-[#4D7C4F]",
    secondary: "bg-amber-100 text-amber-700",
    gradient: "bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {variant === "gradient" ? "✨ Pro" : "Pro"}
    </span>
  );
}

type FeatureWithBadgeProps = {
  children: React.ReactNode;
  locked?: boolean;
  showBadge?: boolean;
  badgeVariant?: "primary" | "secondary" | "gradient";
  className?: string;
};

/**
 * Wrapper para features que adiciona badge Pro quando necessário
 * e aplica estilo de bloqueio visual
 */
export function FeatureWithBadge({
  children,
  locked = false,
  showBadge = false,
  badgeVariant = "primary",
  className = "",
}: FeatureWithBadgeProps) {
  return (
    <div
      className={`relative ${locked ? "opacity-60 pointer-events-none" : ""} ${className}`}
    >
      {showBadge && (
        <div className="absolute right-3 top-3 z-10">
          <ProBadge variant={badgeVariant} size="sm" />
        </div>
      )}
      {children}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/5 backdrop-blur-[1px]">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg">
            🔒 Requer plano Pro
          </div>
        </div>
      )}
    </div>
  );
}

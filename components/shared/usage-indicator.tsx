"use client";

import { useRecipeUsage } from "@/lib/hooks/useAccessControl";

type UsageIndicatorProps = {
  variant?: "compact" | "full" | "badge";
  className?: string;
};

export function UsageIndicator({ variant = "full", className = "" }: UsageIndicatorProps) {
  const { loading, used, limit, remaining, hasLimit, isNearLimit } = useRecipeUsage();

  if (loading) {
    return (
      <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`}>
        {variant === "badge" ? (
          <div className="h-6 w-16"></div>
        ) : (
          <div className="h-16 w-full"></div>
        )}
      </div>
    );
  }

  // Pro users (sem limite) não mostram contador
  if (!hasLimit) {
    if (variant === "badge") {
      return (
        <span className={`rounded-full bg-[#EEF5EE] px-3 py-1 text-xs font-semibold text-[#4D7C4F] ${className}`}>
          Plano Pro
        </span>
      );
    }
    return null;
  }

  // Badge compacto (ex: "55/60")
  if (variant === "badge") {
    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isNearLimit
            ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-700"
        } ${className}`}
      >
        {used}/{limit}
      </span>
    );
  }

  // Versão compacta (uma linha)
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full transition-all ${
                isNearLimit ? "bg-amber-500" : "bg-[#4D7C4F]"
              }`}
              style={{ width: `${(used / limit) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {remaining} restantes
        </span>
      </div>
    );
  }

  // Versão completa (card)
  return (
    <div className={`rounded-2xl bg-white/80 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Uso mensal
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {used}/{limit} receitas
          </p>
        </div>
        {isNearLimit && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Próximo do limite
          </span>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full transition-all ${
            isNearLimit ? "bg-amber-500" : "bg-[#4D7C4F]"
          }`}
          style={{ width: `${(used / limit) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {remaining > 0
          ? `${remaining} ${remaining === 1 ? "receita restante" : "receitas restantes"} este mês`
          : "Limite mensal atingido"}
      </p>
    </div>
  );
}

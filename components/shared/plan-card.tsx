"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PlanInfo = {
  planType: "lifetime" | "basic" | "pro" | "test" | null;
  planPeriod: "monthly" | "quarterly" | "annual" | null;
  planStatus: "active" | "cancelled" | "expired" | null;
  recipeGenerationsUsed: number;
  recipeGenerationsLimit: number;
  planEndDate: string | null;
};

type PlanCardProps = {
  variant?: "compact" | "full";
  className?: string;
};

const PLAN_NAMES: Record<string, string> = {
  lifetime: "Vitalício",
  basic: "Básico",
  pro: "Pro",
  test: "Teste",
};

const PERIOD_NAMES: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  annual: "Anual",
};

const PLAN_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  lifetime: { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100" },
  basic: { bg: "bg-slate-50", text: "text-slate-700", badge: "bg-slate-100" },
  pro: { bg: "bg-orange-50", text: "text-[#FF6B35]", badge: "bg-orange-100" },
  test: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100" },
};

export function PlanCard({ variant = "compact", className = "" }: PlanCardProps) {
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlanInfo() {
      try {
        const response = await fetch("/api/access-status?detailed=true", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) setLoading(false);
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setPlanInfo(data);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlanInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`}>
        {variant === "compact" ? (
          <div className="h-16 w-full"></div>
        ) : (
          <div className="h-24 w-full"></div>
        )}
      </div>
    );
  }

  if (!planInfo?.planType) {
    return (
      <div className={`rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Plano Gratuito</p>
            <p className="text-xs text-slate-500">Faça upgrade para desbloquear recursos</p>
          </div>
          <Link
            href="/planos"
            className="rounded-full bg-[#FF6B35] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#FF8C42]"
          >
            Ver planos
          </Link>
        </div>
      </div>
    );
  }

  const planType = planInfo.planType;
  const colors = PLAN_COLORS[planType] || PLAN_COLORS.basic;
  const planName = PLAN_NAMES[planType] || planType;
  const periodName = planInfo.planPeriod ? PERIOD_NAMES[planInfo.planPeriod] : null;
  const hasLimit = planInfo.recipeGenerationsLimit > 0 && planInfo.recipeGenerationsLimit < 999999;
  const used = planInfo.recipeGenerationsUsed;
  const limit = planInfo.recipeGenerationsLimit;
  const remaining = hasLimit ? Math.max(0, limit - used) : 0;
  const percentage = hasLimit ? (used / limit) * 100 : 0;
  const isNearLimit = hasLimit && remaining <= 10;

  // Compact version (one line with badge and counter)
  if (variant === "compact") {
    return (
      <div className={`rounded-2xl ${colors.bg} p-3 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          {/* Plan badge */}
          <div className="flex items-center gap-2">
            <span className={`rounded-full ${colors.badge} px-3 py-1 text-xs font-semibold ${colors.text}`}>
              {planType === "pro" && "⭐ "}
              {planName}
              {periodName && ` ${periodName}`}
            </span>
          </div>

          {/* Usage counter */}
          {hasLimit ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700">
                  {remaining} {remaining === 1 ? "receita" : "receitas"}
                </p>
                <p className="text-[10px] text-slate-500">restantes este mês</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  isNearLimit ? "bg-amber-200 text-amber-800" : "bg-white/50 text-slate-700"
                }`}
              >
                {used}/{limit}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-green-700">✨ Gerações ilimitadas</span>
          )}
        </div>
      </div>
    );
  }

  // Full version (card with progress bar)
  return (
    <div className={`rounded-2xl ${colors.bg} border ${colors.badge} p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full ${colors.badge} px-3 py-1 text-xs font-semibold ${colors.text}`}>
              {planType === "pro" && "⭐ "}
              {planName}
              {periodName && ` • ${periodName}`}
            </span>
            {planInfo.planStatus === "cancelled" && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Cancelado
              </span>
            )}
          </div>

          {hasLimit && (
            <>
              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-2xl font-bold text-slate-900">{remaining}</p>
                <p className="text-sm text-slate-600">{remaining === 1 ? "receita restante" : "receitas restantes"}</p>
              </div>

              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/50">
                  <div
                    className={`h-full transition-all ${
                      isNearLimit ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {used} de {limit} usadas este mês
                </p>
              </div>

              {isNearLimit && (
                <div className="mt-3 rounded-xl bg-amber-100 px-3 py-2">
                  <p className="text-xs font-medium text-amber-800">
                    ⚠️ Você está perto do limite mensal!
                    {planType === "basic" && (
                      <Link href="/planos" className="ml-1 underline">
                        Fazer upgrade
                      </Link>
                    )}
                  </p>
                </div>
              )}
            </>
          )}

          {!hasLimit && (
            <p className="mt-2 text-sm font-medium text-green-700">
              ✨ Gerações ilimitadas de receitas por IA
            </p>
          )}
        </div>

        <Link
          href="/planos"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Gerenciar →
        </Link>
      </div>

      {planInfo.planEndDate && planInfo.planStatus === "active" && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-600">
            Renova em:{" "}
            <span className="font-semibold">
              {new Date(planInfo.planEndDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
      )}

      {planInfo.planEndDate && planInfo.planStatus === "cancelled" && (
        <div className="mt-3 border-t border-rose-200 pt-3">
          <p className="text-xs text-rose-700">
            Acesso até:{" "}
            <span className="font-semibold">
              {new Date(planInfo.planEndDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

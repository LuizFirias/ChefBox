"use client";

import { useEffect, useState } from "react";

import { getAccountProfile, saveAccountProfile } from "@/lib/app-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAccessControl, useRecipeUsage } from "@/lib/hooks/useAccessControl";
import { ProBadge } from "@/components/shared/pro-badge";
import { UsageIndicator } from "@/components/shared/usage-indicator";
import { PlanCard } from "@/components/shared/plan-card";

type AccountScreenProps = {
  isPremium: boolean;
};

export function AccountScreen({ isPremium }: AccountScreenProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  
  // Usar hook de controle de acesso
  const { loading: accessLoading, planType, planInfo, isPro, isBasic, isLifetime } = useAccessControl();
  const { used, limit, hasLimit } = useRecipeUsage();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase?.auth.getUser().then(async ({ data }) => {
      const userEmail = data.user?.email ?? "";
      setEmail(userEmail);

      // Try to load profile from API first
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });

        if (response.ok) {
          const profile = await response.json();
          setFullName(profile.fullName || "");
          setWeight(profile.weight || "");
          setHeight(profile.height || "");
        } else {
          // Fallback to localStorage
          const nextProfile = getAccountProfile({
            email: userEmail,
            fullName:
              typeof data.user?.user_metadata?.full_name === "string"
                ? data.user.user_metadata.full_name
                : "",
            plan: isPremium ? "Premium" : "Free",
          });
          setFullName(nextProfile.fullName);
          setWeight(nextProfile.weight);
          setHeight(nextProfile.height);
        }
      } catch (error) {
        // Fallback to localStorage on error
        const nextProfile = getAccountProfile({
          email: userEmail,
          fullName:
            typeof data.user?.user_metadata?.full_name === "string"
              ? data.user.user_metadata.full_name
              : "",
          plan: isPremium ? "Premium" : "Free",
        });
        setFullName(nextProfile.fullName);
        setWeight(nextProfile.weight);
        setHeight(nextProfile.height);
      }
    });
  }, [isPremium]);

  async function handleSaveProfile() {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          weight,
          height,
        }),
      });

      if (response.ok) {
        setMessage("Dados salvos com sucesso!");
      } else {
        // Fallback to localStorage if API fails
        saveAccountProfile({
          email,
          fullName,
          weight,
          height,
          plan: isPremium ? "Premium" : "Free",
        });
        setMessage("Dados salvos neste dispositivo.");
      }
    } catch (error) {
      // Fallback to localStorage on error
      saveAccountProfile({
        email,
        fullName,
        weight,
        height,
        plan: isPremium ? "Premium" : "Free",
      });
      setMessage("Dados salvos neste dispositivo.");
    }
  }

  async function handleResetPassword() {
    setResetMessage(null);
    const supabase = createSupabaseBrowserClient();

    if (!supabase || !email) {
      setResetMessage("E-mail inválido.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setResetMessage("Erro ao enviar e-mail de recuperação.");
    } else {
      setResetMessage("Link de recuperação enviado para seu e-mail.");
    }
  }

  return (
    <section className="mt-6 space-y-4">
      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <h2 className="text-3xl font-bold text-[#2D3142]">
          Olá{fullName ? `, ${fullName}` : ""}! 👋
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use esta área para revisar o e-mail, ajustar dados pessoais e acompanhar o plano atual.
        </p>
      </article>

      {/* Plan Card - mostra plano atual e contador de gerações */}
      <PlanCard variant="full" />

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Acesso
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-[#2D3142]">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="seu@email.com"
              disabled
            />
          </label>
          <label className="block text-sm font-medium text-[#2D3142]">
            Nome
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="Como você quer aparecer"
            />
          </label>
          <div>
            <button
              type="button"
              onClick={handleResetPassword}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#2D3142] hover:bg-slate-50 transition"
            >
              Redefinir senha
            </button>
            {resetMessage && (
              <p className="mt-2 text-sm text-slate-600">{resetMessage}</p>
            )}
          </div>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Informações pessoais
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#2D3142]">Peso e altura</h3>
          </div>
          <span className="rounded-full bg-[#EEF5EE] px-3 py-1 text-xs font-semibold text-[#4D7C4F]">
            {isPremium ? "Premium" : "Free"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-[#2D3142]">
            Peso
            <input
              type="text"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="72 kg"
            />
          </label>
          <label className="block text-sm font-medium text-[#2D3142]">
            Altura
            <input
              type="text"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#F7F9FB] px-4 py-3 text-sm text-[#2D3142] outline-none"
              placeholder="1,75 m"
            />
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Plano atual
        </p>
        
        {accessLoading ? (
          <div className="mt-4 animate-pulse">
            <div className="h-8 w-32 rounded bg-slate-200"></div>
            <div className="mt-2 h-4 w-full rounded bg-slate-200"></div>
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-[#2D3142]">
                    {isPro ? "Pro" : isBasic ? "Básico" : isLifetime ? "Lifetime" : "Free"}
                  </p>
                  {(isPro || isBasic) && (
                    <ProBadge 
                      variant={isPro ? "gradient" : "primary"} 
                      size="md" 
                    />
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isPro && "Acesso completo a todas as funcionalidades premium"}
                  {isBasic && "Receitas mensais limitadas, sem acesso ao planejador"}
                  {isLifetime && "Receitas básicas sem custo mensal"}
                  {!planType && "Crie receitas com limite diário"}
                </p>
                
                {planInfo?.planStatus && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      planInfo.planStatus === "active" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {planInfo.planStatus === "active" ? "✓ Ativo" : "Cancelado"}
                    </span>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleSaveProfile}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2D3142] px-4 text-sm font-semibold text-white hover:bg-[#3D4252] transition"
              >
                Salvar
              </button>
            </div>
            
            {/* Indicador de uso para planos com limite */}
            {hasLimit && (
              <div className="mt-4">
                <UsageIndicator variant="compact" />
              </div>
            )}
            
            {/* CTA para upgrade se não for Pro */}
            {!isPro && (
              <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#FFF9F3] to-[#FFE5D9] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
                  {isBasic ? "Upgrade disponível" : "Recursos Premium"}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {isBasic 
                    ? "Upgrade para Pro e desbloqueie o planejador semanal"
                    : "Crie planos semanais personalizados e receitas ilimitadas"
                  }
                </p>
                <a
                  href="/planos"
                  className="mt-3 inline-flex items-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {isBasic ? "Ver Plano Pro" : "Ver planos"} →
                </a>
              </div>
            )}
          </>
        )}
        
        {message ? <p className="mt-3 text-sm text-[#4D7C4F]">{message}</p> : null}
      </article>

      {/* Legal Links */}
      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(45,49,66,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Informações Legais
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#FF6B35] hover:underline"
          >
            Termos de Uso
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#FF6B35] hover:underline"
          >
            Política de Privacidade
          </a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Ao usar o ChefBox, você concorda com nossos termos e políticas. Seus dados são protegidos
          conforme a LGPD (Lei Geral de Proteção de Dados).
        </p>
      </article>
    </section>
  );
}
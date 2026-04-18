"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Hook para gerenciar upgrade para Premium
 */
export function useUpgradeToPremium() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function goToPlans() {
    router.push("/planos");
  }

  async function createCheckout(planId: "mensal" | "trimestral" | "anual") {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/yampi/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout");
      }

      const data = await response.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    goToPlans,
    createCheckout,
    isLoading,
  };
}

/**
 * Componente de botão de upgrade para Premium
 */
type UpgradeToPremiumButtonProps = {
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
};

export function UpgradeToPremiumButton({
  className = "",
  children,
  variant = "primary",
  size = "md",
}: UpgradeToPremiumButtonProps) {
  const { goToPlans } = useUpgradeToPremium();

  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition";
  
  const variantClasses = {
    primary: "bg-[#FF6B35] text-white hover:bg-[#FF8C42] shadow-lg hover:shadow-xl",
    secondary: "border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-7 py-4 text-lg",
  };

  return (
    <button
      type="button"
      onClick={goToPlans}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children || (
        <>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Assinar Premium
        </>
      )}
    </button>
  );
}

/**
 * Banner de upgrade para Premium
 */
type PremiumUpgradeBannerProps = {
  message?: string;
  ctaText?: string;
};

export function PremiumUpgradeBanner({
  message = "Desbloqueie receitas ilimitadas e planejamento semanal",
  ctaText = "Ver planos",
}: PremiumUpgradeBannerProps) {
  const { goToPlans } = useUpgradeToPremium();

  return (
    <div className="rounded-3xl bg-linear-to-br from-[#FF6B35] to-[#FF8C42] p-6 text-white shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Premium
          </p>
          <h3 className="mt-2 text-xl font-bold">Receitas ilimitadas</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={goToPlans}
          className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#FF6B35] transition hover:bg-white/95 hover:shadow-lg"
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Feature } from "@/lib/types";

type AccessCheckResult = {
  allowed: boolean;
  reason?: string;
  planType?: "lifetime" | "basic" | "pro" | "test" | null;
};

type UserPlanInfo = {
  planType: "lifetime" | "basic" | "pro" | "test" | null;
  planStatus: "active" | "cancelled" | "expired" | null;
  recipeGenerationsUsed: number;
  recipeGenerationsLimit: number;
  canAccessMealPlanner: boolean;
};

/**
 * Hook para verificar acesso a uma feature específica
 * Retorna estado de loading, se tem acesso, e informações do plano
 */
export function useAccessControl(feature?: Feature) {
  const [loading, setLoading] = useState(true);
  const [accessCheck, setAccessCheck] = useState<AccessCheckResult>({
    allowed: false,
  });
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        setLoading(true);

        // Buscar informações do plano do usuário
        const planResponse = await fetch("/api/access-status?detailed=true", {
          cache: "no-store",
        });

        if (!planResponse.ok) {
          if (!cancelled) {
            setAccessCheck({ allowed: false, reason: "Erro ao verificar acesso" });
            setLoading(false);
          }
          return;
        }

        const planData = (await planResponse.json()) as UserPlanInfo & {
          isPremium?: boolean;
        };

        if (cancelled) return;

        setPlanInfo(planData);

        // Se não foi especificada uma feature, retornar apenas info do plano
        if (!feature) {
          setAccessCheck({ 
            allowed: true, 
            planType: planData.planType 
          });
          setLoading(false);
          return;
        }

        // Verificar acesso específico à feature
        const featureResponse = await fetch(
          `/api/access-status?feature=${feature}`,
          { cache: "no-store" }
        );

        if (!featureResponse.ok) {
          if (!cancelled) {
            setAccessCheck({ allowed: false, reason: "Erro ao verificar feature" });
            setLoading(false);
          }
          return;
        }

        const featureData = (await featureResponse.json()) as AccessCheckResult;

        if (!cancelled) {
          setAccessCheck({
            ...featureData,
            planType: planData.planType,
          });
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setAccessCheck({
            allowed: false,
            reason: "Erro de conexão",
          });
          setLoading(false);
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [feature]);

  return {
    loading,
    allowed: accessCheck.allowed,
    reason: accessCheck.reason,
    planType: accessCheck.planType || planInfo?.planType,
    planInfo,
    isPremium: accessCheck.planType === "pro" || accessCheck.planType === "basic" || accessCheck.planType === "test",
    isPro: accessCheck.planType === "pro",
    isBasic: accessCheck.planType === "basic",
    isLifetime: accessCheck.planType === "lifetime",
    isTest: accessCheck.planType === "test",
  };
}

/**
 * Hook simplificado para verificar se o usuário tem plano premium (Basic ou Pro)
 */
export function useIsPremium() {
  const { loading, isPremium, planType } = useAccessControl();
  return { loading, isPremium, planType };
}

/**
 * Hook para obter informações de uso de receitas (contador 55/60)
 */
export function useRecipeUsage() {
  const { loading, planInfo } = useAccessControl();

  return {
    loading,
    used: planInfo?.recipeGenerationsUsed || 0,
    limit: planInfo?.recipeGenerationsLimit || 0,
    remaining: Math.max(
      (planInfo?.recipeGenerationsLimit || 0) - (planInfo?.recipeGenerationsUsed || 0),
      0
    ),
    hasLimit: (planInfo?.recipeGenerationsLimit || 0) > 0,
    isNearLimit:
      planInfo &&
      planInfo.recipeGenerationsLimit > 0 &&
      planInfo.recipeGenerationsUsed >= planInfo.recipeGenerationsLimit * 0.8,
  };
}

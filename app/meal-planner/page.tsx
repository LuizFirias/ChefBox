import type { Metadata } from "next";

import { MealPlanPage } from "@/components/meal-plan-page";

export const metadata: Metadata = {
  title: "Planejamento da semana",
};

export default function MealPlannerRoute() {
  return <MealPlanPage />;
}
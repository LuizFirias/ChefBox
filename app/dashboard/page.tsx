import { Suspense } from "react";

import type { Metadata } from "next";

import { RecipeDetailsScreen } from "@/components/recipe/recipe-details-screen";

export const metadata: Metadata = {
  title: "Receita",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <RecipeDetailsScreen />
    </Suspense>
  );
}
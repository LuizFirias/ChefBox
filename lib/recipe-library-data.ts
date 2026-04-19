export type LibraryRecipe = {
  id: string;
  name: string;
  prepTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
};

export type LibraryCategory = {
  id: string;
  label: string;
  emoji: string;
  recipes: LibraryRecipe[];
};

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    id: "pratos-principais",
    label: "Pratos Principais",
    emoji: "🍽️",
    recipes: [],
  },
  {
    id: "sopas-caldos",
    label: "Sopas e Caldos",
    emoji: "🍲",
    recipes: [],
  },
  {
    id: "lanches",
    label: "Lanches",
    emoji: "🥪",
    recipes: [],
  },
  {
    id: "paes-salgados",
    label: "Pães e Salgados",
    emoji: "🥐",
    recipes: [],
  },
  {
    id: "doces-sobremesas",
    label: "Doces e Sobremesas",
    emoji: "🍰",
    recipes: [],
  },
  {
    id: "fitness-funcionais",
    label: "Fitness, Diet e Funcionais",
    emoji: "💪",
    recipes: [],
  },
  {
    id: "alimentacao-infantil",
    label: "Alimentação Infantil e Papinhas",
    emoji: "👶",
    recipes: [],
  },
];

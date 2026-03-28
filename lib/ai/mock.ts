import type {
  GenerateRecipesInput,
  GenerateRecipesResponse,
  MealPlanResponse,
} from "@/lib/types";

const pantryItems = ["azeite", "alho", "sal", "pimenta", "cheiro-verde"];

function buildRecipeId(seed: string, index: number) {
  return `${seed.replace(/\s+/g, "-")}-${index + 1}`;
}

export function generateMockRecipes(
  input: GenerateRecipesInput,
): GenerateRecipesResponse {
  const baseIngredients = input.ingredients.slice(0, 4);
  const preferences = input.preferences ?? [];
  const preferenceTags = preferences.map((preference) => {
    if (preference === "faster") return "Rapido";
    if (preference === "healthier") return "Leve";
    return "Proteico";
  });

  const templates = [
    {
      title: `Bowl quente de ${baseIngredients[0] ?? "frango"}`,
      description:
        "Mistura reconfortante com base simples, textura cremosa e finalizacao fresca.",
      prepTime: preferences.includes("faster") ? "15 min" : "25 min",
      estimatedCost: input.servings >= 4 ? "R$ 38" : "R$ 24",
      extra: ["iogurte natural", "limao"],
      steps: [
        "Separe os ingredientes e corte tudo em pedaços pequenos para acelerar o preparo.",
        "Doure a base principal com azeite, alho, sal e pimenta ate ganhar cor.",
        "Junte os complementos, ajuste a umidade com uma colher de agua e cozinhe por poucos minutos.",
        "Finalize com ervas, acidez e sirva em tigela funda.",
      ],
    },
    {
      title: `Massa expressa com ${baseIngredients[1] ?? "tomate"}`,
      description:
        "Prato rapido, com molho enxuto e perfil caseiro para reaproveitar o que ja esta na geladeira.",
      prepTime: preferences.includes("faster") ? "12 min" : "20 min",
      estimatedCost: input.servings >= 4 ? "R$ 32" : "R$ 19",
      extra: ["macarrao", "queijo ralado"],
      steps: [
        "Cozinhe a massa em agua salgada ate ficar al dente.",
        "Refogue cebola e alho, adicione os ingredientes principais e deixe formar um molho curto.",
        "Misture a massa ao molho com um pouco da agua do cozimento para dar brilho.",
        "Sirva com queijo e pimenta moida na hora.",
      ],
    },
    {
      title: `Omelete de forno com ${baseIngredients[2] ?? "legumes"}`,
      description:
        "Receita coringa, saciante e facil de adaptar para cafe da manha, almoco ou jantar leve.",
      prepTime: preferences.includes("healthier") ? "18 min" : "22 min",
      estimatedCost: input.servings >= 4 ? "R$ 28" : "R$ 16",
      extra: ["ovos", "aveia"],
      steps: [
        "Bata os ovos com sal, pimenta e uma colher de aveia para dar estrutura.",
        "Misture os ingredientes ja picados e distribua em refratario untado.",
        "Asse ate firmar e dourar levemente nas bordas.",
        "Corte em quadrados e sirva com folhas ou arroz pronto.",
      ],
    },
  ];

  return {
    recipes: templates.map((template, index) => ({
      id: buildRecipeId(baseIngredients.join("-"), index),
      title: template.title,
      description: template.description,
      prepTime: template.prepTime,
      servings: input.servings,
      estimatedCost: template.estimatedCost,
      tags: ["MVP", ...preferenceTags].slice(0, 4),
      ingredients: [...baseIngredients, ...template.extra, ...pantryItems]
        .slice(0, 7)
        .map((ingredient, ingredientIndex) => ({
          name: ingredient,
          quantity:
            ingredientIndex < baseIngredients.length
              ? input.servings === 1
                ? "1 porcao"
                : `${input.servings} porcoes`
              : "a gosto",
        })),
      steps: template.steps,
    })),
  };
}

export function generateMockMealPlan(input: {
  calories: number;
  mealsPerDay: number;
  goal: string;
}): MealPlanResponse {
  const days = [
    "Segunda",
    "Terca",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sabado",
    "Domingo",
  ];

  return {
    plan: days.map((day) => ({
      day,
      meals: Array.from({ length: input.mealsPerDay }).map((_, index) => ({
        slot: `Refeicao ${index + 1}`,
        title: `${input.goal} - base caseira`,
        description: `Refeicao equilibrada com foco em ${input.calories} kcal/dia e preparacao simples.`,
      })),
    })),
    shoppingList: [
      "frango",
      "ovos",
      "arroz",
      "legumes da semana",
      "iogurte natural",
    ],
    prepNotes: [
      "Cozinhe uma base de proteina e carboidrato no domingo.",
      "Deixe vegetais ja higienizados em potes para acelerar o uso.",
    ],
  };
}
import type { 
  GenerateRecipesInput, 
  GenerateRecipesResponse,
  MealPlanResponse 
} from "@/lib/types";

function buildRecipeId(base: string, index: number) {
  return `mock-${base.toLowerCase().replace(/\s+/g, "-")}-${index}`;
}

function normalizeIngredient(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function countMatches(ingredients: string[], terms: string[]): number {
  return ingredients.filter((ingredient) =>
    terms.some((term) => ingredient.includes(term)),
  ).length;
}

export function generateMockRecipes(
  input: GenerateRecipesInput,
): GenerateRecipesResponse {
  const baseIngredients = input.ingredients.slice(0, 4);
  const servings = input.servings || 2;
  const dishType = input.dishType || "lunch";

  function portion(qty: string): string {
    if (servings === 1) return qty;
    // Matches only plain numbers followed by a letter-based unit.
    // Avoids fractions like "1/2" where "/" follows the digit directly.
    const match = qty.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-ZÀ-ú].*)$/);
    if (match) {
      const num = parseFloat(match[1].replace(",", "."));
      const unit = match[2].trim();
      const total = num * servings;
      const formatted = Number.isInteger(total)
        ? String(total)
        : total.toFixed(1).replace(".", ",");
      return unit ? `${formatted} ${unit}` : formatted;
    }
    return qty; // "a gosto", frações como "1/2" e similares ficam inalterados
  }

  // Café da manhã
  if (dishType === "breakfast") {
    const hasEggs = baseIngredients.some(ing => /ovo/i.test(ing));
    const hasBread = baseIngredients.some(ing => /pão|pao/i.test(ing));
    const hasBanana = baseIngredients.some(ing => /banana/i.test(ing));
    const hasYogurt = baseIngredients.some(ing => /iogurte/i.test(ing));
    const hasMilk = baseIngredients.some(ing => /leite/i.test(ing));
    const hasOats = baseIngredients.some(ing => /aveia/i.test(ing));

    const recipes = [];

    if (hasEggs) {
      recipes.push({
        id: buildRecipeId(baseIngredients.join("-") || "breakfast", 0),
        title: hasBread ? "Ovo mexido com pão" : "Ovo mexido simples",
        description: "Café da manhã rápido e proteico.",
        prepTime: "8 min",
        servings,
        tags: ["Rápido", "Proteico"],
        protein: {
          title: "Ovo mexido",
          ingredients: [
            { name: baseIngredients.find(ing => /ovo/i.test(ing)) || "ovo", quantity: portion("2 unidades") },
            { name: "sal", quantity: "a gosto" },
            { name: "óleo", quantity: "1 colher (chá)" },
          ],
          steps: [
            "Bata os ovos com sal.",
            "Aqueça o óleo em fogo médio.",
            "Despeje os ovos e mexa por 3 minutos até firmar.",
          ],
        },
        base: hasBread ? [{
          title: "Pão aquecido",
          ingredients: [
            { name: baseIngredients.find(ing => /pão|pao/i.test(ing)) || "pão", quantity: portion("2 fatias") },
          ],
          steps: [
            "Aqueça o pão na frigideira ou torradeira por 2 minutos.",
          ],
        }] : undefined,
        assembly: hasBread ? [
          "Sirva o ovo mexido com o pão ao lado.",
        ] : [
          "Sirva o ovo mexido quente.",
        ],
        macros: { calories: 220, protein_g: 14, carbs_g: hasBread ? 18 : 2, fat_g: 12 },
      });
    }

    if (hasYogurt || hasMilk) {
      recipes.push({
        id: buildRecipeId(baseIngredients.join("-") || "breakfast", 1),
        title: hasYogurt ? "Bowl de iogurte com frutas" : "Vitamina de banana",
        description: "Opção leve e nutritiva.",
        prepTime: "5 min",
        servings,
        tags: ["Leve", "Saudável"],
        protein: {
          title: hasYogurt ? "Bowl de iogurte" : "Vitamina",
          ingredients: [
            { name: baseIngredients.find(ing => /iogurte|leite/i.test(ing)) || "iogurte", quantity: portion(hasYogurt ? "170g" : "200ml") },
            ...(hasBanana ? [{ name: baseIngredients.find(ing => /banana/i.test(ing)) || "banana", quantity: "1 unidade" }] : []),
            ...(hasOats ? [{ name: baseIngredients.find(ing => /aveia/i.test(ing)) || "aveia", quantity: portion("2 colheres (sopa)") }] : []),
          ],
          steps: hasYogurt ? [
            "Coloque o iogurte em uma tigela.",
            hasBanana ? "Corte a banana em rodelas." : "Adicione frutas picadas.",
            hasOats ? "Adicione a aveia por cima." : "Misture bem.",
            "Sirva na hora.",
          ] : [
            "Bata o leite com a banana no liquidificador.",
            "Sirva gelado.",
          ],
        },
        base: undefined,
        assembly: undefined,
        macros: { calories: 180, protein_g: 8, carbs_g: 28, fat_g: 4 },
      });
    }

    if (recipes.length < 3) {
      recipes.push({
        id: buildRecipeId(baseIngredients.join("-") || "breakfast", 2),
        title: "Toast com banana",
        description: "Simples e energético.",
        prepTime: "5 min",
        servings,
        tags: ["Rápido", "Doce"],
        protein: {
          title: "Toast com banana",
          ingredients: [
            { name: hasBread ? (baseIngredients.find(ing => /pão|pao/i.test(ing)) || "pão") : "pão", quantity: portion("2 fatias") },
            { name: hasBanana ? (baseIngredients.find(ing => /banana/i.test(ing)) || "banana") : "banana", quantity: "1 unidade" },
          ],
          steps: [
            "Aqueça o pão na frigideira.",
            "Corte a banana em rodelas.",
            "Coloque a banana sobre o pão.",
            "Sirva na hora.",
          ],
        },
        base: undefined,
        assembly: undefined,
        macros: { calories: 210, protein_g: 5, carbs_g: 42, fat_g: 2 },
      });
    }

    return { recipes: recipes.slice(0, 3) };
  }

  // Receitas de almoço/jantar (comportamento original)
  const recipes = [
      {
        id: buildRecipeId(baseIngredients.join("-") || "frango", 0),
        title: "Frango grelhado com arroz branco",
        description: "Refeição simples com proteína e base clássica.",
        prepTime: "25 min",
        servings,
        tags: ["Simples", "Dia a dia"],
        protein: {
          title: "Frango grelhado",
          ingredients: [
            { name: baseIngredients[0] || "frango", quantity: portion("300g") },
            { name: "alho", quantity: "2 dentes" },
            { name: "sal", quantity: "a gosto" },
            { name: "azeite", quantity: "1 colher" },
          ],
          steps: [
            "Corte o frango em cubos.",
            "Tempere com sal e alho.",
            "Aqueça o azeite.",
            "Grelhe o frango até dourar.",
          ],
        },
        base: [
          {
            title: "Arroz branco",
            ingredients: [
              { name: "arroz", quantity: portion("1 xícara") },
              { name: "água", quantity: portion("2 xícaras") },
              { name: "sal", quantity: "a gosto" },
            ],
            steps: [
              "Lave o arroz.",
              "Aqueça a água com sal.",
              "Adicione o arroz e cozinhe até secar.",
            ],
          },
        ],
        assembly: [
          "Sirva o arroz no prato.",
          "Adicione o frango por cima.",
        ],
        macros: {
          calories: 450,
          protein_g: 35,
          carbs_g: 48,
          fat_g: 12,
        },
      },

      {
        id: buildRecipeId(baseIngredients.join("-") || "carne", 1),
        title: "Omelete de carne e cebola",
        description: "Mistura rápida com preparo de frigideira e montagem direta.",
        prepTime: "18 min",
        servings,
        tags: ["Rápido", "Frigideira"],
        protein: {
          title: "Omelete de carne",
          ingredients: [
            { name: "carne", quantity: portion("180g") },
            { name: "ovos", quantity: portion("3 unidades") },
            { name: "cebola", quantity: "1/2 unidade" },
            { name: "sal", quantity: "a gosto" },
            { name: "óleo", quantity: "1 colher" },
          ],
          steps: [
            "Pique a carne em tiras pequenas.",
            "Aqueça o óleo.",
            "Doure a carne com a cebola.",
            "Bata os ovos com sal.",
            "Junte os ovos e cozinhe até firmar.",
          ],
        },
        base: [],
        assembly: [
          "Dobre a omelete no prato.",
          "Sirva quente logo em seguida.",
        ],
        macros: {
          calories: 320,
          protein_g: 28,
          carbs_g: 8,
          fat_g: 20,
        },
      },

      {
        id: buildRecipeId(baseIngredients.join("-") || "ovo", 2),
        title: "Frango com legumes salteados",
        description: "Opção leve, sem arroz e com preparo rápido.",
        prepTime: "20 min",
        servings,
        tags: ["Low carb", "Leve"],
        protein: {
          title: "Frango salteado",
          ingredients: [
            { name: baseIngredients[0] || "frango", quantity: portion("250g") },
            { name: "brócolis", quantity: portion("1 xícara") },
            { name: "cenoura", quantity: portion("1/2 unidade") },
            { name: "sal", quantity: "a gosto" },
            { name: "óleo", quantity: "1 colher" },
          ],
          steps: [
            "Corte o frango em tiras.",
            "Aqueça o óleo na frigideira.",
            "Doure o frango com sal.",
            "Adicione os legumes e salteie até ficarem macios.",
          ],
        },
        base: [],
        assembly: [
          "Distribua os legumes no prato.",
          "Sirva o frango por cima.",
        ],
        macros: {
          calories: 280,
          protein_g: 30,
          carbs_g: 15,
          fat_g: 10,
        },
      },

    ];

  return {
    recipes,
  };
}

export function generateMockMealPlan(input: {
  calories: number;
  meals: string[];
  goal: string;
  days?: number;
  servings?: number;
  allergies?: string[];
  preferences?: string[];
}): MealPlanResponse {
  const numDays = input.days ?? 7;
  const targetCalories = input.calories;
  const requestedMeals = input.meals;

  // Calcula calorias por refeição baseado no que foi solicitado
  const caloriesPerMeal: Record<string, number> = {};
  if (requestedMeals.includes("breakfast")) caloriesPerMeal.breakfast = Math.round(targetCalories * 0.25);
  if (requestedMeals.includes("lunch")) caloriesPerMeal.lunch = Math.round(targetCalories * 0.4);
  if (requestedMeals.includes("snack")) caloriesPerMeal.snack = Math.round(targetCalories * 0.15);
  if (requestedMeals.includes("dinner")) caloriesPerMeal.dinner = Math.round(targetCalories * 0.3);

  const days = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  const dailyPlans = [
    {
      breakfast: { title: "Ovos mexidos com pão", description: "2 ovos mexidos com pão integral.", calories: caloriesPerMeal.breakfast ?? 400 },
      snack: { title: "Fruta com pasta de amendoim", description: "1 banana com 1 colher de pasta de amendoim.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Frango grelhado",
        sideDish: "Arroz branco",
        extra: "Brócolis refogado",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Omelete leve",
        description: "Omelete com queijo e tomate.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
    {
      breakfast: {
        title: "Iogurte com frutas",
        description: "Iogurte natural com banana e aveia.",
        calories: caloriesPerMeal.breakfast ?? 400,
      },
      snack: { title: "Mix de castanhas", description: "30g de mix de castanhas variadas.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Carne acebolada",
        sideDish: "Purê de batata",
        extra: "Salada de tomate",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Sopa de legumes",
        description: "Sopa com batata, cenoura e frango.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
    {
      breakfast: {
        title: "Pão com queijo",
        description: "Pão integral com queijo e suco.",
        calories: caloriesPerMeal.breakfast ?? 400,
      },
      snack: { title: "Iogurte com granola", description: "Iogurte natural com granola.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Frango desfiado temperado",
        sideDish: "Feijão caseiro",
        extra: "Couve salteada",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Sanduíche natural",
        description: "Pão com frango, alface e tomate.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
    {
      breakfast: {
        title: "Tapioca com ovo",
        description: "Tapioca simples com ovo e queijo.",
        calories: caloriesPerMeal.breakfast ?? 400,
      },
      snack: { title: "Ovo cozido", description: "2 ovos cozidos temperados.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Omelete de queijo",
        sideDish: "Batata-doce assada",
        extra: "Pepino temperado",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Frango refogado leve",
        description: "Frango com legumes salteados.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
    {
      breakfast: {
        title: "Panqueca de aveia",
        description: "Panqueca com banana e mel.",
        calories: caloriesPerMeal.breakfast ?? 400,
      },
      snack: { title: "Frutas variadas", description: "Mix de frutas da estação.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Frango ao molho rápido",
        sideDish: "Macarrão alho e óleo",
        extra: "Cenoura cozida",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Salada caesar",
        description: "Alface, frango, queijo e molho.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
    {
      breakfast: {
        title: "Mingau de aveia",
        description: "Aveia com leite e canela.",
        calories: caloriesPerMeal.breakfast ?? 400,
      },
      snack: { title: "Queijo com biscoitos integrais", description: "Queijo branco com biscoitos integrais.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Carne moída refogada",
        sideDish: "Arroz com feijão",
        extra: "Alface com cenoura",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Wrap de frango",
        description: "Tortilha com frango e vegetais.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
    {
      breakfast: {
        title: "Frutas com granola",
        description: "Mix de frutas com granola e mel.",
        calories: caloriesPerMeal.breakfast ?? 400,
      },
      snack: { title: "Smoothie de frutas", description: "Smoothie com banana, morango e leite.", calories: caloriesPerMeal.snack ?? 200 },
      lunch: {
        mainDish: "Frango assado simples",
        sideDish: "Legumes cozidos",
        extra: "Feijão temperado",
        calories: caloriesPerMeal.lunch ?? 600,
      },
      dinner: {
        title: "Caldo verde",
        description: "Sopa com couve, batata e linguiça.",
        calories: caloriesPerMeal.dinner ?? 400,
      },
    },
  ];

  const plan = days.slice(0, numDays).map((day, index) => {
    const dayPlan = dailyPlans[index % dailyPlans.length];
    const meals: any[] = [];
    let totalCalories = 0;

    if (requestedMeals.includes("breakfast")) {
      meals.push({ type: "breakfast" as const, ...dayPlan.breakfast });
      totalCalories += dayPlan.breakfast.calories;
    }
    if (requestedMeals.includes("lunch")) {
      meals.push({ type: "lunch" as const, ...dayPlan.lunch });
      totalCalories += dayPlan.lunch.calories;
    }
    if (requestedMeals.includes("snack")) {
      meals.push({ type: "snack" as const, ...dayPlan.snack });
      totalCalories += dayPlan.snack.calories;
    }
    if (requestedMeals.includes("dinner")) {
      meals.push({ type: "dinner" as const, ...dayPlan.dinner });
      totalCalories += dayPlan.dinner.calories;
    }

    return {
      day,
      meals,
      totalCalories,
    };
  });

  const shoppingList = [
    {
      category: "Açougue",
      items: [
        { name: "Peito de frango", quantity: "2 kg" },
        { name: "Carne bovina", quantity: "1 kg" },
        { name: "Linguiça", quantity: "300 g" },
      ],
    },
    {
      category: "Hortifruti",
      items: [
        { name: "Brócolis", quantity: "3 unidades" },
        { name: "Tomate", quantity: "8 unidades" },
        { name: "Cebola", quantity: "1 kg" },
        { name: "Cenoura", quantity: "1 kg" },
        { name: "Pepino", quantity: "3 unidades" },
        { name: "Alface", quantity: "2 unidades" },
        { name: "Couve", quantity: "1 maço" },
        { name: "Batata", quantity: "1,5 kg" },
        { name: "Batata-doce", quantity: "1 kg" },
        { name: "Banana", quantity: "6 unidades" },
      ],
    },
    {
      category: "Mercearia",
      items: [
        { name: "Arroz", quantity: "2 kg" },
        { name: "Feijão", quantity: "1 kg" },
        { name: "Macarrão", quantity: "500 g" },
        { name: "Aveia", quantity: "500 g" },
        { name: "Tapioca", quantity: "200 g" },
        { name: "Azeite", quantity: "500 ml" },
        { name: "Alho", quantity: "3 cabeças" },
      ],
    },
    {
      category: "Laticínios",
      items: [
        { name: "Ovos", quantity: "24 unidades" },
        { name: "Queijo muçarela", quantity: "500 g" },
        { name: "Iogurte natural", quantity: "1 L" },
        { name: "Leite", quantity: "2 L" },
      ],
    },
    {
      category: "Outros",
      items: [
        { name: "Pão integral", quantity: "2 unidades" },
        { name: "Tortilha", quantity: "1 pacote" },
        { name: "Granola", quantity: "300 g" },
      ],
    },
  ];

  const prepPlan = [
    {
      day: "Domingo",
      tasks: [
        "Cozinhe arroz para 3 dias e guarde em porções",
        "Deixe o feijão pronto",
        "Grelhe 1 kg de frango e guarde",
        "Corte cebola e tomate com antecedência",
      ],
    },
    {
      day: "Quarta-feira",
      tasks: [
        "Reabasteça arroz e feijão",
        "Prepare mais 500g de frango",
        "Lave e corte vegetais para saladas",
      ],
    },
  ];

  return {
    plan,
    shoppingList,
    prepPlan,
    macroSummary: {
      protein_g: Math.round(targetCalories * 0.3 / 4),
      carb_g: Math.round(targetCalories * 0.45 / 4),
      fat_g: Math.round(targetCalories * 0.25 / 9),
    },
    estimatedCost: "R$ 180 - R$ 220",
  };
}

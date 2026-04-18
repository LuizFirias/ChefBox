// Correção automática de erros comuns de digitação em ingredientes

const INGREDIENT_CORRECTIONS: Record<string, string> = {
  // Erros de digitação comuns - LEITE
  "çeite": "leite",
  "leitte": "leite",
  "lelte": "leite",
  "leete": "leite",
  
  // TOMATE
  "toamte": "tomate",
  "toomate": "tomate",
  "tommate": "tomate",
  
  // FRANGO
  "farngo": "frango",
  "frago": "frango",
  "frangp": "frango",
  "frnago": "frango",
  
  // ARROZ
  "arros": "arroz",
  "aroz": "arroz",
  "arrroz": "arroz",
  "aros": "arroz",
  
  // CEBOLA
  "seboula": "cebola",
  "sebola": "cebola",
  "ceboola": "cebola",
  "ceboula": "cebola",
  
  // BATATA
  "batatinha": "batata",
  "batat": "batata",
  
  // MANTEIGA
  "manteinga": "manteiga",
  "manteuga": "manteiga",
  "mantega": "manteiga",
  "manteija": "manteiga",
  
  // QUEIJO
  "quejo": "queijo",
  "queijp": "queijo",
  "keijo": "queijo",
  
  // AZEITE/ÓLEO
  "azite": "azeite",
  "olio": "óleo",
  "oleo": "óleo",
  
  // CENOURA
  "senora": "cenoura",
  "cenoora": "cenoura",
  "senoura": "cenoura",
  
  // BRÓCOLIS
  "brocolis": "brócolis",
  "brocles": "brócolis",
  "brocoulo": "brócolis",
  "brocoli": "brócolis",
  
  // PÃO
  "pao": "pão",
  "paoo": "pão",
  
  // MACARRÃO
  "macarrao": "macarrão",
  "macarao": "macarrão",
  "makarao": "macarrão",
  
  // FEIJÃO
  "feijao": "feijão",
  "fejao": "feijão",
  "feijaoo": "feijão",
  
  // TAPIOCA
  "tapioka": "tapioca",
  "tapyoca": "tapioca",
  
  // AVEIA
  "aveya": "aveia",
  "avea": "aveia",
  
  // IOGURTE
  "yogurte": "iogurte",
  "iorgute": "iogurte",
  "yogurt": "iogurte",
  
  // MAMÃO
  "mamao": "mamão",
  "mamaao": "mamão",
  
  // BANANA
  "bananna": "banana",
  "bannana": "banana",
  
  // ABACAXI
  "abacaxe": "abacaxi",
  "abacahi": "abacaxi",
  
  // ALHO
  "alho": "alho",
  "alhoo": "alho",
  
  // CARNE
  "karne": "carne",
  "cane": "carne",
};

/**
 * Normaliza um ingrediente removendo acentos e convertendo para minúsculas
 */
function normalizeIngredient(ingredient: string): string {
  return ingredient
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Corrige erros comuns de digitação em um ingrediente
 * @param ingredient - Ingrediente digitado pelo usuário (pode ter erros)
 * @returns Ingrediente corrigido
 */
export function correctIngredient(ingredient: string): string {
  const trimmed = ingredient.trim();
  if (!trimmed) return trimmed;

  const normalized = normalizeIngredient(trimmed);
  
  // Busca correção exata no mapa
  if (INGREDIENT_CORRECTIONS[normalized]) {
    return INGREDIENT_CORRECTIONS[normalized];
  }

  // Busca correção parcial (ex: "pão integral" busca "pão")
  for (const [wrong, correct] of Object.entries(INGREDIENT_CORRECTIONS)) {
    if (normalized.includes(wrong)) {
      return trimmed.replace(new RegExp(wrong, "gi"), correct);
    }
  }

  // Se não encontrou correção, retorna o original
  return trimmed;
}

/**
 * Corrige uma lista de ingredientes
 */
export function correctIngredients(ingredients: string[]): string[] {
  return ingredients.map(correctIngredient);
}

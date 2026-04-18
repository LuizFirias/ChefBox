export const APP_NAME = "ChefBox";
export const APP_DESCRIPTION =
  "Descubra o que cozinhar com os ingredientes que voce já tem em casa.";

export const AI_BASE_MODEL = process.env.AI_MODEL_BASE ?? process.env.AI_MODEL ?? "gpt-5.4-nano";
export const AI_PREMIUM_MODEL = process.env.AI_MODEL_PREMIUM ?? "gpt-5.4";
export const AI_MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? "800");
export const AI_MAX_OUTPUT_TOKENS_MEAL_PLAN = Number(process.env.AI_MAX_OUTPUT_TOKENS_MEAL_PLAN ?? "4000");
export const AI_CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_SECONDS ?? "900") * 1000;

export const FREE_DAILY_LIMIT = 3;
export const PREMIUM_DAILY_LIMIT = 50;

export const QUICK_INGREDIENTS = [
  "frango",
  "arroz",
  "ovo",
  "tomate",
  "cebola",
  "macarrao",
  "atum",
  "queijo",
  "batata",
  "brocolis",
  "feijao",
  "iogurte",
];

export const PREMIUM_FEATURES = [
  "Planejamento semanal inteligente",
  "Lista de compras automatica",
  "Rotina de meal prep em um dia",
  "Custos estimados por receita",
];
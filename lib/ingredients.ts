export function parseIngredients(input: string): string[] {
  return input
    .split(/[\n,;]/g)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function mergeIngredients(
  selectedIngredients: string[],
  freeText: string,
): string[] {
  return Array.from(new Set([...selectedIngredients, ...parseIngredients(freeText)]));
}
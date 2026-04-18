# ChefBox AI — Instruções para o Agente de Código

Este arquivo orienta a IA ao trabalhar neste projeto.
Sempre leia-o antes de qualquer modificação nos módulos de planejamento de refeições.

---

## Contexto da Mudança Principal

O arquivo `prompts.ts` foi refatorado. A interface `MealPlanInput` foi **expandida**
e a função `buildMealPlanUserPrompt` agora recebe campos adicionais obrigatórios.

### Nova interface (fonte da verdade):

```ts
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface MealPlanInput {
  calories: number;
  meals: MealType[];       // lista de refeições selecionadas pelo usuário
  goal: string;
  days?: number;           // padrão: 7
  servings?: number;       // número de pessoas, padrão: 1
  allergies?: string[];
  preferences?: string[];
}
```

O output do planejador agora também inclui `snack` como tipo de refeição válido
e cada refeição tem o campo `calories: number`.

---

## Módulos a Verificar e Atualizar

### 1. Formulário de Planejamento de Refeições

**Localizar:** componente que renderiza o formulário do meal plan
(procure por `MealPlan`, `meal-plan`, `planner`, `PlannerForm` nos diretórios
`components/`, `features/`, `app/` ou `pages/`).

**O que adicionar ou verificar:**

- [ ] **Seletor de refeições (NOVO):** adicionar um grupo de checkboxes ou toggles
  que permita ao usuário escolher quais refeições deseja incluir no plano.
  Deve mapear para o campo `meals: MealType[]`.

  ```
  ☐ Café da manhã   (breakfast)
  ☐ Almoço          (lunch)
  ☐ Lanche          (snack)      ← NOVO, pode não existir ainda
  ☐ Jantar          (dinner)
  ```

  Por padrão, marcar `lunch` no plano FREE e todos no plano PREMIUM.

- [ ] **Campo de número de pessoas:** adicionar input numérico (mínimo 1, máximo 10)
  mapeado para `servings`. Se já existir apenas para receitas, criar versão
  específica para o plano.

- [ ] **Campo de alergias:** adicionar input de texto com suporte a múltiplos valores
  (chips/tags) mapeado para `allergies: string[]`. Placeholder: "Ex: glúten, lactose".

- [ ] **Campo de preferências:** adicionar input similar ao de alergias para
  `preferences: string[]`. Placeholder: "Ex: legumes variados, sem fritura".

- [ ] **Campo de dias:** verificar se existe selector de quantidade de dias.
  Se não existir, adicionar — padrão 7, opções 3, 5, 7, 14. Mapear para `days`.

- [ ] **Meta calórica:** verificar se o campo de calorias já existe.
  Se sim, garantir que o valor seja passado corretamente. Se não, adicionar
  slider ou input numérico para `calories`.

- [ ] **Objetivo:** verificar se o campo `goal` existe e se aceita os valores:
  `"ganho de massa"`, `"perda de peso"`, `"manutenção"`.
  Se for input livre, converter para `<select>` com essas opções fixas,
  pois os macros são calculados com base nesses valores exatos.

---

### 2. Schema de Validação (Zod / Yup / outros)

**Localizar:** arquivo de schema próximo ao formulário ou em `lib/validations/`,
`schemas/`, `utils/validation.ts`. Procurar por `mealPlan`, `planSchema`, `plannerSchema`.

**O que verificar:**

- [ ] Adicionar `meals` ao schema como array de `MealType` com mínimo de 1 item.
- [ ] Adicionar `servings` como número inteiro entre 1 e 10, opcional.
- [ ] Adicionar `allergies` como array de strings, opcional.
- [ ] Adicionar `preferences` como array de strings, opcional.
- [ ] Adicionar `days` como número, opcional, enum de [3, 5, 7, 14].
- [ ] Garantir que `goal` seja validado contra os valores aceitos pelo prompt.

Exemplo em Zod:
```ts
import { z } from "zod";

const mealTypeSchema = z.enum(["breakfast", "lunch", "snack", "dinner"]);

export const mealPlanInputSchema = z.object({
  calories:    z.number().min(1200).max(5000),
  meals:       z.array(mealTypeSchema).min(1),
  goal:        z.enum(["ganho de massa", "perda de peso", "manutenção"]),
  days:        z.number().optional().default(7),
  servings:    z.number().min(1).max(10).optional().default(1),
  allergies:   z.array(z.string()).optional().default([]),
  preferences: z.array(z.string()).optional().default([]),
});
```

---

### 3. Chamada de API / Server Action

**Localizar:** função que chama a rota de geração do plano.
Procurar por `generateMealPlan`, `createPlan`, `api/meal-plan`, `actions/plan`.

**O que verificar:**

- [ ] A chamada deve passar todos os campos de `MealPlanInput`, não apenas
  `calories`, `mealsPerDay` e `goal`.
- [ ] Remover o campo `mealsPerDay` (obsoleto) se ainda existir — substituir por `meals`.
- [ ] Garantir que `meals`, `allergies` e `preferences` sejam arrays, nunca strings.
- [ ] Verificar se o tipo de retorno da API inclui `snack` como possível `type` de refeição.

---

### 4. Componente de Exibição do Plano (Output)

**Localizar:** componente que renderiza o resultado do plano gerado.
Procurar por `MealPlanResult`, `PlanCard`, `DayCard`, `MealCard`.

**O que verificar:**

- [ ] **Renderização do `snack`:** o componente precisa tratar o tipo `"snack"`
  assim como trata `"breakfast"`, `"lunch"` e `"dinner"`. Se houver um
  `switch/case` ou `if/else` por tipo, adicionar o caso `snack`.

- [ ] **Exibição de calorias por refeição:** cada refeição agora tem `calories: number`.
  Verificar se esse campo é exibido. Se não, adicionar badge ou texto com
  a caloria de cada refeição.

- [ ] **`totalCalories` por dia:** o plano agora retorna `totalCalories` por dia.
  Verificar se esse valor é exibido no card do dia. Se não, adicionar.

- [ ] **`macroSummary`:** o output inclui `{ protein_g, carb_g, fat_g }`.
  Verificar se há um componente de resumo de macros. Se não existir, criar
  um card simples com os três valores para exibir ao final do plano.

---

### 5. State Management (Zustand / Redux / Context)

**Localizar:** store ou contexto que gerencia o estado do meal planner.
Procurar por `useMealPlanStore`, `mealPlanSlice`, `MealPlanContext`.

**O que verificar:**

- [ ] O estado de input deve refletir a nova interface `MealPlanInput`.
- [ ] Adicionar campo `meals: MealType[]` ao estado inicial — padrão: `["breakfast", "lunch", "dinner"]`.
- [ ] Adicionar `allergies: string[]` — padrão: `[]`.
- [ ] Adicionar `preferences: string[]` — padrão: `[]`.
- [ ] Adicionar `servings: number` — padrão: `1`.
- [ ] Remover `mealsPerDay: number` se existir (obsoleto).

---

### 6. Tipos Compartilhados

**Localizar:** `lib/types.ts`, `types/index.ts`, ou similar.

**O que verificar:**

- [ ] `MealType` deve ser exportado e usado em todos os módulos acima.
- [ ] `MealPlanInput` deve ser importado de `prompts.ts` ou duplicado em `types.ts`
  (manter uma única fonte da verdade — evitar duplicação).
- [ ] O tipo de retorno do plano (`MealPlanOutput`) deve incluir:
  ```ts
  type MealPlanOutput = {
    plan: Array<{
      day: string;
      meals: Array<
        | { type: "breakfast" | "dinner" | "snack"; title: string; description: string; calories: number }
        | { type: "lunch"; mainDish: string; sideDish: string; extra: string; calories: number }
      >;
      totalCalories: number;
    }>;
    shoppingList: Array<{ category: string; items: Array<{ name: string; quantity: string }> }>;
    prepPlan: Array<{ day: string; tasks: string[] }>;
    macroSummary: { protein_g: number; carb_g: number; fat_g: number };
    estimatedCost: string;
  };
  ```

---

## Ordem de Execução Sugerida

Execute as alterações na seguinte ordem para evitar erros de tipo em cascata:

1. `lib/types.ts` — atualizar tipos compartilhados
2. Schema de validação — atualizar Zod/Yup
3. Store/Context — atualizar estado
4. Componente de formulário — adicionar os novos campos de UI
5. Chamada de API — atualizar payload enviado
6. Componente de resultado — renderizar `snack`, `calories`, `macroSummary`

---

## Convenções do Projeto

- Sempre use `MealType` importado de `lib/types.ts` — nunca string literal.
- Refeições em português apenas no display (label). Internamente use inglês (`snack`, não `lanche`).
- Não quebre o contrato da API sem atualizar o schema de validação primeiro.
- Toda chamada a `buildMealPlanUserPrompt()` deve passar o objeto `MealPlanInput` completo.
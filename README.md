<<<<<<< HEAD
# ChefBox
AI que transforma seus ingredientes em refeições em minutos

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra http://localhost:3000 no navegador.

## Build

```bash
npm run build
```

## Visao do MVP

Este repositório agora está estruturado como um MVP de Chef AI: um assistente de cozinha mobile-first, simples e orientado a utilidade imediata.

Objetivo central:

- transformar ingredientes disponíveis em 2 a 4 sugestões de receitas acionáveis
- aplicar variações rápidas como "mais rapido", "mais leve" e "high protein"
- limitar uso grátis por dia e abrir paywall depois do limite

## Estrutura de pastas

```text
app/
	api/
		generate-meal-plan/
		generate-recipes/
	auth/callback/
	dashboard/
	offline/
	globals.css
	layout.tsx
	manifest.ts
	page.tsx
components/
	dashboard/
	marketing/
	pwa/
	shared/
lib/
	ai/
	supabase/
	config.ts
	ingredients.ts
	types.ts
	usage.ts
	validation.ts
public/
	icon.svg
	sw.js
supabase/
	schema.sql
```

## Arquitetura

- UI: componentes em `components/*`
- regra de negócio: `lib/usage.ts`, `lib/ingredients.ts`, `lib/validation.ts`
- camada de IA: `lib/ai/*`
- integração Supabase: `lib/supabase/*`
- rotas serverless: `app/api/*`

Essa separação mantém a interface desacoplada da lógica de uso, validação e integração com provedores.

## Variáveis de ambiente

Use `.env.example` como base.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_API_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=gpt-4.1-mini
```

Notas práticas:

- sem `AI_API_KEY`, a API cai automaticamente no mock local para facilitar demo
- sem `SUPABASE_SERVICE_ROLE_KEY`, o app funciona, mas o limite diário não fica persistido no banco

## Endpoints

### POST `/api/generate-recipes`

Entrada:

```json
{
	"ingredients": ["frango", "arroz", "cebola"],
	"preferences": ["faster", "high-protein"],
	"servings": 2
}
```

Saída:

```json
{
	"recipes": [
		{
			"id": "frango-arroz-cebola-1",
			"title": "Bowl quente de frango",
			"description": "Mistura reconfortante com base simples.",
			"prepTime": "15 min",
			"tags": ["MVP", "Rapido", "Proteico"],
			"ingredients": [
				{ "name": "frango", "quantity": "1 porcao" }
			],
			"steps": ["Separe os ingredientes."]
		}
	],
	"usage": {
		"used": 1,
		"limit": 4,
		"remaining": 3,
		"isPremium": false,
		"upgradeRequired": false,
		"persisted": true
	},
	"source": "ai"
}
```

### POST `/api/generate-meal-plan`

Entrada:

```json
{
	"calories": 2200,
	"mealsPerDay": 4,
	"goal": "ganho de massa magra"
}
```

Saída:

```json
{
	"plan": [
		{
			"day": "Segunda",
			"meals": [
				{
					"slot": "Refeicao 1",
					"title": "ganho de massa magra - base caseira",
					"description": "Refeicao equilibrada com preparacao simples."
				}
			]
		}
	],
	"shoppingList": ["frango", "ovos"],
	"prepNotes": ["Cozinhe uma base no domingo."],
	"source": "ai"
}
```

Observação: esse endpoint já nasce bloqueado para premium.

## Prompt engineering

Os prompts ficam em `lib/ai/prompts.ts` e seguem quatro regras:

- curtos para economizar tokens
- determinísticos com `temperature` baixa
- sempre exigem JSON puro
- mantêm shape fixo para reduzir parsing frágil

Exemplo de system prompt para receitas:

```text
You are Chef AI, a concise cooking assistant.
Return valid JSON only.
Generate exactly 3 recipe ideas in Brazilian Portuguese.
Recipes must use the provided ingredients as the main base and may add up to 4 common pantry items.
```

## Supabase

O schema completo está em `supabase/schema.sql`.

Tabelas principais:

- `users`: espelho leve do `auth.users`
- `usage_limits`: contador diário por usuário autenticado ou chave anônima
- `saved_recipes`: persistência opcional das receitas favoritas
- `subscriptions`: placeholder para plano premium

## PWA

Itens já scaffoldados:

- `app/manifest.ts`
- `public/sw.js`
- `app/offline/page.tsx`
- `public/icon.svg`

Resultado prático:

- instalável em dispositivos compatíveis
- fallback básico offline para navegação
- cache simples dos assets locais

## Segurança e abuso

Medidas implementadas:

- validação de payload com `zod`
- limite diário no backend
- premium conferido no servidor
- uso de `service_role` apenas do lado servidor

Próximos passos recomendados para produção:

1. Adicionar rate limit por IP com Upstash Redis ou Vercel WAF.
2. Integrar cobrança real em `subscriptions`.
3. Salvar receitas geradas em `saved_recipes`.

## Guia de setup

1. Instale dependências.

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha Supabase + AI.

3. Crie um projeto no Supabase e execute `supabase/schema.sql` no SQL Editor.

4. No Supabase Auth, habilite Google provider.

5. Configure a URL de callback do Google e do Supabase para:

```text
http://localhost:3000/auth/callback
https://seu-dominio.com/auth/callback
```

6. Rode localmente.

```bash
npm run dev
```

7. Faça deploy na Vercel e replique as variáveis de ambiente.

## Roadmap enxuto depois do MVP

1. Favoritar receitas geradas.
2. Histórico de gerações por usuário.
3. Upgrade com checkout real.
4. Tela premium para meal plan e lista de compras.

# Passo a Passo: Ativar Checkout Transparente Mercado Pago

Este guia mostra os passos necessários para ativar o checkout transparente do Mercado Pago no ChefBox.

## ✅ Checklist de Implementação

### 1. ✓ Instalar Dependências
```bash
npm install mercadopago
```

### 2. ⚠️ Executar Migração do Banco de Dados

**IMPORTANTE:** Execute a migração para adicionar as colunas necessárias ao banco.

#### Opção A: Usando Supabase CLI (recomendado)

```bash
# 1. Se ainda não tem o Supabase CLI instalado
npm install -g supabase

# 2. Link com o projeto (se ainda não fez)
supabase link --project-ref xsevdtxigjxdtqfhfbth

# 3. Execute a migração
supabase db push
```

#### Opção B: Executar manualmente no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/xsevdtxigjxdtqfhfbth/editor
2. Vá em "SQL Editor"
3. Cole o conteúdo do arquivo `supabase/migrations/007_add_mercadopago_integration.sql`
4. Execute (Run)

### 3. ⚠️ Regenerar Tipos do TypeScript

Após executar a migração, regenere os tipos para que o TypeScript reconheça as novas colunas:

```bash
# Com Supabase CLI
supabase gen types typescript --project-id xsevdtxigjxdtqfhfbth > lib/supabase/database.types.ts
```

Ou manualmente:
1. Vá em Supabase Dashboard → Project Settings → API
2. Clique na aba "Types"
3. Copie o conteúdo TypeScript gerado
4. Cole em `lib/supabase/database.types.ts`

**Ou ainda mais fácil:** Deixe que eu gere os tipos automaticamente para você (veja próximo passo)

### 4. ⚠️ Configurar Variáveis de Ambiente

No arquivo `.env.local`, preencha as credenciais do Mercado Pago:

```env
# Mercado Pago — Checkout Transparente
MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
MP_WEBHOOK_SECRET=chefbox_mp_webhook_2026_secure_key_xyz123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Como obter/configurar as credenciais:**

1. **MP_PUBLIC_KEY e MP_ACCESS_TOKEN**:
   - Acesse: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials
   - Copie os valores e cole nas duas variáveis correspondentes
   
2. **MP_WEBHOOK_SECRET** (VOCÊ CRIA):
   - Esta NÃO vem do Mercado Pago
   - Crie qualquer string aleatória segura (ex: `chefbox_mp_webhook_2026_secure_key_xyz123`)
   - É usada para validar que os webhooks realmente vêm do MP
   
3. **NEXT_PUBLIC_APP_URL**:
   - Em desenvolvimento: `http://localhost:3000`
   - Em produção: `https://chefbox.com.br` (ou seu domínio)

### 5. ✓ Arquivos Criados

Estes arquivos já foram criados automaticamente:

- ✓ `components/checkout/PaymentModal.tsx` — Modal de pagamento
- ✓ `app/api/subscriptions/actions.ts` — Lógica de assinaturas
- ✓ `app/api/webhooks/mercadopago/route.ts` — Webhook para renovações
- ✓ `supabase/migrations/007_add_mercadopago_integration.sql` — Migração
- ✓ `next.config.ts` — Configuração atualizada
- ✓ `.env.local` — Template de variáveis adicionado

### 6. ⚠️ Configurar Webhook

⚠️ **IMPORTANTE:** O Mercado Pago NÃO aceita `http://localhost:3000` porque precisa de HTTPS público.

**Opção A — Desenvolvimento: NÃO configure webhook** (Recomendado)
- Assinaturas funcionam normalmente sem webhook
- Renovações automáticas só testáveis em produção
- Mais simples e sem complicações

**Opção B — Desenvolvimento: Use ngrok** (Se quiser testar webhooks)
```bash
ngrok http 3000
# Use a URL gerada: https://abc123.ngrok-free.app/api/webhooks/mercadopago
```
📖 Veja guia completo: [MERCADOPAGO_DEV_WEBHOOK.md](./MERCADOPAGO_DEV_WEBHOOK.md)

**Produção: Configure webhook normalmente**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Webhooks"
3. URL: `https://chefbox.com.br/api/webhooks/mercadopago`
4. Eventos: `subscription_preapproval`, `payment`

### 7. ⚠️ Reiniciar Servidor de Desenvolvimento

Após configurar as variáveis de ambiente, reinicie o servidor:

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

---

## 🧪 Testando

### 1. Usar Ambiente de Teste do Mercado Pago

No painel do MP, alterne para o modo de teste e use as credenciais de teste.

### 2. Cartões de Teste

```
Visa aprovado:
  Número: 4509 9535 6623 3704
  CVV: 123
  Validade: 11/25
  CPF: 123.456.789-01
  Nome: APRO (APRO para aprovar automaticamente)

Mastercard recusado:
  Número: 5031 4332 1540 6351
  CVV: 123
  Validade: 11/25
```

### 3. Testar Fluxo Completo

1. Acesse a página de planos (criar uma se não existir)
2. Clique em "Assinar Pro"
3. Preencha o formulário com cartão de teste
4. Verifique se:
   - Modal fecha após pagamento
   - Plano é atualizado no Supabase
   - Acesso é liberado imediatamente

---

## 🔧 Troubleshooting

### Erro de Tipo: `mp_subscription_id` não existe

**Causa:** Migração não foi executada ou tipos não foram regenerados.

**Solução:**
1. Execute a migração (passo 2)
2. Regenere os tipos (passo 3)
3. Reinicie o TypeScript Server no VSCode (`Ctrl+Shift+P` → "Restart TS Server")

### Erro: `NEXT_PUBLIC_MP_PUBLIC_KEY is undefined`

**Causa:** Variável não foi configurada ou servidor não foi reiniciado.

**Solução:**
1. Verifique se `.env.local` tem a variável
2. Reinicie o servidor (`npm run dev`)

### Webhook não está sendo chamado

**Causa:** URL não está acessível publicamente.

**Solução:**
- Em desenvolvimento, use ngrok
- Em produção, verifique se a URL está configurada corretamente no painel do MP

---

## 📚 Documentação Adicional

- [MERCADOPAGO_CHECKOUT.md](./MERCADOPAGO_CHECKOUT.md) — Documentação completa do checkout
- [MERCADOPAGO_EXAMPLES.md](./MERCADOPAGO_EXAMPLES.md) — Exemplos de uso em diferentes telas

---

## 🎯 Próximos Passos

Após completar todos os passos acima:

1. Integre o `PaymentModal` na tela de planos
2. Adicione botões de upgrade no dashboard
3. Configure o webhook em produção quando fizer deploy
4. Teste o fluxo completo de assinatura e renovação

Para exemplos de como usar em diferentes telas, veja [MERCADOPAGO_EXAMPLES.md](./MERCADOPAGO_EXAMPLES.md).

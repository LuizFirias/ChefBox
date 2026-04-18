# Configuração de Webhook — Mercado Pago

## 🎯 **Passo 3: Configurar Webhook para Renovações Automáticas**

O webhook é necessário para que o Mercado Pago notifique seu sistema quando:
- Uma renovação de assinatura for cobrada
- Um pagamento for aprovado
- Um pagamento falhar
- Uma assinatura for cancelada

---

## 📋 **Passos para Configurar**

### **1. Acessar Dashboard do Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com a conta da empresa
3. Clique na aplicação **"ChefBox"** (ou crie uma se não existir)

---

### **2. Configurar URL do Webhook**

1. No menu lateral, clique em **"Webhooks"**
2. Clique em **"Configurar notificações"**
3. Selecione os eventos:
   - ✅ **Pagamentos** (`payment`)
   - ✅ **Assinaturas** (`subscription_preapproval`)
   - ✅ **Cobranças autorizadas** (`subscription_authorized_payment`)

4. **URL de Produção:**
   ```
   https://www.chefbox.com.br/api/webhooks/mercadopago
   ```

5. Clique em **"Salvar"**

---

### **3. Obter Secret do Webhook (Opcional)**

Para maior segurança, você pode validar que as notificações vêm realmente do MP:

1. No painel de Webhooks, clique em **"Mostrar Secret"**
2. Copie o código (será algo como: `1234567890abcdef...`)
3. Adicione nas variáveis de ambiente:
   
   **Vercel:**
   ```bash
   vercel env add MP_WEBHOOK_SECRET production
   # Cole o secret quando solicitado
   ```

   **.env.local / .env.production:**
   ```
   MP_WEBHOOK_SECRET=1234567890abcdef...
   ```

---

### **4. Testar Webhook**

#### **Opção A: Usar Simulador do MP (Sandbox)**

1. No dashboard, vá em **Webhooks > Testar notificações**
2. Selecione evento: `payment`
3. Clique em **"Enviar notificação de teste"**
4. Verifique logs da aplicação

#### **Opção B: Fazer Pagamento Real de Teste**

1. Assine um plano (Básico Mensal R$ 14,90)
2. Aguarde 1 minuto
3. Verifique logs:
   ```bash
   vercel logs --prod
   ```
4. Procure por: `[webhook] Recebido:`
5. Cancele a assinatura de teste após validar

---

### **5. Logs do Webhook (Verificação)**

Quando uma notificação chegar, você verá nos logs:

```
[webhook] Recebido: {
  "id": "123456789",
  "type": "subscription_preapproval",
  "data": { "id": "abc123..." }
}
```

Isso significa que está funcionando! ✅

---

## 🔄 **Como Funciona o Fluxo**

### **Renovação Automática (Mensal/Trimestral/Anual)**

1. **Data de renovação chega** (ex: 15/05/2026)
2. MP cobra automaticamente no cartão salvo
3. **Se aprovado:**
   - MP envia notificação para o webhook
   - Seu servidor atualiza `plan_end_date` no banco
   - Reseta contador de receitas (`recipe_generations_used = 0`)
   - Cliente continua com acesso

4. **Se recusado:**
   - MP tenta novamente em 3 dias
   - Após 3 falhas, cancela automaticamente
   - Webhook notifica o cancelamento
   - Sistema bloqueia acesso do cliente

---

## ⚙️ **Código do Webhook (Já Implementado)**

O webhook está em: [/app/api/webhooks/mercadopago/route.ts](../../../app/api/webhooks/mercadopago/route.ts)

**O que ele faz:**
- Recebe notificação do MP
- Busca dados da assinatura pela API
- Atualiza banco de dados (Supabase)
- Recalcula plano ativo do usuário
- Retorna status 200 (confirma recebimento)

---

## 🛡️ **Segurança**

### **Validação do MP (Recomendado)**

Para garantir que só o MP pode enviar notificações:

1. Obtenha o `x-signature` e `x-request-id` dos headers
2. Use a biblioteca oficial do MP para validar
3. Código exemplo:

```typescript
import { MercadoPagoConfig } from 'mercadopago'

const headers = request.headers
const signature = headers.get('x-signature')
const requestId = headers.get('x-request-id')

// Validar assinatura
const isValid = await mp.webhooks.validate(signature, requestId, body)

if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

---

## 📊 **Monitoramento**

### **Dashboard de Webhooks do MP**

1. Acesse: https://www.mercadopago.com.br/developers/panel/webhooks
2. Veja todas as notificações enviadas
3. Status de cada envio (sucesso/erro)
4. Payload completo de cada notificação
5. Botão para reenviar manualmente se falhou

### **Logs da Aplicação (Vercel)**

```bash
# Ver logs em tempo real
vercel logs --prod --follow

# Filtrar apenas webhooks
vercel logs --prod | grep webhook
```

---

## ❗ **Problemas Comuns**

### **1. Webhook não está recebendo notificações**

**Causas:**
- URL errada configurada no MP
- Firewall bloqueando IP do MP
- Aplicação retornando erro 500
- Timeout (resposta demorou mais de 30s)

**Solução:**
- Verificar URL no dashboard MP
- Testar manualmente: `curl -X POST https://www.chefbox.com.br/api/webhooks/mercadopago`
- Verificar logs de erro

### **2. Notificações duplicadas**

**Causa:**
- MP reenvia se não receber status 200 em 30s

**Solução:**
- Sempre retornar status 200 rapidamente
- Processar dados em background se demorado
- Usar idempotency key para evitar duplicatas

### **3. Assinatura não renovou no banco**

**Causa:**
- Webhook não recebeu notificação
- Erro ao processar notificação

**Solução:**
- Verificar logs do webhook
- Buscar manualmente na API do MP
- Atualizar banco manualmente se necessário

---

## ✅ **Checklist de Configuração**

- [ ] Webhook configurado no dashboard MP
- [ ] URL de produção correta (`https://www.chefbox.com.br/api/webhooks/mercadopago`)
- [ ] Eventos selecionados (payment, subscription_preapproval)
- [ ] Secret salvo nas env vars (opcional mas recomendado)
- [ ] Teste realizado (simulador ou pagamento real)
- [ ] Logs verificados (notificações chegando)
- [ ] Banco de dados atualizando corretamente

---

**Status:** ✅ Webhook implementado e pronto para configuração  
**Última atualização:** 18/04/2026

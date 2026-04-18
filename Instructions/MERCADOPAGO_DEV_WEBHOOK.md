# Webhook do Mercado Pago em Desenvolvimento

## Problema

O Mercado Pago **não aceita** `http://localhost:3000` como URL de webhook porque precisa de:
- ✅ URL acessível publicamente (não localhost)
- ✅ HTTPS (não HTTP)

## Soluções

### ✅ Opção 1: Usar ngrok (Recomendado para Testes)

ngrok cria um túnel seguro que expõe seu localhost para a internet.

#### 1. Instalar ngrok

```bash
# Com Chocolatey (Windows)
choco install ngrok

# Ou baixe direto de: https://ngrok.com/download
```

#### 2. Criar conta gratuita no ngrok

1. Acesse: https://dashboard.ngrok.com/signup
2. Copie seu authtoken

#### 3. Configurar authtoken

```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

#### 4. Iniciar o túnel

```bash
# Em um terminal separado, rode:
ngrok http 3000
```

Você verá algo assim:
```
Forwarding  https://abc123def.ngrok-free.app -> http://localhost:3000
```

#### 5. Configurar webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Webhooks"
3. Use a URL: `https://abc123def.ngrok-free.app/api/webhooks/mercadopago`
4. Selecione eventos:
   - ✅ `subscription_preapproval`
   - ✅ `payment`

⚠️ **Importante:** A URL do ngrok muda toda vez que você reinicia. Atualize no painel do MP sempre que reiniciar o ngrok.

---

### ✅ Opção 2: Usar localtunnel (Alternativa gratuita)

```bash
# Instalar
npm install -g localtunnel

# Iniciar túnel
lt --port 3000

# Você receberá uma URL tipo:
# https://abc-123.loca.lt
```

Use essa URL no webhook do MP: `https://abc-123.loca.lt/api/webhooks/mercadopago`

---

### ✅ Opção 3: Testar sem webhook (Desenvolvimento)

Durante o desenvolvimento, você pode **não configurar o webhook** e testar assim:

1. **Assinatura inicial funciona normalmente** (sem precisar de webhook)
2. **Renovações automáticas** não serão testadas (só em produção)
3. **Cancelamentos** você testa manualmente chamando a função

#### Exemplo de teste manual:

```typescript
// No console do navegador ou em um teste
await fetch('/api/webhooks/mercadopago', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'subscription_preapproval',
    data: { id: 'ID_DA_ASSINATURA_TESTE' }
  })
})
```

---

### ✅ Opção 4: Só configurar webhook em produção (Mais Simples)

**Para desenvolvimento local:**
- ❌ NÃO configure webhook
- ✅ Teste apenas a criação de assinaturas
- ✅ Renovações e atualizações funcionarão automaticamente em produção

**Quando fizer deploy:**
- Configure o webhook com a URL de produção: `https://chefbox.com.br/api/webhooks/mercadopago`

---

## Fluxo de Teste Recomendado

### Em Desenvolvimento (Sem Webhook)

```
1. Usuário clica "Assinar Pro"
   ✅ Funciona normalmente

2. Preenche formulário de pagamento
   ✅ Funciona normalmente

3. Pagamento é processado
   ✅ Assinatura criada no MP
   ✅ Banco atualizado
   ✅ Acesso liberado

4. Renovação mensal automática
   ❌ Não testável localmente (precisa webhook)
   ✅ Funciona em produção
```

### Em Produção (Com Webhook)

```
1-3. Igual desenvolvimento
   ✅ Tudo funciona

4. Renovação mensal automática
   ✅ MP cobra o cartão
   ✅ Webhook notifica o ChefBox
   ✅ Contador de receitas resetado
   ✅ Plano continua ativo
```

---

## Recomendação Final

Para **desenvolvimento local:**
- **Não use webhook** (não vale a pena a complexidade)
- Teste criação, upgrade e cancelamento de assinaturas
- Confie que renovações funcionarão em produção

Para **produção:**
- Configure webhook: `https://chefbox.com.br/api/webhooks/mercadopago`
- Teste renovações em ambiente real
- Monitore logs do webhook no painel do MP

---

## Testando o Webhook Manualmente

Se quiser testar o webhook localmente sem ngrok:

```bash
# Em um terminal, inicie o servidor
npm run dev

# Em outro terminal, simule um webhook
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription_preapproval",
    "data": { "id": "abc123" }
  }'
```

Ou use um cliente HTTP como Postman/Insomnia/Thunder Client.

---

## Logs do Webhook

Para ver se o webhook está sendo chamado, veja os logs no painel do MP:
- https://www.mercadopago.com.br/developers/panel/app
- Seção "Webhooks" → "Logs"

Lá você verá:
- ✅ Webhooks entregues com sucesso (status 200)
- ❌ Webhooks que falharam (com detalhes do erro)

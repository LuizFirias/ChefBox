# Guia de Imagens para Checkout — Credibilidade e Segurança

## ✅ Status Atual da Implementação

### **Implementado e Funcionando:**

#### 1. **Bandeiras de Cartão** (via `payment-icons` npm)
- ✅ Visa
- ✅ Mastercard
- ✅ Elo
- ✅ American Express

**Como funciona:**
```tsx
import visaIcon from 'payment-icons/min/flat/visa.svg'
import mastercardIcon from 'payment-icons/min/flat/mastercard.svg'
import eloIcon from 'payment-icons/min/flat/elo.svg'
import amexIcon from 'payment-icons/min/flat/amex.svg'

<Image src={visaIcon} alt="Visa" width={45} height={30} />
```

#### 2. **Logo Mercado Pago** (via `public/mercadopago-logo.png`)
- ✅ Exibido no footer do modal
- ✅ Tamanho: 100x33px

#### 3. **Selos de Segurança** (via `public/`)
- ✅ SSL Badge: `SSLencryption-logo.png` (16x16px no header)
- ✅ 100% Seguro: `100seguro-logo.png` (16x16px no header)

---

## 📦 Biblioteca `payment-icons` (✅ Instalada)

**Pacote npm:** `payment-icons@1.2.1`

A biblioteca fornece SVGs otimizados de bandeiras de cartão prontos para uso.

**Instalação:**
```bash
npm install payment-icons  # Já instalado no projeto ✅
```

**Importação no código:**
```tsx
import visaIcon from 'payment-icons/min/flat/visa.svg'
import mastercardIcon from 'payment-icons/min/flat/mastercard.svg'
import eloIcon from 'payment-icons/min/flat/elo.svg'
import amexIcon from 'payment-icons/min/flat/amex.svg'

// Usar com Next.js Image
<Image src={visaIcon} alt="Visa" width={45} height={30} />
```

**Ícones disponíveis:**
- `visa.svg` ✅ (em uso)
- `mastercard.svg` ✅ (em uso)
- `elo.svg` ✅ (em uso)
- `amex.svg` ✅ (em uso)
- `diners.svg`
- `discover.svg`
- `jcb.svg`
- `maestro.svg`
- `paypal.svg`
- `unionpay.svg`
- `hipercard.svg`
- `verve.svg`

**Vantagens:**
- ✅ SVGs otimizados e leves
- ✅ Sem necessidade de hospedar arquivos
- ✅ Importação direta via import
- ✅ Suporte TypeScript

---

## 📐 Especificações Técnicas

### Formato Recomendado
- **PNG com fundo transparente** ← Melhor opção
- Ou SVG (ideal para logos e ícones)
- JPG apenas para fotos (não recomendado para logos)

### Tamanhos Recomendados

#### Logos de Pagamento
```
Logo Mercado Pago: 120x40px (ou 240x80px @2x)
Bandeiras de cartão: 50x32px cada
Selos de segurança: 80x80px
```

#### Resolução
- **@1x (normal)**: Tamanho base
- **@2x (retina)**: Dobro do tamanho para telas de alta resolução
- Use `srcset` ou imagens vetoriais (SVG) quando possível

---

## 🎨 Imagens Sugeridas

### 1. Logo Mercado Pago Oficial

**Baixar de:**
https://www.mercadopago.com.br/developers/pt/docs/resources/brand-guide

**Opções:**
- `mercadopago-logo.png` (horizontal)
- `mercadopago-icon.png` (apenas símbolo)

**Tamanho sugerido:** 120x40px
**Formato:** PNG transparente ou SVG
**Onde colocar:** Rodapé do modal

---

### 2. Bandeiras de Cartão

**✅ Implementado com `payment-icons` (npm)**

As bandeiras de cartão estão sendo importadas diretamente da biblioteca `payment-icons`:

```tsx
import visaIcon from 'payment-icons/min/flat/visa.svg'
import mastercardIcon from 'payment-icons/min/flat/mastercard.svg'
import eloIcon from 'payment-icons/min/flat/elo.svg'
import amexIcon from 'payment-icons/min/flat/amex.svg'

<Image src={visaIcon} alt="Visa" width={45} height={30} />
```

**Vantagens:**
- ✅ Sem necessidade de baixar/hospedar arquivos
- ✅ SVGs otimizados e leves
- ✅ Sempre atualizados via npm
- ✅ Importação direta com TypeScript

**Alternativas (se preferir hospedar):**
- **Logos oficiais:**
  - Visa: https://brand.visa.com/
  - Mastercard: https://brand.mastercard.com/
  - Elo: https://www.elo.com.br/
  - Amex: https://www.americanexpress.com/
- **Tamanho:** 50x32px cada
- **Formato:** PNG transparente

---

### 3. Ícones de Segurança

**✅ Implementados com imagens de `public/`:**

```tsx
<Image src="/SSLencryption-logo.png" alt="SSL" width={16} height={16} />
<Image src="/100seguro-logo.png" alt="100% Seguro" width={16} height={16} />
```

**Arquivos atuais:**
- ✅ `public/SSLencryption-logo.png` - Badge SSL
- ✅ `public/100seguro-logo.png` - Badge 100% Seguro

**Alternativas gratuitas (se precisar de outros ícones):**
- https://heroicons.com/ (grátis, open source, SVG)
- https://www.flaticon.com/ (muitas opções gratuitas, PNG/SVG)

---

### 4. Selos de Segurança Opcionais

**Site PCI Compliance:**
https://www.pcisecuritystandards.org/

**Norton Secured:**
https://www.nortonlifelock.com/

**Let's Encrypt SSL:**
https://letsencrypt.org/

**Tamanho:** 80x80px ou 100x100px
**Formato:** PNG transparente

---

## 📁 Estrutura de Pastas Recomendada

```
public/
  mercadopago-logo.png            # ✅ Logo oficial do Mercado Pago
  100seguro-logo.png              # ✅ Selo de segurança
  SSLencryption-logo.png          # ✅ Selo SSL
  bandeiras-logo.png              # Todas as bandeiras juntas (opcional)
  
  # Nota: Bandeiras individuais são importadas via payment-icons (npm)
```

---

## 🎨 Atribuições de Imagens (Flaticon)

As bandeiras de cartão foram obtidas do **Flaticon** e usadas via biblioteca `payment-icons`:

- **Visa**: [Visa icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/visa)
- **Mastercard**: [Mastercard icons created by Picons - Flaticon](https://www.flaticon.com/free-icons/mastercard)
- **American Express**: [American express icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/american-express)

> **Nota**: No projeto, as bandeiras são importadas diretamente da biblioteca `payment-icons` (instalada via npm), que já contém os SVGs otimizados.

---

## 💻 Implementação com Imagens

### Versão com Logo do Mercado Pago

```tsx
{/* Footer com logo MP */}
<div className="mt-4 pt-4 border-t border-gray-100">
  <div className="flex items-center justify-center gap-2 mb-3">
    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <p className="text-xs text-gray-600 font-medium">
      Pagamento 100% seguro
    </p>
  </div>
  
  {/* Logo Mercado Pago */}
  <div className="flex items-center justify-center gap-2 mb-2">
    <span className="text-xs text-gray-500">Processado por</span>
    <Image 
      src="/images/payment/mercadopago-logo.png"
      alt="Mercado Pago"
      width={80}
      height={27}
      className="opacity-80"
    />
  </div>
  
  <p className="text-center text-xs text-gray-400">
    Seus dados são criptografados • SSL certificado
  </p>
</div>
```

### Versão com Bandeiras de Cartão (Imagens)

```tsx
{/* Bandeiras com logos reais */}
<div className="mb-4 pb-4 border-b border-gray-100">
  <p className="text-xs text-gray-500 mb-2">Aceitamos:</p>
  <div className="flex items-center gap-2">
    <Image src="/images/payment/visa.png" alt="Visa" width={50} height={32} />
    <Image src="/images/payment/mastercard.png" alt="Mastercard" width={50} height={32} />
    <Image src="/images/payment/elo.png" alt="Elo" width={50} height={32} />
    <Image src="/images/payment/amex.png" alt="American Express" width={50} height={32} />
  </div>
</div>
```

---

## 🎯 Otimização de Imagens

### Ferramentas Online (gratuitas)

1. **TinyPNG** — https://tinypng.com/
   - Comprime PNG sem perda de qualidade
   - Reduz até 70% do tamanho

2. **Squoosh** — https://squoosh.app/
   - Google Web.dev
   - Vários formatos (PNG, WebP, AVIF)

3. **SVGOMG** — https://jakearchibald.github.io/svgomg/
   - Otimiza SVGs
   - Remove metadados desnecessários

### Comandos CLI (se preferir)

```bash
# Instalar sharp (otimizador de imagens)
npm install sharp-cli -g

# Redimensionar
sharp -i input.png -o output.png resize 120 40

# Converter para WebP (mais leve)
sharp -i input.png -o output.webp
```

---

## ✅ Checklist de Implementação

### Básico (já implementado via SVG)
- [x] Ícone de cadeado (segurança)
- [x] Badge SSL
- [x] Badge criptografia
- [x] Texto "Pagamento seguro"
- [x] Bandeiras de cartão (texto)

### Melhorias com Imagens
- [ ] Logo Mercado Pago PNG/SVG
- [ ] Bandeiras de cartão (logos reais)
- [ ] Selo PCI Compliance (opcional)
- [ ] Selo SSL (opcional)

---

## 🎨 Cores Oficiais do Mercado Pago

Para manter consistência visual:

```css
/* Azul Mercado Pago */
--mp-blue: #009EE3;

/* Azul escuro */
--mp-dark-blue: #0A3A6B;

/* Cinza */
--mp-gray: #666666;
```

Já está implementado no código:
```tsx
<span className="font-semibold text-[#009EE3]">Mercado Pago</span>
```

---

## 🚀 Recomendação Final

### Opção Mínima (sem baixar imagens)
✅ **Já está implementado** — SVG inline + texto
- Rápido de carregar
- Não precisa gerenciar arquivos
- Responsivo por padrão

### Opção Premium (com logos)
📥 Baixar apenas:
1. **Logo Mercado Pago** (PNG 120x40px transparente)
2. **4 bandeiras de cartão** (PNG 50x32px cada)

Colocar em: `public/images/payment/`

---

## 📊 Comparação de Formatos

| Formato | Transparência | Tamanho | Qualidade | Recomendado para |
|---------|---------------|---------|-----------|------------------|
| **PNG** | ✅ Sim | Médio | Excelente | Logos, ícones |
| **SVG** | ✅ Sim | Muito pequeno | Perfeito | Logos simples, ícones |
| **WebP** | ✅ Sim | Pequeno | Excelente | Alternativa moderna ao PNG |
| **JPG** | ❌ Não | Pequeno | Boa | Fotos (não usar para logos) |

**Veredito:** Use **PNG transparente** ou **SVG** para logos e badges.

---

## 🔗 Links Úteis

- Brand Assets Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs/resources/brand-guide
- Heroicons (ícones SVG grátis): https://heroicons.com/
- TinyPNG (compressor): https://tinypng.com/
- Squoosh (otimizador): https://squoosh.app/

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do ChefBox",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <Image
            src="/icone-mestre-1024x1024.png"
            alt={APP_NAME}
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-contain"
          />
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Termos de Uso</h1>
          <p className="mb-8 text-sm text-slate-500">Última atualização: 14 de abril de 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">1. Aceitação dos Termos</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Ao acessar e usar o {APP_NAME}, você concorda com estes Termos de Uso e com nossa Política de Privacidade.
                Se você não concordar com qualquer parte destes termos, não utilize nosso serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">2. Descrição do Serviço</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                O {APP_NAME} é uma plataforma digital que oferece sugestões de receitas culinárias baseadas em ingredientes
                fornecidos pelo usuário, planejamento de refeições, cálculo de macronutrientes e outras funcionalidades
                relacionadas à culinária e nutrição.
              </p>
              <p className="mb-4 leading-relaxed text-slate-700">
                O serviço utiliza inteligência artificial para gerar recomendações personalizadas. As sugestões fornecidas
                têm caráter informativo e não substituem orientação profissional de nutricionistas ou médicos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">3. Cadastro e Conta de Usuário</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Para utilizar certas funcionalidades do {APP_NAME}, você precisa criar uma conta fornecendo um endereço de
                e-mail válido. Você é responsável por:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades realizadas em sua conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">4. Planos e Pagamentos</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                O {APP_NAME} oferece planos gratuitos e premium:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Plano Gratuito:</strong> Acesso limitado a funcionalidades básicas com limite diário de uso</li>
                <li><strong>Plano Premium:</strong> Acesso ilimitado a todas as funcionalidades mediante pagamento de assinatura</li>
              </ul>
              <p className="mb-4 leading-relaxed text-slate-700">
                Os valores e condições de pagamento estão descritos na plataforma. Reservamo-nos o direito de modificar os
                preços mediante aviso prévio de 30 dias. Cancelamentos podem ser realizados a qualquer momento através da
                plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">5. Uso Aceitável</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Você concorda em NÃO:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Usar o serviço para fins ilegais ou não autorizados</li>
                <li>Tentar obter acesso não autorizado aos sistemas ou redes do {APP_NAME}</li>
                <li>Distribuir vírus, malware ou qualquer código malicioso</li>
                <li>Fazer engenharia reversa, descompilar ou desmontar o serviço</li>
                <li>Usar bots, scrapers ou sistemas automatizados sem autorização</li>
                <li>Revender ou redistribuir o serviço sem autorização expressa</li>
                <li>Violar direitos de propriedade intelectual</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">6. Propriedade Intelectual</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Todo o conteúdo do {APP_NAME}, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens,
                código-fonte e software, é de propriedade exclusiva do {APP_NAME} ou de seus licenciadores e está protegido
                pelas leis brasileiras e internacionais de direitos autorais e propriedade intelectual.
              </p>
              <p className="mb-4 leading-relaxed text-slate-700">
                As receitas e planos gerados são fornecidos para uso pessoal. Você pode salvá-los e compartilhá-los, mas
                não pode republicá-los comercialmente sem autorização.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">7. Limitação de Responsabilidade</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                O {APP_NAME} fornece sugestões de receitas e informações nutricionais com fins educacionais e informativos.
                <strong> NÃO somos responsáveis por:</strong>
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Reações alérgicas ou intolerâncias alimentares</li>
                <li>Resultados de saúde ou nutricionais</li>
                <li>Qualidade ou segurança dos alimentos preparados</li>
                <li>Danos indiretos, acidentais ou consequenciais</li>
                <li>Perda de dados ou interrupções no serviço</li>
              </ul>
              <p className="mb-4 leading-relaxed text-slate-700">
                Consulte sempre um profissional de saúde antes de fazer mudanças significativas em sua dieta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">8. Isenção de Garantias</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                O serviço é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou
                implícitas. Não garantimos que o serviço será ininterrupto, seguro ou livre de erros.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">9. Modificações do Serviço</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer parte do {APP_NAME} a qualquer
                momento, com ou sem aviso prévio. Não seremos responsáveis por qualquer modificação, suspensão ou
                descontinuação do serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">10. Rescisão</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, caso você viole estes Termos de Uso.
                Você pode encerrar sua conta a qualquer momento através das configurações da plataforma ou entrando em contato
                conosco.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">11. Lei Aplicável e Foro</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa decorrente
                destes termos será submetida ao foro da comarca de seu domicílio, conforme estabelecido pelo Código de Defesa
                do Consumidor (Lei 8.078/90).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">12. Disposições Gerais</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Estes Termos constituem o acordo completo entre você e o {APP_NAME}. Se qualquer disposição for considerada
                inválida, as demais permanecem em pleno vigor. A falha em exercer qualquer direito não constitui renúncia.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">13. Alterações nos Termos</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Podemos atualizar estes Termos de Uso periodicamente. Notificaremos você sobre mudanças significativas por
                e-mail ou através da plataforma. O uso continuado do serviço após as alterações constitui aceitação dos novos
                termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">14. Contato</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Para dúvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <ul className="ml-6 list-none space-y-2 text-slate-700">
                <li><strong>E-mail:</strong> contato@chefbox.com.br</li>
                <li><strong>Website:</strong> www.chefbox.com.br</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

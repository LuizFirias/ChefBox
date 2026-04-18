import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade do ChefBox",
};

export default function PrivacidadePage() {
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
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Política de Privacidade</h1>
          <p className="mb-8 text-sm text-slate-500">Última atualização: 14 de abril de 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">1. Introdução</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                O {APP_NAME} respeita sua privacidade e está comprometido em proteger seus dados pessoais. Esta Política de
                Privacidade explica como coletamos, usamos, armazenamos e compartilhamos suas informações em conformidade com
                a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) e demais legislações aplicáveis.
              </p>
              <p className="mb-4 leading-relaxed text-slate-700">
                Ao usar nosso serviço, você concorda com as práticas descritas nesta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">2. Dados Coletados</h2>
              
              <h3 className="mb-3 text-lg font-medium text-slate-800">2.1 Dados Fornecidos por Você</h3>
              <p className="mb-4 leading-relaxed text-slate-700">
                Coletamos as seguintes informações que você fornece diretamente:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Dados de cadastro:</strong> endereço de e-mail, senha (criptografada)</li>
                <li><strong>Dados de perfil:</strong> nome (opcional), preferências alimentares, restrições dietéticas, alergias</li>
                <li><strong>Dados de uso:</strong> ingredientes informados, receitas salvas, planos de refeições, listas de compras</li>
                <li><strong>Dados de pagamento:</strong> informações de cobrança processadas por terceiros (não armazenamos dados de cartão)</li>
              </ul>

              <h3 className="mb-3 text-lg font-medium text-slate-800">2.2 Dados Coletados Automaticamente</h3>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional, dispositivo</li>
                <li><strong>Dados de navegação:</strong> páginas visitadas, tempo de permanência, cliques, interações</li>
                <li><strong>Cookies e tecnologias similares:</strong> conforme descrito na seção 7</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">3. Finalidade do Tratamento de Dados</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Utilizamos seus dados pessoais para as seguintes finalidades, com base legal na LGPD:
              </p>
              
              <h3 className="mb-3 text-lg font-medium text-slate-800">3.1 Execução do Contrato (Art. 7º, V da LGPD)</h3>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Criar e gerenciar sua conta</li>
                <li>Fornecer as funcionalidades do serviço</li>
                <li>Gerar receitas e planos de refeições personalizados</li>
                <li>Salvar suas preferências e histórico</li>
                <li>Processar pagamentos de assinaturas</li>
              </ul>

              <h3 className="mb-3 text-lg font-medium text-slate-800">3.2 Legítimo Interesse (Art. 7º, IX da LGPD)</h3>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Melhorar e personalizar sua experiência</li>
                <li>Desenvolver novos recursos e funcionalidades</li>
                <li>Realizar análises estatísticas e de desempenho</li>
                <li>Prevenir fraudes e garantir segurança</li>
                <li>Enviar comunicações sobre o serviço</li>
              </ul>

              <h3 className="mb-3 text-lg font-medium text-slate-800">3.3 Consentimento (Art. 7º, I da LGPD)</h3>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Enviar newsletters e comunicações promocionais (você pode cancelar a qualquer momento)</li>
                <li>Compartilhar dados para fins de marketing (com sua autorização expressa)</li>
              </ul>

              <h3 className="mb-3 text-lg font-medium text-slate-800">3.4 Cumprimento de Obrigação Legal (Art. 7º, II da LGPD)</h3>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Cumprir requisitos legais e regulatórios</li>
                <li>Responder a solicitações de autoridades</li>
                <li>Manter registros fiscais e contábeis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">4. Compartilhamento de Dados</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Seus dados pessoais podem ser compartilhados nas seguintes situações:
              </p>

              <h3 className="mb-3 text-lg font-medium text-slate-800">4.1 Prestadores de Serviços</h3>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Infraestrutura e hospedagem:</strong> Vercel, Supabase (servidores seguros)</li>
                <li><strong>Inteligência Artificial:</strong> OpenAI (para geração de receitas e planos)</li>
                <li><strong>Processamento de pagamentos:</strong> gateways de pagamento certificados</li>
                <li><strong>Análise e monitoramento:</strong> ferramentas de analytics (dados anonimizados)</li>
              </ul>
              <p className="mb-4 leading-relaxed text-slate-700">
                Todos os prestadores são contratualmente obrigados a proteger seus dados e usá-los apenas para os fins
                especificados.
              </p>

              <h3 className="mb-3 text-lg font-medium text-slate-800">4.2 Transferência Internacional</h3>
              <p className="mb-4 leading-relaxed text-slate-700">
                Alguns de nossos prestadores de serviços (como OpenAI e Vercel) podem estar localizados fora do Brasil.
                Garantimos que essas transferências ocorrem com salvaguardas adequadas, como cláusulas contratuais padrão
                e certificações de segurança.
              </p>

              <h3 className="mb-3 text-lg font-medium text-slate-800">4.3 Requisições Legais</h3>
              <p className="mb-4 leading-relaxed text-slate-700">
                Podemos divulgar seus dados se exigido por lei, ordem judicial ou para proteger nossos direitos legais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">5. Armazenamento e Segurança</h2>
              
              <h3 className="mb-3 text-lg font-medium text-slate-800">5.1 Período de Retenção</h3>
              <p className="mb-4 leading-relaxed text-slate-700">
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Dados de conta ativa:</strong> enquanto sua conta estiver ativa</li>
                <li><strong>Dados financeiros:</strong> pelo prazo legal de 5 anos (requisito fiscal)</li>
                <li><strong>Dados de marketing:</strong> até você revogar o consentimento</li>
                <li><strong>Logs de acesso:</strong> 6 meses (requisito de segurança)</li>
              </ul>
              <p className="mb-4 leading-relaxed text-slate-700">
                Após a exclusão da conta, seus dados são anonimizados ou eliminados em até 30 dias, exceto quando a retenção
                for exigida por lei.
              </p>

              <h3 className="mb-3 text-lg font-medium text-slate-800">5.2 Medidas de Segurança</h3>
              <p className="mb-4 leading-relaxed text-slate-700">
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li>Criptografia de dados em trânsito (HTTPS/TLS) e em repouso</li>
                <li>Autenticação segura e hashing de senhas</li>
                <li>Controles de acesso baseados em função (RBAC)</li>
                <li>Monitoramento e detecção de atividades suspeitas</li>
                <li>Backups regulares e planos de recuperação de desastres</li>
                <li>Auditorias de segurança periódicas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">6. Seus Direitos (LGPD)</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Conforme a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Confirmação e acesso:</strong> confirmar se tratamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável</li>
                <li><strong>Eliminação:</strong> excluir dados tratados com base no consentimento</li>
                <li><strong>Informação:</strong> sobre com quem compartilhamos seus dados</li>
                <li><strong>Revogação do consentimento:</strong> retirar consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> opor-se ao tratamento em determinadas situações</li>
              </ul>
              <p className="mb-4 leading-relaxed text-slate-700">
                Para exercer seus direitos, entre em contato através de: <strong>privacidade@chefbox.com.br</strong>
              </p>
              <p className="mb-4 leading-relaxed text-slate-700">
                Responderemos sua solicitação em até 15 dias. Em alguns casos, podemos solicitar informações adicionais para
                confirmar sua identidade.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">7. Cookies e Tecnologias Similares</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                <li><strong>Cookies essenciais:</strong> necessários para o funcionamento do serviço (autenticação, segurança)</li>
                <li><strong>Cookies de desempenho:</strong> coletam dados sobre como você usa o serviço</li>
                <li><strong>Cookies de funcionalidade:</strong> salvam suas preferências e configurações</li>
                <li><strong>Cookies de marketing:</strong> rastreiam interesses para publicidade direcionada (apenas com consentimento)</li>
              </ul>
              <p className="mb-4 leading-relaxed text-slate-700">
                Você pode gerenciar cookies nas configurações do seu navegador, mas isso pode afetar algumas funcionalidades
                do serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">8. Menores de Idade</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                O {APP_NAME} não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores sem o
                consentimento dos pais ou responsáveis legais. Se você acredita que coletamos dados de um menor inadvertidamente,
                entre em contato imediatamente para que possamos excluí-los.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">9. Alterações nesta Política</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou
                requisitos legais. Notificaremos você sobre alterações significativas por e-mail ou através de aviso destacado
                na plataforma.
              </p>
              <p className="mb-4 leading-relaxed text-slate-700">
                A data da última atualização está indicada no topo desta política. Recomendamos que você revise esta política
                periodicamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">10. Encarregado de Dados (DPO)</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Nomeamos um Encarregado de Proteção de Dados (DPO) para atuar como canal de comunicação com titulares de dados
                e a Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
              <ul className="ml-6 list-none space-y-2 text-slate-700">
                <li><strong>Contato do DPO:</strong> dpo@chefbox.com.br</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">11. Contato</h2>
              <p className="mb-4 leading-relaxed text-slate-700">
                Para dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento dos seus
                dados pessoais:
              </p>
              <ul className="ml-6 list-none space-y-2 text-slate-700">
                <li><strong>E-mail:</strong> privacidade@chefbox.com.br</li>
                <li><strong>Website:</strong> www.chefbox.com.br</li>
              </ul>
              <p className="mt-4 leading-relaxed text-slate-700">
                Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) se considerar que
                seus direitos não foram adequadamente atendidos.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

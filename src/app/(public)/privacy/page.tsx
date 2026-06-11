import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Perseo coleta, usa e protege seus dados pessoais.",
};

const UPDATED_AT = "11 de junho de 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-24 pt-28">
      <p className="microlabel">Legal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Política de Privacidade</h1>
      <p className="mt-2 text-xs text-ink-faint">Última atualização: {UPDATED_AT}</p>

      <div className="prose-perseo mt-10 flex flex-col gap-8 text-sm leading-relaxed text-ink-mute">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">1. Quem somos</h2>
          <p>
            A Perseo (&ldquo;nós&rdquo;) é uma agência de marketing de performance para marcas D2C e
            e-commerce. Esta política descreve como tratamos dados pessoais coletados pelo site
            perseoagency.net e pela plataforma Perseo Web, em conformidade com a Lei Geral de
            Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">2. Dados que coletamos</h2>
          <p className="mb-2">Coletamos apenas o necessário para operar o serviço:</p>
          <ul className="ml-5 flex list-disc flex-col gap-1.5">
            <li>
              <strong className="text-ink">Formulário de contato:</strong> nome, e-mail, WhatsApp, nome da
              marca, faixa de faturamento e Instagram (opcional).
            </li>
            <li>
              <strong className="text-ink">Conta na plataforma:</strong> e-mail, nome e credenciais de
              autenticação (gerenciadas pelo provedor Supabase).
            </li>
            <li>
              <strong className="text-ink">Operação de marketing:</strong> dados de leads e agendamentos dos
              clientes que contratam a Perseo, métricas de campanhas e integrações autorizadas
              (Meta, WhatsApp, Google Calendar).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">3. Para que usamos</h2>
          <ul className="ml-5 flex list-disc flex-col gap-1.5">
            <li>Responder solicitações de análise e propostas comerciais;</li>
            <li>Prestar os serviços contratados (gestão de tráfego, criativos, atendimento a leads);</li>
            <li>Gerar relatórios de performance para o próprio cliente titular dos dados;</li>
            <li>Cumprir obrigações legais e contratuais.</li>
          </ul>
          <p className="mt-2">Não vendemos dados pessoais a terceiros.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">4. Compartilhamento</h2>
          <p>
            Compartilhamos dados apenas com operadores essenciais à prestação do serviço —
            infraestrutura de banco de dados e autenticação (Supabase), hospedagem (Railway) e
            plataformas integradas por solicitação do cliente (Meta, Google). Cada operador acessa
            somente o necessário à sua função.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">5. Segurança e retenção</h2>
          <p>
            Os dados trafegam criptografados (TLS) e são armazenados com controle de acesso por
            papel e isolamento por cliente (row-level security). Mantemos os dados enquanto durar a
            relação contratual ou até solicitação de exclusão, ressalvadas obrigações legais de
            guarda.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">6. Seus direitos (LGPD)</h2>
          <p>
            Você pode solicitar a qualquer momento: confirmação de tratamento, acesso, correção,
            anonimização, portabilidade ou exclusão dos seus dados, além de revogar consentimentos.
            Para exercer seus direitos, escreva para{" "}
            <a className="text-neon underline-offset-4 hover:underline" href="mailto:privacidade@perseoagency.net">
              privacidade@perseoagency.net
            </a>
            . Respondemos em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">7. Cookies</h2>
          <p>
            Usamos apenas cookies estritamente necessários à autenticação e à sessão da plataforma.
            Não usamos cookies de rastreamento de terceiros no site público.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink">8. Alterações</h2>
          <p>
            Esta política pode ser atualizada para refletir mudanças no serviço ou na legislação. A
            versão vigente estará sempre nesta página, com a data de atualização no topo.
          </p>
        </section>
      </div>
    </article>
  );
}

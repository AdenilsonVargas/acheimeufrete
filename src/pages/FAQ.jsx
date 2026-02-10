import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
// Header é globalizado em App.jsx
import Footer from '@/components/Footer';
import { useScrollRevealBatch } from '@/hooks/useScrollReveal';

export default function FAQ() {
  useScrollRevealBatch();
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      category: 'Geral',
      questions: [
        {
            q: 'O que é ACHEI MEU FRETE?',
            a: 'ACHEI MEU FRETE é uma plataforma digital que conecta embarcadores e transportadores, permitindo que encontrem soluções de frete com segurança, transparência e eficiência.',
        },
        {
          q: 'Como funciona o cadastro?',
          a: 'O cadastro é simples! Escolha se você é embarcador ou transportador, preencha seus dados básicos, documentos e pronto. Após análise, sua conta será ativada.',
        },
        {
          q: 'Há alguma taxa para usar a plataforma?',
          a: 'Embarcadores não pagam taxas para usar a plataforma. Transportadores pagam apenas uma comissão pequena sobre os fretes realizados (5%).',
        },
      ],
    },
    {
      category: 'Para Embarcadores',
      questions: [
        {
          q: 'Como solicitar uma cotação?',
          a: 'Acesse sua conta, clique em "Nova Cotação", preencha os dados da carga (produtos, peso, volumes, origem e destino) e envie. Transportadores qualificados receberão e responderão sua solicitação.',
        },
        {
          q: 'Quais são os tipos de frete oferecidos?',
          a: 'Oferecemos dois tipos: CIF (frete pago pelo embarcador) e FOB (frete pago pelo transportador).',
        },
        {
          q: 'Como é garantida a segurança da minha carga?',
          a: 'Todos os transportadores são verificados, possuem documentação válida e seguro de carga. Você terá rastreamento em tempo real durante toda a entrega.',
        },
      ],
    },
    {
      category: 'Para Transportadores',
      questions: [
        {
          q: 'Como encontro fretes disponíveis?',
          a: 'Na aba "Cotações Disponíveis" você verá todas as solicitações que correspondem ao seu perfil, região atendida e NCMs cadastrados.',
        },
        {
          q: 'Como responderei uma cotação?',
          a: 'Após visualizar a cotação, clique em "Responder", insira seu valor, prazo de entrega e confirme. O embarcador será notificado automaticamente.',
        },
        {
          q: 'Quais documentos são necessários?',
          a: 'CNH, CNPJ/CPF, comprovante de endereço, documentação do veículo (CRLV) e certificado digital (para PJ) são obrigatórios.',
        },
        {
          q: 'Posso emitir CT-e pela plataforma?',
          a: 'Sim! Para transportadores PJ é obrigatório emitir CT-e. Autônomos devem emitir CIOT. Ambos podem ser feitos direto na plataforma.',
        },
      ],
    },
    {
      category: 'Pagamentos e Valores',
      questions: [
        {
          q: 'Como é feito o pagamento do frete?',
          a: 'Para CIF, o embarcador paga via cartão, PIX ou transferência bancária. Para FOB, o transportador recebe diretamente conforme acordado.',
        },
        {
          q: 'Quando recebo o pagamento como transportador?',
          a: 'Após a entrega ser confirmada e o embarcador aprovar, o pagamento é processado em até 2 dias úteis.',
        },
        {
          q: 'O que é o crédito pré-pago?',
          a: 'Embarcadores podem comprar créditos pré-pagos para usar em futuras cotações, com pequenos descontos.',
        },
      ],
    },
    {
      category: 'Suporte e Problemas',
      questions: [
        {
          q: 'E se houver atraso na entrega?',
          a: 'Atrasos devem ser comunicados imediatamente. A plataforma oferece ferramenta de negociação e, se necessário, suporte administrativo.',
        },
        {
          q: 'Como fazer uma reclamação?',
          a: 'Entre em contato com nosso suporte via chat, email ou telefone. Faremos mediação para resolver qualquer conflito.',
        },
        {
          q: 'Qual é o horário do suporte?',
          a: 'Nosso suporte está disponível 24/7 para emergências. Atendimento administrativo de seg-sex das 08h às 18h.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent text-slate-900 dark:text-white relative z-10">
      {/* Header globalizado em App.jsx */}

      {/* Hero */}
      <section className="container-responsive py-responsive text-center reveal">
        <h1 className="text-responsive-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Perguntas Frequentes</h1>
          <p className="text-responsive-base text-slate-700 dark:text-slate-200 max-w-2xl mx-auto px-4 sm:px-0">
            Encontre respostas para as dúvidas mais comuns sobre a plataforma ACHEI MEU FRETE.
        </p>
      </section>

      {/* FAQs */}
      <section className="container-responsive py-responsive reveal">
        <div className="max-w-4xl mx-auto">
          {faqs.map((category, categoryIdx) => (
            <div key={categoryIdx} className="mb-10 sm:mb-12 reveal">
              <h2 className="text-responsive-lg font-bold text-orange-600 mb-4 sm:mb-6">{category.category}</h2>

              <div className="space-y-3 sm:space-y-4">
                {category.questions.map((item, idx) => (
                  <div
                    key={idx}
                    className="card cursor-pointer hover:border-orange-600 transition hover:shadow-xl hover:-translate-y-1 reveal"
                    onClick={() =>
                      setActiveIndex(
                        activeIndex === `${categoryIdx}-${idx}` ? null : `${categoryIdx}-${idx}`
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-responsive-base font-semibold text-slate-900 dark:text-white flex-1 leading-snug">{item.q}</h3>
                      {activeIndex === `${categoryIdx}-${idx}` ? (
                        <ChevronUp className="w-5 h-5 text-orange-600 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2 sm:ml-4" />
                      )}
                    </div>

                    {activeIndex === `${categoryIdx}-${idx}` && (
                      <p className="text-responsive-sm text-slate-700 dark:text-slate-300 mt-3 sm:mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 sm:pt-4 leading-relaxed">{item.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-orange-600 to-blue-900 py-responsive reveal">
        <div className="container-responsive text-center">
          <h2 className="text-responsive-lg font-bold text-white mb-4">Não encontrou sua resposta?</h2>
          <p className="text-white/80 text-responsive-base mb-6 sm:mb-8 px-4 sm:px-0">
            Entre em contato com nosso time de suporte. Estamos aqui para ajudar!
          </p>
          <a href="/contato" className="inline-block bg-white text-orange-600 font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg hover:bg-slate-100 transition shadow-lg hover:-translate-y-0.5">
            Ir para Contato
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

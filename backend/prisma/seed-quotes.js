/**
 * Script para popular frases motivacionais no banco de dados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const quotes = [
  // 30 Frases sobre investimento, crescimento e empreendedorismo
  {
    texto: "Investir em si mesmo é o melhor investimento que você pode fazer.",
    autor: "Warren Buffett",
    categoria: "investimento"
  },
  {
    texto: "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta.",
    autor: "Winston Churchill",
    categoria: "crescimento"
  },
  {
    texto: "Não se trata de dinheiro, trata-se de construir um negócio que funcione.",
    autor: "Richard Branson",
    categoria: "empreendedorismo"
  },
  {
    texto: "O maior risco é não arriscar. O maior erro é não aprender com os erros.",
    autor: "Jack Ma",
    categoria: "crescimento"
  },
  {
    texto: "Você não pode usar a velha forma de pensar e esperar novos resultados.",
    autor: "Albert Einstein",
    categoria: "crescimento"
  },
  {
    texto: "A única forma de fazer um grande trabalho é amar o que você faz.",
    autor: "Steve Jobs",
    categoria: "empreendedorismo"
  },
  {
    texto: "Investir no conhecimento sempre oferece os melhores retornos.",
    autor: "Benjamin Franklin",
    categoria: "investimento"
  },
  {
    texto: "Quanto mais você aprende, mais você ganha. Quanto mais você ganha, mais você cresce.",
    autor: "Autor Desconhecido",
    categoria: "crescimento"
  },
  {
    texto: "O caminho para a liberdade financeira começa com um único passo: a decisão de começar.",
    autor: "Robert Kiyosaki",
    categoria: "investimento"
  },
  {
    texto: "Não espere pela oportunidade perfeita. Crie-a.",
    autor: "George Bernard Shaw",
    categoria: "empreendedorismo"
  },
  {
    texto: "Seu limite é apenas sua imaginação. Seja criativo.",
    autor: "Autor Desconhecido",
    categoria: "crescimento"
  },
  {
    texto: "Dinheiro é uma ferramenta. Use-a para construir, não para destruir.",
    autor: "Robert Kiyosaki",
    categoria: "investimento"
  },
  {
    texto: "Quem pensa pequeno, colhe pequeno. Pense grande e colha grande.",
    autor: "Jim Rohn",
    categoria: "crescimento"
  },
  {
    texto: "Empresários de sucesso sabem que o fracasso é apenas um passo para o sucesso.",
    autor: "Oprah Winfrey",
    categoria: "empreendedorismo"
  },
  {
    texto: "Seu tempo é limitado. Não gaste investindo em algo que não agregará valor.",
    autor: "Steve Jobs",
    categoria: "investimento"
  },
  {
    texto: "O negócio é simples se você o torna simples.",
    autor: "Arianna Huffington",
    categoria: "empreendedorismo"
  },
  {
    texto: "Crescer significa sair de sua zona de conforto.",
    autor: "Autor Desconhecido",
    categoria: "crescimento"
  },
  {
    texto: "Investimento é o processo de colocar seu dinheiro para trabalhar por você.",
    autor: "Tony Robbins",
    categoria: "investimento"
  },
  {
    texto: "O mercado recompensa ação. Aquele que age vence aquele que apenas pensa.",
    autor: "Elon Musk",
    categoria: "empreendedorismo"
  },
  {
    texto: "Diversifique seus investimentos e você diversificará suas oportunidades.",
    autor: "Peter Lynch",
    categoria: "investimento"
  },
  {
    texto: "Sucesso é 10% inspiração e 90% transpiração.",
    autor: "Thomas Edison",
    categoria: "crescimento"
  },
  {
    texto: "Se você não fracassar, você não está inovando o suficiente.",
    autor: "Jeff Bezos",
    categoria: "empreendedorismo"
  },
  {
    texto: "Riqueza é a capacidade de produzir valor.",
    autor: "Robert Kiyosaki",
    categoria: "investimento"
  },
  {
    texto: "Comece pequeno, pense grande, cresça continuamente.",
    autor: "Brian Tracy",
    categoria: "crescimento"
  },
  {
    texto: "O melhor momento para semear uma árvore foi ontem. O segundo melhor é hoje.",
    autor: "Provérbio Chinês",
    categoria: "investimento"
  },
  {
    texto: "Você é o reflexo das cinco pessoas com quem mais se relaciona.",
    autor: "Jim Rohn",
    categoria: "crescimento"
  },
  {
    texto: "Não busque segurança, busque oportunidade.",
    autor: "Elon Musk",
    categoria: "empreendedorismo"
  },
  {
    texto: "A educação é o melhor investimento do mundo.",
    autor: "Bill Gates",
    categoria: "investimento"
  },
  {
    texto: "Todo grande empreendedor começou do zero.",
    autor: "Autor Desconhecido",
    categoria: "empreendedorismo"
  },
  {
    texto: "Crescimento vem do desconforto. Conforto vem da morte.",
    autor: "Grant Cardone",
    categoria: "crescimento"
  },

  // 20 Frases de Napoleon Hill
  {
    texto: "Tudo que a mente do homem pode imaginar e acreditar, ele pode alcançar.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "O sucesso não é final, o fracasso não é fatal.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Seus limitações aparecem apenas em sua mente.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "A verdadeira riqueza está no controle de sua mente.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Defina seu objetivo principal definitivo e crie um plano para alcançá-lo.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Você deve acreditar que já conquistou antes de poder ganhar.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "O poder do pensamento é o poder maior que conhecemos.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Nunca deixe ninguém roubar seus sonhos.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "O insucesso é apenas uma oportunidade para começar de novo com mais inteligência.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Você é dono de suas circunstâncias, pois as circunstâncias são fruto de suas ações.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "A fé é o antídoto para o medo.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Seu mente é seu aliada mais poderosa ou sua inimiga mais letal.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Persistência é a qualidade que separa os vencedores dos perdedores.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Nenhuma pessoa é um fracasso, a menos que ele acredite que é.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "O segredo do sucesso encontra-se em seus hábitos diários.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Aquilo que a mente consegue conceber e acreditar, ela consegue alcançar.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Grande oportunidade geralmente vem disfarçada de trabalho duro.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "O homem que muda sua opinião sobre si mesmo, muda o mundo.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "Você não pode pensar seus próprios pensamentos negativos enquanto você está em ação.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  },
  {
    texto: "O sucesso é atraído para você quando você o busca com propósito definido.",
    autor: "Napoleon Hill",
    categoria: "napoleonhill"
  }
];

async function seedQuotes() {
  try {
    console.log('🌱 Iniciando seed de frases motivacionais...\n');

    // Limpar quotes existentes
    await prisma.quote.deleteMany({});
    console.log('✅ Frases antigas removidas');

    // Inserir novas quotes
    const inserted = await prisma.quote.createMany({
      data: quotes
    });

    console.log(`✅ ${inserted.count} frases inseridas com sucesso!\n`);

    // Mostrar resumo por categoria
    const byCategory = await prisma.quote.groupBy({
      by: ['categoria'],
      _count: {
        id: true
      }
    });

    console.log('📊 Resumo por categoria:');
    byCategory.forEach(cat => {
      console.log(`   ${cat.categoria}: ${cat._count.id} frases`);
    });

    console.log('\n✨ Seed de frases concluído!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  }
}

seedQuotes();

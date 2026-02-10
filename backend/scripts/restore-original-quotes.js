/**
 * Script para restaurar as frases motivacionais originais (50 frases)
 * Incluindo as frases de Napoleon Hill que já existiam
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const frasesOriginais = [
  // Napoleon Hill - Frases específicas dele
  {
    texto: 'O que a mente pode conceber e acreditar, pode alcançar.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Não espere. Nunca será a hora certa.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Sua mente é um imã poderoso. Se você pensa em coisas que deseja, você as atrairá.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Você é o único limite que existe para suas conquistas.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'O sucesso vem daqueles que são conscientes do sucesso.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Toda adversidade carrega consigo a semente de uma oportunidade equivalente ou maior.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'A força e o crescimento vêm apenas através do esforço e luta contínuos.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Os pensamentos são coisas. E pensamentos poderosos podem se tornar realidade.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Se você não consegue fazer grandes coisas, faça pequenas coisas de uma grande maneira.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  {
    texto: 'Um objetivo é um sonho com um prazo.',
    autor: 'Napoleon Hill',
    categoria: 'napoleonhill'
  },
  
  // Crescimento Pessoal
  {
    texto: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
    autor: 'Robert Collier',
    categoria: 'crescimento'
  },
  {
    texto: 'O que você pensa, você se torna. O que você sente, você atrai. O que você imagina, você cria.',
    autor: 'Buddha',
    categoria: 'crescimento'
  },
  {
    texto: 'Todo progresso acontece fora da zona de conforto.',
    autor: 'Michael John Bobak',
    categoria: 'crescimento'
  },
  {
    texto: 'A força não vem da capacidade física. Vem de uma vontade indomável.',
    autor: 'Mahatma Gandhi',
    categoria: 'crescimento'
  },
  {
    texto: 'Não conte os dias, faça os dias contarem.',
    autor: 'Muhammad Ali',
    categoria: 'crescimento'
  },
  {
    texto: 'A persistência é o caminho do êxito.',
    autor: 'Charles Chaplin',
    categoria: 'crescimento'
  },
  {
    texto: 'A imaginação é mais importante que o conhecimento.',
    autor: 'Albert Einstein',
    categoria: 'crescimento'
  },
  {
    texto: 'Se você quer algo que nunca teve, precisa fazer algo que nunca fez.',
    autor: 'Thomas Jefferson',
    categoria: 'crescimento'
  },
  {
    texto: 'Toda realização começa com a decisão de tentar.',
    autor: 'John F. Kennedy',
    categoria: 'crescimento'
  },
  {
    texto: 'Comece onde você está. Use o que você tem. Faça o que você pode.',
    autor: 'Arthur Ashe',
    categoria: 'crescimento'
  },
  {
    texto: 'O único modo de fazer um excelente trabalho é amar o que você faz.',
    autor: 'Steve Jobs',
    categoria: 'crescimento'
  },
  {
    texto: 'Acredite que você pode, e você já está no meio do caminho.',
    autor: 'Theodore Roosevelt',
    categoria: 'crescimento'
  },
  {
    texto: 'Você perde 100% das chances que você não aproveita.',
    autor: 'Wayne Gretzky',
    categoria: 'crescimento'
  },
  {
    texto: 'O futuro pertence àqueles que acreditam na beleza de seus sonhos.',
    autor: 'Eleanor Roosevelt',
    categoria: 'crescimento'
  },
  {
    texto: 'Não tenha medo de desistir do bom para perseguir o ótimo.',
    autor: 'John D. Rockefeller',
    categoria: 'crescimento'
  },
  
  // Empreendedorismo
  {
    texto: 'A única forma de fazer um excelente trabalho é amar o que você faz.',
    autor: 'Steve Jobs',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'O sucesso normalmente vem para quem está ocupado demais para procurar por ele.',
    autor: 'Henry David Thoreau',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'O fracasso é apenas a oportunidade de começar de novo, desta vez de forma mais inteligente.',
    autor: 'Henry Ford',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Empreendedores são aqueles que entendem que há pouca diferença entre obstáculo e oportunidade.',
    autor: 'Victor Kiam',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Você não precisa ser grande para começar, mas precisa começar para ser grande.',
    autor: 'Zig Ziglar',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'O único lugar onde o sucesso vem antes do trabalho é no dicionário.',
    autor: 'Vidal Sassoon',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'O segredo do sucesso é começar.',
    autor: 'Mark Twain',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Você não pode escalar a escada do sucesso com as mãos nos bolsos.',
    autor: 'Arnold Schwarzenegger',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Oportunidades não acontecem, você as cria.',
    autor: 'Chris Grosser',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Não se preocupe com os fracassos, preocupe-se com as chances que você perde ao nem tentar.',
    autor: 'Jack Canfield',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Inovação distingue um líder de um seguidor.',
    autor: 'Steve Jobs',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'O risco vem de não saber o que você está fazendo.',
    autor: 'Warren Buffett',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Sucesso é ir de fracasso em fracasso sem perder o entusiasmo.',
    autor: 'Winston Churchill',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'Um negócio tem que envolver, tem que ser divertido, e tem que exercitar sua criatividade.',
    autor: 'Richard Branson',
    categoria: 'empreendedorismo'
  },
  {
    texto: 'A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor hora é agora.',
    autor: 'Provérbio Chinês',
    categoria: 'empreendedorismo'
  },
  
  // Investimento
  {
    texto: 'O melhor investimento que você pode fazer é em você mesmo.',
    autor: 'Warren Buffett',
    categoria: 'investimento'
  },
  {
    texto: 'Quanto maior o risco, maior a recompensa.',
    autor: 'Jafar',
    categoria: 'investimento'
  },
  {
    texto: 'O investimento em conhecimento sempre paga o melhor juro.',
    autor: 'Benjamin Franklin',
    categoria: 'investimento'
  },
  {
    texto: 'Não coloque todos os ovos na mesma cesta.',
    autor: 'Provérbio',
    categoria: 'investimento'
  },
  {
    texto: 'O tempo é mais valioso que o dinheiro. Você pode conseguir mais dinheiro, mas não pode conseguir mais tempo.',
    autor: 'Jim Rohn',
    categoria: 'investimento'
  },
  {
    texto: 'Investir em si mesmo é a melhor coisa que você pode fazer. Não só melhora sua vida, melhora a vida de todos ao seu redor.',
    autor: 'Robin Sharma',
    categoria: 'investimento'
  },
  {
    texto: 'A regra número um é nunca perder dinheiro. A regra número dois é nunca esquecer a regra número um.',
    autor: 'Warren Buffett',
    categoria: 'investimento'
  },
  {
    texto: 'Preço é o que você paga. Valor é o que você recebe.',
    autor: 'Warren Buffett',
    categoria: 'investimento'
  }
];

async function restoreQuotes() {
  console.log('🔄 Restaurando frases motivacionais originais...\n');

  try {
    // Verificar frases atuais
    const currentCount = await prisma.quote.count();
    console.log(`📊 Total de frases atuais no banco: ${currentCount}\n`);

    // Limpar todas as frases
    const deleted = await prisma.quote.deleteMany({});
    console.log(`🗑️  ${deleted.count} frases removidas\n`);

    // Inserir frases originais
    let count = 0;
    for (const frase of frasesOriginais) {
      await prisma.quote.create({
        data: frase
      });
      count++;
      console.log(`✅ [${count}/${frasesOriginais.length}] ${frase.autor} - ${frase.texto.substring(0, 60)}...`);
    }

    console.log(`\n✨ Restauração concluída! ${count} frases originais restauradas.\n`);

    // Verificar por categoria
    const porCategoria = await prisma.quote.groupBy({
      by: ['categoria'],
      _count: {
        id: true
      }
    });

    console.log('📈 Frases por categoria:');
    porCategoria.forEach(cat => {
      console.log(`   ${cat.categoria}: ${cat._count.id} frases`);
    });

    console.log('\n✅ CONCLUÍDO! As frases originais foram restauradas com sucesso.\n');

  } catch (error) {
    console.error('❌ Erro ao restaurar frases:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreQuotes();

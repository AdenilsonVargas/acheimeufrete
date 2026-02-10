// Mensagens motivacionais para Login e Cadastro
export const loginMessages = [
  {
    texto: "Hoje é o primeiro dia do resto de sua vida. Faça-o contar!",
    autor: "Achei Meu Frete",
    tip: "O sucesso começa com uma decisão. Você está pronto para começar?"
  },
  {
    texto: "A jornada de mil milhas começa com um único passo.",
    autor: "Lao Tzu",
    tip: "Conecte-se à maior rede de logística inteligente do Brasil."
  },
  {
    texto: "Seu sucesso é nossa missão. Vamos crescer juntos.",
    autor: "Achei Meu Frete",
    tip: "Milhares de empresas já confiam em nossa plataforma."
  },
  {
    texto: "Não existe caminho para o sucesso, o sucesso é o caminho.",
    autor: "Steve Jobs",
    tip: "Transforme seus desafios logísticos em oportunidades."
  },
  {
    texto: "A melhor maneira de prever o futuro é criá-lo.",
    autor: "Peter Drucker",
    tip: "Automatize, otimize e escale seu negócio com inteligência."
  },
  {
    texto: "Quando você tem um objetivo claro, o universo conspira a seu favor.",
    autor: "Paulo Coelho",
    tip: "Suas fretes, nossa plataforma, seu crescimento."
  },
  {
    texto: "Cada grande realização começa com uma primeira tentativa.",
    autor: "Zig Ziglar",
    tip: "Junte-se a transportadores que aumentaram seus ganhos em 40%."
  },
  {
    texto: "O sucesso não é final, o fracasso não é fatal. O que importa é coragem de continuar.",
    autor: "Winston Churchill",
    tip: "Temos suporte 24/7 para ajudar sua jornada."
  }
];

export const registroMessages = [
  {
    texto: "Cada grande jornada começa com um único pessoa. Este é o seu momento.",
    autor: "Achei Meu Frete",
    tip: "Cada grande jornada começa com um único pessoa. Este é o seu momento."
  },
  {
    texto: "O futuro pertence aos que acreditam na beleza dos seus sonhos.",
    autor: "Eleanor Roosevelt",
    tip: "Sua oportunidade de crescer está aqui, agora."
  },
  {
    texto: "Você tem tudo o que precisa para começar. O resto virá naturalmente.",
    autor: "Achei Meu Frete",
    tip: "100% seguro, 24/7 de suporte, liberdade total."
  },
  {
    texto: "A ação é o fundamento do sucesso.",
    autor: "Pablo Picasso",
    tip: "Comece sua jornada com um único clique."
  },
  {
    texto: "Tudo que você quer está do outro lado do medo.",
    autor: "George Addair",
    tip: "Milhares de profissionais já fizeram a mesma escolha."
  },
  {
    texto: "Seu talento é seu ouro. Agora é hora de brilhar.",
    autor: "Achei Meu Frete",
    tip: "Ferramentas profissionais para crescimento profissional."
  },
  {
    texto: "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    autor: "Robert Collier",
    tip: "Construa seu império logístico com nossa plataforma."
  },
  {
    texto: "A melhor investimento que você pode fazer é em si mesmo.",
    autor: "Warren Buffett",
    tip: "Desenvolva suas habilidades e ganhe mais."
  }
];

export const getRandomMessage = (messageArray) => {
  return messageArray[Math.floor(Math.random() * messageArray.length)];
};

export const getRandomLoginMessage = () => getRandomMessage(loginMessages);
export const getRandomRegistroMessage = () => getRandomMessage(registroMessages);

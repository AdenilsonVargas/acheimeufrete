/**
 * Tipos e Interfaces para a aplicação AcheimeuFrete
 * Baseado em site/entities
 */

// ==================== AUTENTICAÇÃO ====================

export interface Credencial {
  id: string;
  usuarioId: string;
  tipo: 'email' | 'oauth' | 'api_key';
  valor: string;
  ativa: boolean;
  criadaEm: Date;
  expiradaEm?: Date;
}

export interface AcessoTemporario {
  id: string;
  usuarioId: string;
  codigo: string;
  tipoAcesso: 'codigo_diario' | 'acesso_especial';
  validoAte: Date;
  usado: boolean;
}

// ==================== COTAÇÕES ====================

export interface Cotacao {
  id: string;
  clienteId: string;
  transportadorId?: string;
  status: 'pendente' | 'aceita' | 'rejeitada' | 'coletada' | 'em_transito' | 'entregue' | 'cancelada';
  origem: {
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    latitude?: number;
    longitude?: number;
  };
  destino: {
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    latitude?: number;
    longitude?: number;
  };
  peso: number; // kg
  volume?: number; // m³
  valor: number; // centavos
  prazoEstimado: number; // dias
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataColeta?: Date;
  dataEntrega?: Date;
  descricao?: string;
  produtos: Produto[];
}

export interface RespostaCotacao {
  id: string;
  cotacaoId: string;
  transportadorId: string;
  valor: number; // centavos
  prazo: number; // dias
  dataProposicao: Date;
  status: 'pendente' | 'aceita' | 'rejeitada' | 'contraproposta';
  descricao?: string;
  condicoesEspeciais?: string;
}

export interface CotacaoFavorita {
  id: string;
  clienteId: string;
  transportadorId: string;
  criadaEm: Date;
}

// ==================== PRODUTOS ====================

export interface Produto {
  id: string;
  clienteId: string;
  nome: string;
  descricao?: string;
  peso: number; // kg
  dimensoes?: {
    comprimento: number;
    altura: number;
    profundidade: number;
  };
  ncm: string; // Classificação fiscal
  valor: number; // centavos
  quantidade: number;
  imagem?: string;
  criadoEm: Date;
}

export interface NCM {
  id: string;
  codigo: string; // 8 dígitos
  descricao: string;
  aliquotaIcms: number;
  aliquotaPis: number;
  aliquotaCofins: number;
}

export interface NCMAtendido {
  id: string;
  transportadorId: string;
  ncm: string;
  ativo: boolean;
}

// ==================== ENDEREÇOS ====================

export interface Endereco {
  id: string;
  usuarioId: string;
  tipo: 'residencial' | 'comercial' | 'industrial';
  rua: string;
  numero: string;
  complemento?: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: number;
  longitude?: number;
  principal: boolean;
}

export interface EnderecoColeta {
  id: string;
  clienteId: string;
  rua: string;
  numero: string;
  complemento?: string;
  cidade: string;
  estado: string;
  cep: string;
  referencia?: string;
  ativo: boolean;
}

export interface Destinatario {
  id: string;
  clienteId: string;
  nome: string;
  contato: string;
  telefone: string;
  email?: string;
  endereco: string;
  numero: string;
  complemento?: string;
  cidade: string;
  estado: string;
  cep: string;
  ativo: boolean;
}

export interface RegiaoAtendida {
  id: string;
  transportadorId: string;
  uf: string;
  municipios?: string[];
  ativa: boolean;
  precoBase?: number; // centavos
}

// ==================== PERFIS ====================

export interface PerfilCliente {
  id: string;
  usuarioId: string;
  nomeEmpresa: string;
  cnpj?: string;
  cpf?: string;
  telefone: string;
  email: string;
  website?: string;
  ramo: string;
  descricao?: string;
  avatar?: string;
  verificado: boolean;
  ativo: boolean;
  avaliacaoMedia?: number;
  totalAvaliacoes?: number;
  criadoEm: Date;
}

export interface PerfilTransportadora {
  id: string;
  usuarioId: string;
  nomeEmpresa: string;
  cnpj: string;
  rntrc: string; // Registro Nacional Transportador
  telefone: string;
  email: string;
  website?: string;
  descricao?: string;
  avatar?: string;
  tiposVeiculo: string[];
  capacidadeMedia: number; // kg
  cobertura: string[];
  verificado: boolean;
  ativo: boolean;
  avaliacaoMedia?: number;
  totalAvaliacoes?: number;
  criadoEm: Date;
}

// ==================== AVALIAÇÕES ====================

export interface Avaliacao {
  id: string;
  cotacaoId: string;
  clienteId: string;
  transportadorId: string;
  classificacao: number; // 1-5
  comentario?: string;
  recomenda: boolean;
  dataAvaliacao: Date;
}

export interface AvaliacaoCliente {
  id: string;
  cotacaoId: string;
  transportadorId: string;
  clienteId: string;
  classificacao: number; // 1-5
  comentario?: string;
  pagamentoOk: boolean;
  respeitoPrazo: boolean;
  dataAvaliacao: Date;
}

// ==================== PAGAMENTOS ====================

export interface Pagamento {
  id: string;
  usuarioId: string;
  cotacaoId?: string;
  tipo: 'transferencia' | 'cartao' | 'boleto' | 'pix' | 'credito';
  valor: number; // centavos
  status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'reembolsado';
  metodoPagamento?: {
    tipo: string;
    ultimos4Digitos?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
  };
  dataPagamento?: Date;
  dataVencimento?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

// ==================== FINANCEIRO ====================

export interface Financeiro {
  id: string;
  usuarioId: string;
  saldoDisponivel: number; // centavos
  saldoBloqueado: number; // centavos
  totalRecebido: number; // centavos
  totalGasto: number; // centavos
  comissoes: number; // centavos
  atualizadoEm: Date;
}

// ==================== CHAT ====================

export interface Chat {
  id: string;
  clienteId: string;
  transportadorId: string;
  cotacaoId?: string;
  ultimaMensagem?: string;
  dataUltimaMensagem?: Date;
  ativo: boolean;
  criadoEm: Date;
}

// ==================== PREMIUM E CRÉDITOS ====================

export interface AssinaturaPremium {
  id: string;
  usuarioId: string;
  plano: 'basico' | 'profissional' | 'empresarial';
  dataInicio: Date;
  dataVencimento: Date;
  ativa: boolean;
  renovacaoAutomatica: boolean;
  valor: number; // centavos
}

export interface PacotePremium {
  id: string;
  nome: string;
  descricao: string;
  preco: number; // centavos
  duracao: number; // dias
  limites: {
    cotacoesAoMes: number;
    respostasAoMes: number;
    msgsChatAoMes: number;
    storageGB: number;
  };
  beneficios: string[];
  ativo: boolean;
}

export interface OpcaoEnvio {
  id: string;
  nome: string;
  descricao: string;
  prazoMinimo: number; // dias
  prazoMaximo: number; // dias
  premoAdicionais?: number; // centavos por km
  ativa: boolean;
}

// ==================== HISTÓRICO E ATRASOS ====================

export interface HistoricoAtraso {
  id: string;
  cotacaoId: string;
  transportadorId: string;
  motivo: string;
  diasAtraso: number;
  descricao?: string;
  dataRelatada: Date;
  status: 'relatado' | 'investigando' | 'resolvido' | 'confirmado';
}

// ==================== SEGURO ====================

export interface SeguroCarga {
  id: string;
  cotacaoId: string;
  cliente: string;
  transportadora: string;
  valor: number; // centavos
  cobertura: number; // centavos
  percentual: number; // %
  ativa: boolean;
  dataCriacao: Date;
}

// ==================== SOLICITAÇÕES ====================

export interface SolicitacaoMudancaTipo {
  id: string;
  usuarioId: string;
  tipoAtual: 'cliente' | 'transportador';
  tipoSolicitado: 'cliente' | 'transportador';
  motivo: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  dataSolicitacao: Date;
  dataAnalise?: Date;
  analista?: string;
}

// ==================== TIPOS GENÉRICOS ====================

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo: 'cliente' | 'transportador' | 'admin';
  ativo: boolean;
  emailVerificado: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Notificacao {
  id: string;
  usuarioId: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'aviso' | 'alerta' | 'sucesso';
  lida: boolean;
  link?: string;
  criadaEm: Date;
}

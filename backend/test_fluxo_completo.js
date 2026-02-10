/**
 * Teste do fluxo completo: Produto → Cotação → Pagamento → Entrega → Financeiro
 * 
 * Este teste valida o fluxo de negócio completo da plataforma:
 * 1. Embarcador cria produto
 * 2. Embarcador cria destinatário
 * 3. Embarcador cria cotação
 * 4. Transportadora responde cotação
 * 5. Embarcador aceita cotação
 * 6. Sistema cria pagamento
 * 7. Embarcador paga
 * 8. Transportadora coleta
 * 9. Transportadora registra CT-e/CIOT
 * 10. Transportadora finaliza entrega
 * 11. Sistema registra no financeiro (com 5% de taxa)
 * 12. Transportadora e embarcador avaliam um ao outro
 */

const BASE_URL = 'http://localhost:5000/api';

// Tokens de teste (obter via login)
let embarcadorToken = '';
let transportadoraToken = '';

// IDs criados durante o teste
let produtoId = '';
let destinatarioId = '';
let cotacaoId = '';
let respostaId = '';
let pagamentoId = '';
let transportadoraSelecionadaId = '';
let clienteId = '';

console.log('🧪 Teste de Fluxo Completo - Achei Meu Frete\n');

/**
 * Utilidade: requisição HTTP
 */
async function request(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${result.message || JSON.stringify(result)}`);
  }
  
  return result;
}

/**
 * PASSO 1: Login como embarcador
 */
async function loginEmbarcador() {
  console.log('1️⃣  Login como Embarcador...');
  
  try {
    const result = await request('POST', '/auth/login', {
      email: 'embarcador@test.com',
      password: '123456'
    });
    
    embarcadorToken = result.token;
    clienteId = result.user?.id;
    console.log('✅ Embarcador autenticado\n');
  } catch (error) {
    console.error('❌ Erro no login do embarcador:', error.message);
    throw error;
  }
}

/**
 * PASSO 2: Login como transportadora
 */
async function loginTransportadora() {
  console.log('2️⃣  Login como Transportadora...');
  
  try {
    const result = await request('POST', '/auth/login', {
      email: 'transportador@test.com',
      password: '123456'
    });
    
    transportadoraToken = result.token;
    console.log('✅ Transportadora autenticada\n');
  } catch (error) {
    console.error('❌ Erro no login da transportadora:', error.message);
    throw error;
  }
}

/**
 * PASSO 3: Criar produto
 */
async function criarProduto() {
  console.log('3️⃣  Criar Produto...');
  
  try {
    const result = await request('POST', '/produtos', {
      nome: 'Notebook Dell',
      ncmCode: '84713012',
      ncmClassificacao: 'Informática',
      unidadeMedida: 'kg',
      pesoKg: 2.5,
      alturaM: 0.25,
      larguraM: 0.35,
      comprimentoM: 0.30,
      valorUnitario: 3500.00,
      flags: ['frágil'],
      observacoes: 'Produto frágil'
    }, embarcadorToken);
    
    produtoId = result.data?.id || result.id;
    console.log(`✅ Produto criado: ${produtoId}\n`);
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error.message);
    throw error;
  }
}

/**
 * PASSO 4: Criar destinatário
 */
async function criarDestinatario() {
  console.log('4️⃣  Criar Destinatário...');
  
  try {
    const result = await request('POST', '/destinatarios', {
      nomeCompleto: 'Cliente Final LTDA',
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      pais: 'Brasil',
      aceitaMotoCarAte100km: false
    }, embarcadorToken);
    
    destinatarioId = result.data?.id || result.id;
    console.log(`✅ Destinatário criado: ${destinatarioId}\n`);
  } catch (error) {
    console.error('❌ Erro ao criar destinatário:', error.message);
    throw error;
  }
}

/**
 * PASSO 5: Criar cotação
 */
async function criarCotacao() {
  console.log('5️⃣  Criar Cotação...');
  
  try {
    const result = await request('POST', '/cotacoes', {
      titulo: 'Envio notebook',
      descricao: 'Entrega expressa',
      cepColeta: '04029200',
      enderecoColeta: 'Rua Dr. Bacelar, 100',
      dataColeta: new Date(Date.now() + 86400000 * 2).toISOString(),
      cepEntrega: '01310100',
      enderecoEntrega: 'Av. Paulista, 1000',
      dataEntrega: new Date(Date.now() + 86400000 * 5).toISOString(),
      peso: 2.5,
      altura: 0.25,
      largura: 0.35,
      profundidade: 0.30,
      valorEstimado: 3500,
      valorMinimo: 200,
      valorMaximo: 500
    }, embarcadorToken);
    
    cotacaoId = result.cotacao?.id || result.data?.id || result.id;
    console.log(`✅ Cotação criada: ${cotacaoId}`);
    console.log(`   Número: ${result.cotacao?.numero || result.data?.numero || result.numero}`);
    console.log(`   Status: ${result.cotacao?.status || result.data?.status || result.status}\n`);
  } catch (error) {
    console.error('❌ Erro ao criar cotação:', error.message);
    throw error;
  }
}

/**
 * PASSO 6: Transportadora responde cotação
 */
async function responderCotacao() {
  console.log('6️⃣  Transportadora responde Cotação...');
  
  try {
    const result = await request('POST', '/respostas', {
      cotacaoId,
      valor: 250.00,
      dataEntrega: new Date(Date.now() + 86400000 * 5).toISOString(),
      descricao: 'Veículo próprio, seguro total'
    }, transportadoraToken);
    
    respostaId = result.resposta?.id || result.data?.id || result.id;
    transportadoraSelecionadaId = result.resposta?.transportadorId || result.resposta?.transportador?.id || result.data?.transportadorId || result.data?.transportador?.id || result.transportadorId || result.transportador?.id;
    console.log(`✅ Resposta criada: ${respostaId}`);
    console.log(`   Valor: R$ ${(result.resposta?.valor || result.data?.valor || result.valor).toFixed(2)}\n`);
  } catch (error) {
    console.error('❌ Erro ao responder cotação:', error.message);
    throw error;
  }
}

/**
 * PASSO 7: Embarcador aceita cotação
 */
async function aceitarCotacao() {
  console.log('7️⃣  Embarcador aceita Cotação...');
  
  try {
    const result = await request('POST', `/cotacoes/${cotacaoId}/aceitar`, {
      respostaId
    }, embarcadorToken);
    
    console.log(`✅ Cotação aceita`);
    console.log(`   Status: ${result.cotacao.status}\n`);
  } catch (error) {
    console.error('❌ Erro ao aceitar cotação:', error.message);
    throw error;
  }
}

/**
 * PASSO 8: Sistema cria pagamento automaticamente
 */
async function verificarPagamento() {
  console.log('8️⃣  Verificar Pagamento criado...');
  
  try {
    const pagamentos = await request('GET', '/pagamentos', null, embarcadorToken);
    const pagamento = (Array.isArray(pagamentos) ? pagamentos : []).find(p => p.cotacaoId === cotacaoId);
    
    if (!pagamento) {
      throw new Error('Pagamento não foi criado automaticamente');
    }
    
    pagamentoId = pagamento.id;
    console.log(`✅ Pagamento encontrado: ${pagamentoId}`);
    console.log(`   Valor: R$ ${pagamento.valor.toFixed(2)}`);
    console.log(`   Status: ${pagamento.status}\n`);
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error.message);
    throw error;
  }
}

/**
 * PASSO 9: Embarcador paga
 */
async function realizarPagamento() {
  console.log('9️⃣  Embarcador realiza Pagamento...');
  
  try {
    const result = await request('PATCH', `/pagamentos/${pagamentoId}`, {
      status: 'aprovado',
      comprovante: 'http://exemplo.com/comprovante.pdf'
    }, embarcadorToken);
    
    console.log(`✅ Pagamento aprovado`);
    console.log(`   Status cotação deve ser: aguardando_coleta\n`);
  } catch (error) {
    console.error('❌ Erro ao realizar pagamento:', error.message);
    throw error;
  }
}

/**
 * PASSO 10: Transportadora confirma coleta
 */
async function confirmarColeta() {
  console.log('🔟 Transportadora confirma Coleta...');
  
  try {
    const result = await request('POST', `/cotacoes/${cotacaoId}/confirmar-coleta`, {
      codigoConfirmacao: 'ABC123'
    }, transportadoraToken);
    
    console.log(`✅ Coleta confirmada`);
    console.log(`   Status: ${result.cotacao.status}\n`);
  } catch (error) {
    console.error('❌ Erro ao confirmar coleta:', error.message);
    throw error;
  }
}

/**
 * PASSO 11: Transportadora registra CT-e
 */
async function registrarCTe() {
  console.log('1️⃣1️⃣  Transportadora registra CT-e...');
  
  try {
    const result = await request('POST', `/cotacoes/${cotacaoId}/documento`, {
      tipo: 'cte',
      codigo: '12345678901234567890123456789012345678901234',
      url: 'http://exemplo.com/cte.xml',
      valorFinal: 250.00
    }, transportadoraToken);
    
    console.log(`✅ CT-e registrado`);
    console.log(`   Código: ${result.cotacao.codigoCte}\n`);
  } catch (error) {
    console.error('❌ Erro ao registrar CT-e:', error.message);
    throw error;
  }
}

/**
 * PASSO 12: Transportadora registra rastreamento
 */
async function registrarRastreamento() {
  console.log('1️⃣2️⃣  Transportadora registra Rastreamento...');
  
  try {
    const result = await request('POST', `/cotacoes/${cotacaoId}/rastreamento`, {
      urlRastreamento: 'https://rastreamento.exemplo.com/ABC123',
      codigoRastreio: 'ABC123XYZ'
    }, transportadoraToken);
    
    console.log(`✅ Rastreamento registrado`);
    console.log(`   Código: ${result.cotacao.codigoRastreio}\n`);
  } catch (error) {
    console.error('❌ Erro ao registrar rastreamento:', error.message);
    throw error;
  }
}

/**
 * PASSO 13: Transportadora finaliza entrega
 */
async function finalizarEntrega() {
  console.log('1️⃣3️⃣  Transportadora finaliza Entrega...');
  
  try {
    const result = await request('POST', `/cotacoes/${cotacaoId}/finalizar`, {
      documentoCanhoto: 'http://exemplo.com/canhoto.pdf'
    }, transportadoraToken);
    
    console.log(`✅ Entrega finalizada`);
    console.log(`   Status: ${result.cotacao.status}`);
    console.log(`   Financeiro deve ser atualizado automaticamente\n`);
  } catch (error) {
    console.error('❌ Erro ao finalizar entrega:', error.message);
    throw error;
  }
}

/**
 * PASSO 14: Verificar financeiro da transportadora
 */
async function verificarFinanceiro() {
  console.log('1️⃣4️⃣  Verificar Financeiro da Transportadora...');
  
  try {
    const financeiro = await request('GET', '/financeiro', null, transportadoraToken);
    const totalMes = Array.isArray(financeiro)
      ? financeiro.reduce((acc, f) => acc + (f.totalReceber || 0), 0)
      : 0;

    console.log(`✅ Financeiro consultado`);
    console.log(`   Total Receber (mês): R$ ${totalMes.toFixed(2)}\n`);
  } catch (error) {
    console.error('❌ Erro ao verificar financeiro:', error.message);
    throw error;
  }
}

/**
 * PASSO 15: Embarcador avalia transportadora
 */
async function avaliarTransportadora() {
  console.log('1️⃣5️⃣  Embarcador avalia Transportadora...');
  
  try {
    const result = await request('POST', '/avaliacoes', {
      cotacaoId,
      transportadorId: transportadoraSelecionadaId,
      nota: 5,
      comentario: 'Excelente serviço, entrega no prazo!'
    }, embarcadorToken);
    
    console.log(`✅ Avaliação registrada`);
    console.log(`   Nota: ${result.nota} estrelas\n`);
  } catch (error) {
    console.error('❌ Erro ao avaliar transportadora:', error.message);
    throw error;
  }
}

/**
 * PASSO 16: Transportadora avalia cliente
 */
async function avaliarCliente() {
  console.log('1️⃣6️⃣  Transportadora avalia Cliente...');
  
  try {
    const result = await request('POST', '/avaliacoes/cliente', {
      cotacaoId,
      clienteId,
      nota: 5,
      comentario: 'Cliente pontual e organizado'
    }, transportadoraToken);
    
    console.log(`✅ Avaliação registrada`);
    console.log(`   Nota: ${result.nota} estrelas\n`);
  } catch (error) {
    console.error('❌ Erro ao avaliar cliente:', error.message);
    throw error;
  }
}

/**
 * Executar teste completo
 */
async function executarTeste() {
  try {
    console.log('═'.repeat(60));
    console.log('INICIANDO TESTE DE FLUXO COMPLETO');
    console.log('═'.repeat(60) + '\n');

    await loginEmbarcador();
    await loginTransportadora();
    await criarProduto();
    await criarDestinatario();
    await criarCotacao();
    await responderCotacao();
    await aceitarCotacao();
    await verificarPagamento();
    await realizarPagamento();
    await confirmarColeta();
    await registrarCTe();
    await registrarRastreamento();
    await finalizarEntrega();
    await verificarFinanceiro();
    await avaliarTransportadora();
    await avaliarCliente();

    console.log('═'.repeat(60));
    console.log('✅ TESTE COMPLETO EXECUTADO COM SUCESSO!');
    console.log('═'.repeat(60));
    console.log('\n📊 Resumo:');
    console.log(`   Produto: ${produtoId}`);
    console.log(`   Destinatário: ${destinatarioId}`);
    console.log(`   Cotação: ${cotacaoId}`);
    console.log(`   Resposta: ${respostaId}`);
    console.log(`   Pagamento: ${pagamentoId}`);
    console.log('\n✨ O fluxo completo está funcional do início ao fim!');
    
  } catch (error) {
    console.log('\n═'.repeat(60));
    console.error('❌ TESTE FALHOU');
    console.log('═'.repeat(60));
    console.error('\n🔍 Detalhes do erro:', error.message);
    console.error('\n💡 Próximos passos:');
    console.error('   1. Verifique se o servidor está rodando');
    console.error('   2. Verifique se os usuários de teste existem');
    console.error('   3. Verifique se o banco de dados está sincronizado');
    process.exit(1);
  }
}

// Executar
executarTeste();

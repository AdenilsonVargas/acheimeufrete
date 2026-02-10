#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const usuarios = {
  embarcador: {
    email: 'embarcador@test.com',
    senha: '123456'
  },
  transportador: {
    email: 'transportador@test.com',
    senha: '123456'
  }
};

let tokens = {};
let userIds = {};

console.log('\n🧪 Teste de Dashboards Financeiros\n');
console.log('════════════════════════════════════════════════════════════');

async function fazer(metodo, url, dados = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    headers,
    validateStatus: () => true
  };

  try {
    if (metodo === 'GET') {
      return await axios.get(url, config);
    } else if (metodo === 'POST') {
      return await axios.post(url, dados, config);
    } else if (metodo === 'PUT') {
      return await axios.put(url, dados, config);
    }
  } catch (erro) {
    console.error('Erro na requisição:', erro.message);
    return null;
  }
}

async function testarDashboards() {
  try {
    // 1. Login como Embarcador
    console.log('\n1️⃣  Login como Embarcador...');
    let res = await fazer('POST', `${BASE_URL}/auth/login`, {
      email: usuarios.embarcador.email,
      password: usuarios.embarcador.senha
    });
    
    if (!res?.data?.token) {
      throw new Error('Falha ao fazer login do embarcador');
    }
    
    tokens.embarcador = res.data.token;
    userIds.embarcador = res.data.user.id;
    console.log('✅ Embarcador autenticado');

    // 2. Login como Transportador
    console.log('\n2️⃣  Login como Transportador...');
    res = await fazer('POST', `${BASE_URL}/auth/login`, {
      email: usuarios.transportador.email,
      password: usuarios.transportador.senha
    });
    
    if (!res?.data?.token) {
      throw new Error('Falha ao fazer login do transportador');
    }
    
    tokens.transportador = res.data.token;
    userIds.transportador = res.data.user.id;
    console.log('✅ Transportador autenticado');

    // 3. Testar Dashboard do Embarcador
    console.log('\n3️⃣  Buscar Dashboard do Embarcador...');
    res = await fazer('GET', `${BASE_URL}/dashboard/embarcador`, null, tokens.embarcador);
    
    if (res?.data?.success) {
      console.log('✅ Dashboard do Embarcador');
      console.log('   Resumo:');
      console.log(`   - Total a Pagar: R$ ${res.data.data.resumo.totalAPagar.toFixed(2)}`);
      console.log(`   - Total Pago no Mês: R$ ${res.data.data.resumo.totalPagoMes.toFixed(2)}`);
      console.log(`   - Total em Boletos: R$ ${res.data.data.resumo.totalBoletosEmAberto.toFixed(2)}`);
      console.log(`   - Cotações em Aberto: ${res.data.data.resumo.cotacoesEmAberto}`);
    } else {
      console.log('❌ Erro ao buscar dashboard:', res?.data?.error);
    }

    // 4. Testar Dashboard do Transportador
    console.log('\n4️⃣  Buscar Dashboard do Transportador...');
    res = await fazer('GET', `${BASE_URL}/dashboard/transportador`, null, tokens.transportador);
    
    if (res?.data?.success) {
      console.log('✅ Dashboard do Transportador');
      console.log('   Resumo:');
      console.log(`   - Total Faturado Mês: R$ ${res.data.data.resumo.totalFaturadoMes.toFixed(2)}`);
      console.log(`   - Comissão (5%): R$ ${res.data.data.resumo.comissaoMes.toFixed(2)}`);
      console.log(`   - Total Recebido Mês: R$ ${res.data.data.resumo.totalRecebidoMes.toFixed(2)}`);
      console.log(`   - Total a Receber: R$ ${res.data.data.resumo.totalAReceber.toFixed(2)}`);
      console.log(`   - Total Líquido a Receber: R$ ${res.data.data.resumo.totalLiquidoAReceber.toFixed(2)}`);
      console.log(`   - Cotações Recebidas: ${res.data.data.resumo.cotacoesRecebidas}`);
      console.log(`   - Cotações a Receber: ${res.data.data.resumo.cotacoesAReceber}`);
    } else {
      console.log('❌ Erro ao buscar dashboard:', res?.data?.error);
    }

    // 5. Testar lista de boletos (Admin)
    console.log('\n5️⃣  Listar Solicitações de Boleto (Admin)...');
    res = await fazer('GET', `${BASE_URL}/admin/boleto/solicitacoes`, null, tokens.embarcador);
    
    if (res?.data?.success) {
      console.log('✅ Solicitações de Boleto Listadas');
      console.log(`   - Total de Solicitações: ${res.data.data.length}`);
      console.log(`   - Paginação: página ${res.data.pagination.page} de ${res.data.pagination.pages}`);
    } else {
      console.log('⚠️  Resposta:', res?.status);
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ TESTES DE DASHBOARD CONCLUÍDOS!');
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (erro) {
    console.error('\n❌ Erro:', erro.message);
    process.exit(1);
  }
}

// Iniciar testes
testarDashboards();

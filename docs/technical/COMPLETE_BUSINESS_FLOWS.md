# Fluxos de Negócio Completos - Achei Meu Frete

## Visão Geral

Este documento descreve todos os fluxos de negócio da plataforma do início ao fim, garantindo que desenvolvedores entendam completamente como o sistema funciona antes de implementar qualquer funcionalidade.

## 1. Fluxo Completo de Cotação

### 1.1 Criação de Cotação pelo Embarcador

**Pré-requisitos:**
- Embarcador deve ter cadastro completo
- Embarcador deve ter avaliado cotações anteriores (se houver pendentes)

**Processo:**
1. Embarcador acessa dashboard
2. Clica em "Nova Cotação"
3. Sistema valida se há avaliações pendentes
   - Se SIM: Bloqueia e exibe lista de avaliações pendentes
   - Se NÃO: Continua para formulário
4. Embarcador preenche dados da cotação:
   - Produto (cadastrado previamente)
   - Destinatário (cadastrado previamente)
   - Endereço de coleta
   - Endereço de entrega
   - Valor da nota fiscal
   - Peso total
   - Quantidade de volumes
   - Tipo de frete (CIF/FOB)
   - Data/hora de coleta desejada
   - Características especiais:
     - Requer palete?
     - É urgente?
     - É frágil?
     - Requer carga dedicada?
   - Tempo para receber propostas (padrão: 60 minutos)
5. Sistema calcula data/hora de expiração (now + tempo_cotacao_minutos)
6. Sistema cria cotação com status "open"
7. Sistema armazena em cache (Redis) com TTL
8. Sistema notifica transportadoras elegíveis
9. Embarcador visualiza cotação criada com contador regressivo

**Regras de Negócio:**
- Cotação DEVE expirar automaticamente após tempo definido
- Cotação expirada DEVE desaparecer de todas as telas de transportadoras
- Data de coleta DEVE ser futura
- Valores DEVEM ser positivos

### 1.2 Transportadora Visualiza Cotações Disponíveis

**Pré-requisitos:**
- Transportadora deve ter cadastro completo e ativo
- Transportadora deve ter avaliado entregas anteriores (se houver pendentes)

**Processo:**
1. Transportadora acessa "Cotações Disponíveis"
2. Sistema busca cotações:
   - Status: "open" ou "in_progress"
   - expiration_datetime > NOW()
   - deleted_at IS NULL
3. Sistema exibe lista com:
   - Número sequencial da cotação
   - Origem → Destino
   - Distância aproximada
   - Peso total
   - Quantidade de volumes
   - Valor da nota fiscal
   - Tempo restante (contador regressivo)
   - Características especiais (badges)
4. Transportadora clica para ver detalhes
5. Sistema exibe informações completas
6. Transportadora decide se vai fazer proposta

**Regras de Negócio:**
- Cotações expiradas NÃO devem aparecer
- Cotações com tempo < 0 devem ser removidas automaticamente
- Sistema deve executar cron job a cada minuto para expirar cotações

### 1.3 Transportadora Envia Proposta

**Pré-requisitos:**
- Transportadora deve ter avaliado entregas anteriores
- Cotação deve estar aberta e não expirada
- Transportadora não pode ter proposta duplicada na mesma cotação

**Processo:**
1. Transportadora preenche valores:
   - Valor base (obrigatório)
   - Valor adicional por palete (se aplicável)
   - Valor adicional urgente (se aplicável)
   - Valor adicional frágil (se aplicável)
   - Valor adicional carga dedicada (se aplicável)
   - Valor do seguro
   - Dias estimados para entrega
   - Data/hora estimada de coleta
   - Observações (opcional)
2. Sistema calcula valor total automaticamente
3. Sistema valida:
   - Cotação ainda está aberta
   - Cotação não expirou
   - Valores são positivos
   - Transportadora não tem proposta existente
4. Sistema salva proposta com status "pending"
5. Sistema incrementa response_count da cotação
6. Sistema atualiza status da cotação para "in_progress"
7. Sistema notifica embarcador sobre nova proposta
8. Transportadora visualiza "Proposta Enviada"

**Regras de Negócio:**
- Uma transportadora pode enviar apenas UMA proposta por cotação
- Valor total = base + palete + urgente + frágil + dedicado + seguro
- Sistema deve calcular automaticamente (trigger no banco)

### 1.4 Embarcador Analisa Propostas

**Processo:**
1. Embarcador recebe notificação de nova proposta
2. Embarcador acessa cotação
3. Sistema exibe todas as propostas recebidas:
   - Nome da transportadora
   - Avaliação média (estrelas)
   - Valor total
   - Prazo de entrega
   - Detalhamento dos valores
   - Botão "Aceitar"
4. Embarcador compara propostas
5. Embarcador seleciona uma proposta
6. Sistema mostra resumo com valor final
7. Embarcador confirma aceitação

### 1.5 Processamento de Pagamento

**Pré-requisitos:**
- Proposta aceita pelo embarcador

**Processo:**

#### 1.5.1 Determinar Método de Pagamento Permitido

```javascript
// Sistema verifica perfil do embarcador e tipo de transportadora
if (embarcador.profile_type === 'physical_person') {
  // CPF: Sempre antecipado via InfinitePay
  metodos_permitidos = ['infinitepay'];
  timing = 'prepaid';
} else if (embarcador.profile_type === 'legal_entity') {
  // CNPJ: Verificar autorização e tipo de transportadora
  if (transportadora.is_autonomous && transportadora.has_ciot) {
    // Autônomo com CIOT: Sempre antecipado
    metodos_permitidos = ['infinitepay', 'pix', 'cartao'];
    timing = 'prepaid';
  } else if (embarcador.boleto_authorized) {
    // CNPJ autorizado: Pode usar boleto
    metodos_permitidos = ['infinitepay', 'pix', 'cartao', 'boleto'];
    timing = 'prepaid_or_boleto';
  } else {
    // CNPJ sem autorização: Antecipado
    metodos_permitidos = ['infinitepay', 'pix', 'cartao'];
    timing = 'prepaid';
  }
}
```

#### 1.5.2 Pagamento Antecipado (InfinitePay/PIX/Cartão)

1. Sistema exibe métodos de pagamento permitidos
2. Embarcador escolhe método
3. Sistema cria ordem de pagamento:
   - gross_amount = valor_total_proposta
   - platform_fee = valor_total * 0.05 (5%)
   - carrier_net_amount = valor_total - platform_fee
4. Sistema integra com InfinitePay:
   - Cria link de pagamento
   - Recebe webhook de confirmação
5. Ao confirmar pagamento:
   - Status payment: "completed"
   - Status quotation: "accepted"
   - Notifica transportadora
   - Notifica embarcador

#### 1.5.3 Pagamento via Boleto (Somente CNPJ Autorizado)

1. Sistema valida se embarcador tem autorização
2. Sistema calcula vencimento (último dia do mês atual)
3. Sistema gera boleto via InfinitePay:
   - Valor total da cotação
   - Vencimento no último dia do mês
   - Instruções de pagamento
4. Sistema salva:
   - due_date
   - boleto_url
   - boleto_barcode
   - status: "pending"
5. Embarcador recebe boleto por email
6. Cotação fica com status "awaiting_payment"
7. Sistema monitora webhook do InfinitePay
8. Ao confirmar pagamento:
   - Status payment: "completed"
   - Status quotation: "accepted"
   - Notifica transportadora

**Cron Job de Vencimento de Boletos:**
- Executar diariamente
- Buscar boletos vencidos (due_date < NOW() AND status = 'pending')
- Atualizar status para "overdue"
- Notificar embarcador
- Cancelar cotação se não pago em X dias

### 1.6 Coleta da Mercadoria

**Processo:**
1. Cotação passa para status "awaiting_pickup"
2. Transportadora recebe notificação com detalhes:
   - Endereço de coleta
   - Data/hora agendada
   - Contato do embarcador
   - Dados da mercadoria
3. Transportadora confirma coleta na plataforma
4. Sistema atualiza status para "in_transit"
5. Embarcador recebe notificação de coleta confirmada

**Funcionalidade: Rastreamento (Futuro)**
- Transportadora envia atualizações de localização
- Embarcador visualiza no mapa em tempo real
- Sistema envia notificações de marcos importantes

### 1.7 Emissão de CT-e (Conhecimento de Transporte Eletrônico)

**Pré-requisitos:**
- Cotação em status "in_transit"
- Transportadora deve ter certificado digital válido
- Mercadoria coletada

**Processo:**

#### 1.7.1 Configuração do Certificado Digital

1. Transportadora acessa "Configurações > Certificado Digital"
2. Sistema solicita permissão para acessar certificado:
   - Navegador/aplicação solicita acesso ao certificado
   - Usuário seleciona certificado A1 ou configura A3
3. Sistema valida certificado:
   - Verifica validade
   - Verifica se é de pessoa jurídica
   - Armazena informações (não a chave privada)
4. Sistema ativa emissão de CT-e

#### 1.7.2 Emissão do CT-e

1. Transportadora acessa cotação
2. Clica em "Emitir CT-e"
3. Sistema pré-preenche dados do CT-e:
   - Dados do emitente (transportadora)
   - Dados do remetente (embarcador ou fornecedor)
   - Dados do destinatário
   - Dados da carga:
     - Produto
     - Peso
     - Volumes
     - Valor da nota fiscal
   - Dados do serviço:
     - Valor do frete (da proposta aceita)
     - ICMS
     - Outros impostos
4. Transportadora revisa e confirma
5. Sistema gera XML do CT-e
6. Sistema assina XML com certificado digital
7. Sistema envia para SEFAZ:
   - Ambiente de produção ou homologação
   - Aguarda retorno
8. SEFAZ retorna:
   - Aprovação: Chave de acesso e protocolo
   - Rejeição: Motivos da rejeição
9. Se aprovado:
   - Sistema salva chave do CT-e
   - Sistema gera DACTE (PDF)
   - Status: CT-e emitido
   - Notifica embarcador

**Tratamento de Divergência de Valor:**

```javascript
// Sistema compara valor do CT-e com valor da cotação
const valor_cotacao = quotation.final_value;
const valor_cte = cte.valor_frete;

if (Math.abs(valor_cotacao - valor_cte) > 0.01) {
  // Valores divergentes - Ajuste automático
  
  // 1. Atualizar cotação
  await db('quotations').update({
    cte_value: valor_cte,
    value_adjusted_by_cte: true,
    original_agreed_value: valor_cotacao,
    final_value: valor_cte
  });
  
  // 2. Recalcular taxas
  const new_platform_fee = valor_cte * 0.05;
  const new_carrier_net = valor_cte - new_platform_fee;
  
  // 3. Atualizar pagamento
  await db('payments').update({
    gross_amount: valor_cte,
    platform_fee: new_platform_fee,
    carrier_net_amount: new_carrier_net
  });
  
  // 4. Registrar histórico
  await db('quotation_value_adjustments').insert({
    quotation_id: quotation.id,
    original_value: valor_cotacao,
    new_value: valor_cte,
    adjustment_reason: 'cte_value_difference'
  });
  
  // 5. Notificar embarcador
  await createNotification({
    user_id: quotation.shipper_id,
    type: 'quotation_value_adjusted',
    message: `Valor ajustado de R$ ${valor_cotacao} para R$ ${valor_cte} baseado no CT-e`
  });
}
```

**Observação:** NÃO há negociação. O ajuste é AUTOMÁTICO e OBRIGATÓRIO.

### 1.8 Entrega da Mercadoria

**Processo:**
1. Transportadora chega no destino
2. Destinatário recebe mercadoria
3. Transportadora confirma entrega na plataforma:
   - Data/hora de entrega
   - Nome do recebedor
   - Foto do comprovante (opcional)
   - Observações
4. Sistema atualiza status para "completed"
5. Embarcador recebe notificação de entrega concluída

### 1.9 Avaliação Obrigatória

**Processo:**

#### 1.9.1 Embarcador Avalia Transportadora

1. Sistema notifica embarcador para avaliar
2. Embarcador clica em "Avaliar"
3. Sistema exibe formulário:
   - Avaliação geral (1-5 estrelas)
   - Pontualidade (1-5 estrelas)
   - Comunicação (1-5 estrelas)
   - Qualidade do serviço (1-5 estrelas)
   - Comentário (opcional)
4. Embarcador submete avaliação
5. Sistema salva e atualiza:
   - Marca quotation.rated_by_shipper = true
   - Decrementa shipper.pending_ratings_count
   - Atualiza carrier.average_rating
   - Notifica transportadora

#### 1.9.2 Transportadora Avalia Embarcador

1. Sistema notifica transportadora para avaliar
2. Transportadora clica em "Avaliar"
3. Sistema exibe formulário (similar)
4. Transportadora submete avaliação
5. Sistema salva e atualiza:
   - Marca quotation.rated_by_carrier = true
   - Decrementa carrier.pending_ratings_count
   - Atualiza shipper.average_rating

**Bloqueio por Avaliações Pendentes:**

```javascript
// Antes de criar nova cotação
async function validateShipperCanCreateQuotation(shipperId) {
  const pending = await db('quotations')
    .where('shipper_id', shipperId)
    .where('status', 'completed')
    .where('rated_by_shipper', false)
    .count();
  
  if (pending[0].count > 0) {
    throw new Error(
      'Você possui avaliações pendentes. ' +
      'Avalie suas cotações anteriores para criar uma nova.'
    );
  }
}

// Antes de responder cotação
async function validateCarrierCanRespondQuotation(carrierId) {
  const pending = await db('quotations')
    .join('quotation_responses', 'quotations.id', 'quotation_responses.quotation_id')
    .where('quotation_responses.carrier_id', carrierId)
    .where('quotations.status', 'completed')
    .where('quotations.rated_by_carrier', false)
    .count();
  
  if (pending[0].count > 0) {
    throw new Error(
      'Você possui avaliações pendentes. ' +
      'Avalie suas entregas anteriores para aceitar novas cotações.'
    );
  }
}
```

## 2. Fluxo de Emissão de CIOT (Transportador Autônomo)

### 2.1 O que é CIOT?

CIOT (Código Identificador da Operação de Transporte) é obrigatório para transportadores autônomos. Garante o pagamento antecipado do frete ao motorista.

### 2.2 Processo de Emissão na Plataforma

**Pré-requisitos:**
- Transportadora cadastrada como autônoma (is_autonomous = true)
- Transportadora marcada como emissora de CIOT (has_ciot = true)
- Cotação aceita com pagamento confirmado

**Processo:**

1. Embarcador aceita proposta de transportador autônomo com CIOT
2. Sistema valida que pagamento DEVE ser antecipado:
   ```javascript
   if (carrier.is_autonomous && carrier.has_ciot) {
     // Força pagamento antecipado
     payment_timing = 'prepaid';
     allowed_methods = ['infinitepay', 'pix', 'cartao'];
     // Boleto NÃO permitido mesmo para CNPJ
   }
   ```
3. Embarcador realiza pagamento antecipado
4. Sistema libera emissão do CIOT
5. Transportadora acessa "Emitir CIOT"
6. Sistema pré-preenche dados:
   - CPF do motorista
   - Placa do veículo
   - Dados do embarcador
   - Origem e destino
   - Valor do frete (já pago)
   - Dados da carga
7. Transportadora confirma dados
8. Sistema integra com API do CIOT (ANTT):
   - Envia requisição
   - Recebe código do CIOT
9. Sistema salva código do CIOT na cotação
10. Transportadora pode visualizar/imprimir CIOT
11. CIOT é obrigatório para fiscalização

**Campos do CIOT:**
- Código do CIOT (retornado pela ANTT)
- CPF do motorista
- Placa do veículo
- RNTRC do transportador
- Dados do contratante (embarcador)
- Valor do frete
- Data de validade

**Integração:**
```javascript
async function emitirCIOT(quotation, carrier, vehicle) {
  // 1. Validar pré-requisitos
  if (!carrier.is_autonomous || !carrier.has_ciot) {
    throw new Error('Transportadora não está habilitada para CIOT');
  }
  
  if (!quotation.payment_confirmed) {
    throw new Error('Pagamento deve ser confirmado antes de emitir CIOT');
  }
  
  // 2. Preparar dados
  const ciotData = {
    cpf_motorista: vehicle.driver_cpf,
    placa_veiculo: vehicle.plate,
    rntrc: carrier.antt_rntrc,
    contratante: {
      cnpj_cpf: shipper.cnpj || shipper.cpf,
      nome: shipper.company_name || shipper.full_name
    },
    origem: {
      cidade: pickup_address.city,
      uf: pickup_address.state
    },
    destino: {
      cidade: delivery_address.city,
      uf: delivery_address.state
    },
    valor_frete: quotation.final_value,
    carga: {
      descricao: product.description,
      peso: quotation.total_weight,
      valor_nf: quotation.invoice_value
    }
  };
  
  // 3. Chamar API do CIOT
  const response = await fetch('https://api.antt.gov.br/ciot/v1/emitir', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ANTT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ciotData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 4. Salvar CIOT
    await db('quotations').where('id', quotation.id).update({
      ciot_code: result.codigo_ciot,
      ciot_issued_at: new Date(),
      ciot_valid_until: result.validade
    });
    
    return result.codigo_ciot;
  } else {
    throw new Error(`Erro ao emitir CIOT: ${result.erro}`);
  }
}
```

## 3. Fluxo de Emissão de Nota Fiscal (NF-e)

### 3.1 Quando Emitir NF-e

A NF-e (Nota Fiscal Eletrônica) deve ser emitida pela transportadora para documentar o serviço de transporte prestado.

### 3.2 Processo de Emissão

**Pré-requisitos:**
- Transportadora CNPJ (pessoa jurídica)
- Certificado digital válido (mesmo usado para CT-e)
- Serviço de transporte realizado

**Processo:**

1. Transportadora acessa "Emitir NF-e de Serviço"
2. Sistema verifica certificado digital
3. Sistema pré-preenche dados da NF-e:
   - Emitente: Transportadora
   - Destinatário/Tomador: Embarcador
   - Natureza da operação: "Prestação de serviço de transporte"
   - Serviço:
     - Descrição: "Serviço de transporte de cargas"
     - Valor: carrier_net_amount (valor líquido da transportadora)
     - ISS: Calculado conforme município
   - Dados adicionais:
     - Referência à cotação
     - Chave do CT-e
4. Transportadora revisa
5. Sistema gera XML da NF-e
6. Sistema assina com certificado digital
7. Sistema envia para SEFAZ:
   - Validação
   - Autorização
8. Se aprovado:
   - Sistema salva chave da NF-e
   - Sistema gera DANFE (PDF)
   - Transportadora pode enviar por email
9. Se rejeitado:
   - Sistema exibe erros
   - Transportadora corrige e reenvia

**Integração com SEFAZ:**

```javascript
async function emitirNFe(quotation, carrier) {
  // 1. Buscar certificado digital
  const certificate = await getCertificateForCarrier(carrier.id);
  
  if (!certificate || !certificate.isValid()) {
    throw new Error('Certificado digital inválido ou expirado');
  }
  
  // 2. Montar dados da NF-e
  const nfeData = {
    versao: '4.00',
    ide: {
      cUF: carrier.state_code,
      natOp: 'Prestacao de servico de transporte',
      mod: '55', // Modelo 55 = NF-e
      serie: '1',
      nNF: await getNextNFeNumber(carrier.id),
      dhEmi: new Date().toISOString(),
      tpNF: '1', // 1 = Saída
      tpEmis: '1', // 1 = Normal
      tpAmb: process.env.NFE_AMBIENTE // 1 = Produção, 2 = Homologação
    },
    emit: {
      CNPJ: carrier.cnpj,
      xNome: carrier.company_name,
      xFant: carrier.trade_name,
      enderEmit: {
        xLgr: carrier.address.street,
        nro: carrier.address.number,
        xBairro: carrier.address.neighborhood,
        cMun: carrier.address.city_code,
        xMun: carrier.address.city,
        UF: carrier.address.state,
        CEP: carrier.address.postal_code
      },
      IE: carrier.state_registration
    },
    dest: {
      CNPJ: shipper.cnpj,
      xNome: shipper.company_name,
      enderDest: {
        // Endereço do destinatário
      }
    },
    det: [{
      nItem: '1',
      prod: {
        cProd: 'TRANSP001',
        xProd: 'Servico de transporte de cargas',
        NCM: '00000000',
        CFOP: '5.351', // Prestação de serviço de transporte
        uCom: 'UN',
        qCom: '1',
        vUnCom: quotation.carrier_net_amount,
        vProd: quotation.carrier_net_amount
      },
      imposto: {
        // Cálculo de impostos
        ISS: {
          vBC: quotation.carrier_net_amount,
          vAliq: 2.00, // 2% (varia por município)
          vISSQN: quotation.carrier_net_amount * 0.02
        }
      }
    }],
    total: {
      vBC: quotation.carrier_net_amount,
      vNF: quotation.carrier_net_amount
    },
    infAdic: {
      infCpl: `Referente a cotacao #${quotation.sequential_number}. CT-e: ${quotation.cte_key}`
    }
  };
  
  // 3. Gerar XML
  const xml = generateNFeXML(nfeData);
  
  // 4. Assinar XML
  const signedXML = await signXMLWithCertificate(xml, certificate);
  
  // 5. Enviar para SEFAZ
  const response = await sendToSEFAZ(signedXML, 'nfe');
  
  if (response.status === 'authorized') {
    // 6. Salvar dados
    await db('quotations').where('id', quotation.id).update({
      nfe_key: response.chave,
      nfe_protocol: response.protocolo,
      nfe_issued_at: new Date()
    });
    
    // 7. Gerar DANFE (PDF)
    const danfePDF = await generateDANFE(nfeData, response.chave);
    
    return {
      chave: response.chave,
      protocolo: response.protocolo,
      danfe_url: danfePDF.url
    };
  } else {
    throw new Error(`NF-e rejeitada: ${response.motivo}`);
  }
}
```

## 4. Gestão de Certificado Digital

### 4.1 Configuração do Certificado

**Certificado A1 (arquivo .pfx):**

1. Transportadora faz upload do arquivo .pfx
2. Sistema solicita senha do certificado
3. Sistema valida:
   - Certificado é válido
   - Não está expirado
   - É de pessoa jurídica (e-CNPJ)
   - CNPJ do certificado = CNPJ da transportadora
4. Sistema armazena de forma segura:
   - Criptografado no banco
   - Ou em serviço de secrets (AWS Secrets Manager, Azure Key Vault)
5. Sistema agenda alerta de vencimento (30 dias antes)

**Certificado A3 (hardware):**

1. Sistema detecta certificado em token/smartcard
2. Navegador/aplicação solicita permissão para acessar
3. Usuário conecta dispositivo e digita PIN
4. Sistema valida certificado
5. Sistema usa certificado diretamente do hardware
6. NÃO armazena chave privada (impossível)

**Implementação:**

```javascript
// Upload de certificado A1
async function uploadCertificateA1(carrierId, pfxFile, password) {
  // 1. Validar arquivo
  const certificate = await validatePFX(pfxFile, password);
  
  if (!certificate.isValid) {
    throw new Error('Certificado inválido ou senha incorreta');
  }
  
  if (certificate.cnpj !== carrier.cnpj) {
    throw new Error('CNPJ do certificado não corresponde ao cadastro');
  }
  
  if (certificate.expiresAt < new Date()) {
    throw new Error('Certificado expirado');
  }
  
  // 2. Criptografar e armazenar
  const encrypted = await encrypt(pfxFile, process.env.ENCRYPTION_KEY);
  
  await db('carrier_certificates').insert({
    carrier_id: carrierId,
    type: 'A1',
    encrypted_pfx: encrypted,
    encrypted_password: await encrypt(password, process.env.ENCRYPTION_KEY),
    subject_name: certificate.subjectName,
    issuer_name: certificate.issuerName,
    valid_from: certificate.validFrom,
    valid_until: certificate.validUntil,
    serial_number: certificate.serialNumber,
    created_at: new Date()
  });
  
  // 3. Agendar alerta
  await scheduleExpirationAlert(carrierId, certificate.validUntil);
}

// Uso de certificado A3 (browser)
async function signWithA3Certificate() {
  // No navegador, usar Web Crypto API
  const certificate = await navigator.credentials.get({
    publicKey: {
      challenge: new Uint8Array(32),
      rp: { name: "Achei Meu Frete" },
      user: {
        id: new Uint8Array(16),
        name: "certificado",
        displayName: "Certificado Digital"
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }]
    }
  });
  
  // Usar certificado para assinar documentos
  return certificate;
}
```

## 5. Processamento de Boletos

### 5.1 Emissão de Boleto para Embarcador (Pagamento)

**Fluxo:**

1. Embarcador CNPJ autorizado escolhe pagar via boleto
2. Sistema gera boleto via InfinitePay:
   ```javascript
   const boleto = await infinitePay.createBoleto({
     valor: quotation.final_value,
     vencimento: getLastDayOfMonth(),
     pagador: {
       nome: shipper.company_name,
       cnpj: shipper.cnpj,
       endereco: shipper.address
     },
     descricao: `Cotacao #${quotation.sequential_number}`
   });
   ```
3. Sistema salva dados do boleto
4. Embarcador recebe email com:
   - Boleto em PDF
   - Código de barras
   - Linha digitável
   - Instruções de pagamento
5. Sistema monitora webhook do InfinitePay
6. Ao confirmar pagamento:
   - Atualiza status
   - Libera cotação
   - Notifica transportadora

### 5.2 Emissão de Boleto para Transportadora (Recebimento)

**Fluxo:**

1. Após entrega completa e CT-e emitido
2. Transportadora tem direito ao recebimento
3. Sistema calcula valor líquido:
   - carrier_net_amount = gross_amount - platform_fee (5%)
4. Sistema gera boleto de pagamento para transportadora:
   ```javascript
   const boletoPagamento = await infinitePay.createPaymentBoleto({
     beneficiario: {
       nome: carrier.company_name,
       cnpj: carrier.cnpj,
       banco: carrier.bank_account.bank_code,
       agencia: carrier.bank_account.agency,
       conta: carrier.bank_account.account_number
     },
     valor: carrier_net_amount,
     vencimento: addDays(new Date(), 2), // 2 dias úteis
     descricao: `Pagamento frete - Cotacao #${quotation.sequential_number}`
   });
   ```
5. Plataforma processa pagamento para transportadora
6. Transportadora recebe notificação
7. Valor creditado na conta bancária cadastrada

**Cron Job de Pagamentos:**

```javascript
// Executar diariamente
async function processCarrierPayments() {
  // Buscar cotações completas e aprovadas para pagamento
  const quotations = await db('quotations')
    .where('status', 'completed')
    .where('rated_by_shipper', true)
    .where('carrier_paid', false)
    .whereNotNull('payment_id')
    .join('payments', 'quotations.payment_id', 'payments.id')
    .where('payments.status', 'completed')
    .select('quotations.*');
  
  for (const quotation of quotations) {
    try {
      // Processar pagamento para transportadora
      await payCarrier(quotation.id);
    } catch (error) {
      logger.error(`Erro ao pagar transportadora da cotação ${quotation.id}`, error);
    }
  }
}
```

## 6. Jobs Automatizados (Cron Jobs)

### 6.1 Expiração de Cotações (Executar a cada 1 minuto)

```javascript
async function expireQuotations() {
  const now = new Date();
  
  const expired = await db('quotations')
    .whereIn('status', ['open', 'in_progress'])
    .where('expiration_datetime', '<=', now)
    .update({
      status: 'expired',
      expired_at: now,
      updated_at: now
    });
  
  logger.info(`${expired} cotações expiradas`);
}
```

### 6.2 Vencimento de Boletos (Executar diariamente)

```javascript
async function checkOverdueBoletos() {
  const today = new Date();
  
  await db('payments')
    .where('payment_method', 'boleto')
    .where('status', 'pending')
    .where('due_date', '<', today)
    .update({ status: 'overdue' });
}
```

### 6.3 Lembretes de Avaliação (Executar diariamente)

```javascript
async function sendRatingReminders() {
  // Cotações completas há mais de 24h sem avaliação
  const pending = await db('quotations')
    .where('status', 'completed')
    .where('rated_by_shipper', false)
    .where('updated_at', '<', subDays(new Date(), 1));
  
  for (const quotation of pending) {
    await sendNotification({
      user_id: quotation.shipper_id,
      type: 'rating_reminder',
      message: 'Não esqueça de avaliar sua entrega!'
    });
  }
}
```

### 6.4 Pagamento de Transportadoras (Executar diariamente)

```javascript
async function processCarrierPayments() {
  // Implementado na seção 5.2
}
```

### 6.5 Alertas de Certificado Expirando (Executar diariamente)

```javascript
async function checkCertificateExpiration() {
  const thirtyDaysFromNow = addDays(new Date(), 30);
  
  const expiring = await db('carrier_certificates')
    .where('valid_until', '<=', thirtyDaysFromNow)
    .where('valid_until', '>', new Date());
  
  for (const cert of expiring) {
    await sendNotification({
      user_id: cert.carrier_id,
      type: 'certificate_expiring',
      message: `Seu certificado digital expira em breve! Renove antes de ${cert.valid_until}`
    });
  }
}
```

## Resumo dos Processos

1. ✅ **Cotação**: Criação → Propostas → Aceitação
2. ✅ **Pagamento**: Antecipado (InfinitePay/PIX/Cartão) ou Boleto (CNPJ autorizado)
3. ✅ **CIOT**: Emissão obrigatória para autônomos (pagamento antecipado)
4. ✅ **Coleta**: Confirmação e início do transporte
5. ✅ **CT-e**: Emissão com certificado digital + ajuste automático de valor
6. ✅ **Entrega**: Confirmação e conclusão
7. ✅ **NF-e**: Emissão pela transportadora
8. ✅ **Avaliação**: Obrigatória para ambos (bloqueia novas ações)
9. ✅ **Pagamento Transportadora**: Boleto automático após conclusão

Todos os processos garantem segurança, conformidade fiscal e satisfação do cliente.

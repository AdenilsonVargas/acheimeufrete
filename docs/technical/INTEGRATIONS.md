# Guia de Integrações Externas

## Visão Geral

Este documento detalha todas as integrações necessárias com sistemas externos para o funcionamento completo da plataforma Achei Meu Frete.

## 1. InfinitePay (Gateway de Pagamento)

### 1.1 Configuração

**Credenciais Necessárias:**
- API Key (Production)
- API Key (Sandbox/Testing)
- Webhook Secret

**Variáveis de Ambiente:**
```env
INFINITEPAY_API_KEY=sk_live_xxxxxxxxxxxxx
INFINITEPAY_SANDBOX_KEY=sk_test_xxxxxxxxxxxxx
INFINITEPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
INFINITEPAY_ENVIRONMENT=production # ou sandbox
```

### 1.2 Pagamentos Instantâneos (PIX/Cartão)

**Criar Pagamento:**

```typescript
import { InfinitePay } from '@infinitepay/node-sdk';

const infinitePay = new InfinitePay({
  apiKey: process.env.INFINITEPAY_API_KEY,
  environment: process.env.INFINITEPAY_ENVIRONMENT
});

async function createPayment(quotation: Quotation, shipper: Shipper) {
  const payment = await infinitePay.payments.create({
    amount: Math.round(quotation.final_value * 100), // Converter para centavos
    currency: 'BRL',
    payment_method_types: ['pix', 'credit_card', 'debit_card'],
    customer: {
      name: shipper.company_name || shipper.full_name,
      email: shipper.email,
      document: shipper.cnpj || shipper.cpf,
      phone: shipper.phone
    },
    metadata: {
      quotation_id: quotation.id,
      quotation_number: quotation.sequential_number,
      platform: 'acheimeufrete'
    },
    description: `Cotação #${quotation.sequential_number}`,
    success_url: `${process.env.FRONTEND_URL}/quotations/${quotation.id}/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL}/quotations/${quotation.id}/payment/cancel`
  });
  
  return {
    payment_id: payment.id,
    payment_url: payment.url,
    qr_code: payment.pix?.qr_code,
    qr_code_url: payment.pix?.qr_code_url
  };
}
```

**Processar Webhook:**

```typescript
async function handleInfinitePayWebhook(req: Request, res: Response) {
  const signature = req.headers['infinitepay-signature'];
  const payload = req.body;
  
  // 1. Validar assinatura
  const isValid = infinitePay.webhooks.verify(
    payload,
    signature,
    process.env.INFINITEPAY_WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Processar evento
  switch (payload.event) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(payload.data);
      break;
      
    case 'payment.failed':
      await handlePaymentFailed(payload.data);
      break;
      
    case 'payment.canceled':
      await handlePaymentCanceled(payload.data);
      break;
      
    case 'boleto.paid':
      await handleBoletoPaid(payload.data);
      break;
      
    case 'boleto.overdue':
      await handleBoletoOverdue(payload.data);
      break;
  }
  
  res.json({ received: true });
}

async function handlePaymentSucceeded(data: any) {
  const quotation_id = data.metadata.quotation_id;
  
  await db.transaction(async (trx) => {
    // Atualizar pagamento
    await trx('payments')
      .where('external_payment_id', data.id)
      .update({
        status: 'completed',
        paid_at: new Date(),
        updated_at: new Date()
      });
    
    // Atualizar cotação
    await trx('quotations')
      .where('id', quotation_id)
      .update({
        status: 'accepted',
        acceptance_datetime: new Date(),
        updated_at: new Date()
      });
    
    // Notificar transportadora
    const quotation = await trx('quotations').where('id', quotation_id).first();
    const response = await trx('quotation_responses')
      .where('id', quotation.selected_response_id)
      .first();
    
    await trx('notifications').insert({
      user_id: response.carrier_id,
      type: 'payment_confirmed',
      title: 'Pagamento Confirmado',
      message: `O pagamento da cotação #${quotation.sequential_number} foi confirmado!`,
      data: JSON.stringify({ quotation_id }),
      read: false,
      created_at: new Date()
    });
  });
}
```

### 1.3 Boletos

**Criar Boleto:**

```typescript
async function createBoleto(quotation: Quotation, shipper: Shipper) {
  const dueDate = getLastDayOfMonth();
  
  const boleto = await infinitePay.boletos.create({
    amount: Math.round(quotation.final_value * 100),
    due_date: format(dueDate, 'yyyy-MM-dd'),
    payer: {
      name: shipper.company_name,
      document: shipper.cnpj,
      email: shipper.email,
      address: {
        street: shipper.address.street,
        number: shipper.address.number,
        neighborhood: shipper.address.neighborhood,
        city: shipper.address.city,
        state: shipper.address.state,
        postal_code: shipper.address.postal_code
      }
    },
    metadata: {
      quotation_id: quotation.id,
      quotation_number: quotation.sequential_number
    },
    description: `Frete - Cotação #${quotation.sequential_number}`,
    instructions: [
      'Não receber após vencimento',
      'Em caso de dúvidas entre em contato'
    ]
  });
  
  await db('payments')
    .where('quotation_id', quotation.id)
    .update({
      external_payment_id: boleto.id,
      due_date: dueDate,
      boleto_url: boleto.pdf_url,
      boleto_barcode: boleto.barcode,
      status: 'pending',
      updated_at: new Date()
    });
  
  return boleto;
}
```

### 1.4 Pagamentos para Transportadoras

**Split de Pagamento:**

```typescript
async function setupSplitPayment(quotation: Quotation, carrier: Carrier) {
  const platformFee = quotation.final_value * 0.05;
  const carrierAmount = quotation.final_value - platformFee;
  
  const payment = await infinitePay.payments.create({
    amount: Math.round(quotation.final_value * 100),
    split_rules: [
      {
        recipient_id: process.env.PLATFORM_RECIPIENT_ID, // ID da plataforma
        amount: Math.round(platformFee * 100),
        liable: true // Plataforma assume chargebacks
      },
      {
        recipient_id: carrier.infinitepay_recipient_id,
        amount: Math.round(carrierAmount * 100),
        liable: false
      }
    ],
    // ... resto da configuração
  });
  
  return payment;
}
```

## 2. SEFAZ (Secretaria da Fazenda)

### 2.1 Emissão de CT-e

**Bibliotecas Recomendadas:**
- `node-dfe` (Node.js)
- `python-nfe` (Python)

**Configuração:**

```typescript
import { CTe } from 'node-dfe';

const cte = new CTe({
  ambiente: process.env.CTE_AMBIENTE, // 1 = Produção, 2 = Homologação
  estado: 'SP', // UF do emitente
  certificado: {
    pfx: Buffer.from(certificate.encrypted_pfx, 'base64'),
    senha: decryptPassword(certificate.encrypted_password)
  }
});
```

**Emitir CT-e:**

```typescript
async function emitCTe(quotation: Quotation, carrier: Carrier) {
  const cteData = {
    versao: '4.00',
    ide: {
      cUF: carrier.state_code,
      cCT: generateRandomCode(8),
      CFOP: '5.352', // Prestação de serviço de transporte
      natOp: 'Prestação de serviço de transporte',
      mod: '57', // Modelo 57 = CT-e
      serie: '1',
      nCT: await getNextCTeNumber(carrier.id),
      dhEmi: new Date().toISOString(),
      tpImp: '1', // 1 = DACTE Retrato
      tpEmis: '1', // 1 = Normal
      tpAmb: process.env.CTE_AMBIENTE,
      tpCTe: '0', // 0 = CT-e Normal
      modal: '01' // 01 = Rodoviário
    },
    emit: {
      CNPJ: carrier.cnpj,
      IE: carrier.state_registration,
      xNome: carrier.company_name,
      xFant: carrier.trade_name,
      enderEmit: {
        xLgr: carrier.address.street,
        nro: carrier.address.number,
        xCpl: carrier.address.complement,
        xBairro: carrier.address.neighborhood,
        cMun: carrier.address.city_code,
        xMun: carrier.address.city,
        CEP: carrier.address.postal_code,
        UF: carrier.address.state,
        fone: carrier.phone.replace(/\D/g, '')
      }
    },
    rem: {
      // Remetente (embarcador ou fornecedor)
      CNPJ: quotation.shipper.cnpj,
      xNome: quotation.shipper.company_name,
      enderReme: { /* endereço */ }
    },
    dest: {
      // Destinatário
      CNPJ: quotation.recipient.cnpj,
      xNome: quotation.recipient.company_name,
      enderDest: { /* endereço */ }
    },
    vPrest: {
      vTPrest: quotation.final_value, // Valor total do serviço
      vRec: quotation.final_value,
      comp: [
        {
          xNome: 'Valor do frete',
          vComp: quotation.final_value
        }
      ]
    },
    imp: {
      ICMS: {
        ICMS00: {
          CST: '00',
          vBC: quotation.final_value,
          pICMS: 12.00, // Alíquota varia por estado
          vICMS: quotation.final_value * 0.12
        }
      }
    },
    infCarga: {
      vCarga: quotation.invoice_value,
      proPred: quotation.product.description,
      xOutCat: 'Outros',
      infQ: [
        {
          cUnid: '01', // 01 = Peso em KG
          tpMed: 'Peso',
          qCarga: quotation.total_weight
        }
      ]
    },
    infDoc: {
      infNFe: [
        {
          chave: quotation.invoice_key // Chave da NF-e da mercadoria
        }
      ]
    },
    infModal: {
      versaoModal: '4.00',
      rodo: {
        RNTRC: carrier.antt_rntrc
      }
    }
  };
  
  try {
    // 1. Gerar XML
    const xml = await cte.gerarXML(cteData);
    
    // 2. Assinar XML
    const xmlAssinado = await cte.assinarXML(xml);
    
    // 3. Validar esquema XSD
    await cte.validarXML(xmlAssinado);
    
    // 4. Enviar para SEFAZ
    const resultado = await cte.enviar(xmlAssinado);
    
    if (resultado.status === 'autorizado') {
      // 5. Salvar no banco
      await db('quotations').where('id', quotation.id).update({
        cte_key: resultado.chave,
        cte_protocol: resultado.protocolo,
        cte_issued_at: new Date(),
        cte_xml: xmlAssinado,
        updated_at: new Date()
      });
      
      // 6. Gerar DACTE
      const dacte = await cte.gerarDACTE(xmlAssinado);
      
      // 7. Verificar divergência de valor
      await checkAndAdjustCTeValue(quotation.id, quotation.final_value);
      
      return {
        chave: resultado.chave,
        protocolo: resultado.protocolo,
        dacte_url: dacte.url
      };
    } else {
      throw new Error(`CT-e rejeitado: ${resultado.motivo}`);
    }
  } catch (error) {
    logger.error('Erro ao emitir CT-e', error);
    throw error;
  }
}
```

**Cancelamento de CT-e:**

```typescript
async function cancelCTe(cteKey: string, reason: string) {
  const resultado = await cte.cancelar({
    chave: cteKey,
    protocolo: quotation.cte_protocol,
    justificativa: reason // Mínimo 15 caracteres
  });
  
  if (resultado.status === 'cancelado') {
    await db('quotations')
      .where('cte_key', cteKey)
      .update({
        cte_canceled: true,
        cte_cancel_reason: reason,
        cte_canceled_at: new Date()
      });
  }
  
  return resultado;
}
```

### 2.2 Emissão de NF-e

**Similar ao CT-e, usando modelo 55:**

```typescript
import { NFe } from 'node-dfe';

const nfe = new NFe({
  ambiente: process.env.NFE_AMBIENTE,
  estado: carrier.state,
  certificado: { /* mesmo certificado */ }
});

async function emitNFe(quotation: Quotation, carrier: Carrier) {
  const nfeData = {
    versao: '4.00',
    ide: {
      cUF: carrier.state_code,
      natOp: 'Prestação de serviço de transporte',
      mod: '55', // Modelo 55 = NF-e
      serie: '1',
      nNF: await getNextNFeNumber(carrier.id),
      dhEmi: new Date().toISOString(),
      tpNF: '1', // 1 = Saída
      idDest: '1', // 1 = Operação interna
      tpImp: '1', // 1 = DANFE Retrato
      tpEmis: '1', // 1 = Normal
      tpAmb: process.env.NFE_AMBIENTE,
      finNFe: '1', // 1 = Normal
      indFinal: '0', // 0 = Normal (não é consumidor final)
      indPres: '2' // 2 = Internet
    },
    emit: { /* dados do emitente (transportadora) */ },
    dest: { /* dados do destinatário (embarcador) */ },
    det: [
      {
        nItem: '1',
        prod: {
          cProd: 'SERV-TRANSP',
          cEAN: 'SEM GTIN',
          xProd: 'Serviço de transporte de cargas',
          NCM: '00000000',
          cEANTrib: 'SEM GTIN',
          uTrib: 'UN',
          qTrib: '1',
          vUnTrib: quotation.carrier_net_amount,
          indTot: '1' // 1 = Compõe total da NF-e
        },
        imposto: {
          vTotTrib: quotation.carrier_net_amount * 0.02, // Estimativa
          ISS QN: {
            vBC: quotation.carrier_net_amount,
            vAliq: 2.00,
            vISSQN: quotation.carrier_net_amount * 0.02,
            cMunFG: carrier.city_code
          }
        }
      }
    ],
    total: {
      ICMSTot: {
        vBC: 0,
        vICMS: 0,
        vNF: quotation.carrier_net_amount
      }
    },
    infAdic: {
      infCpl: `Ref. Cotação #${quotation.sequential_number}. CT-e: ${quotation.cte_key}`
    }
  };
  
  // Processo similar ao CT-e
  const xml = await nfe.gerarXML(nfeData);
  const xmlAssinado = await nfe.assinarXML(xml);
  const resultado = await nfe.enviar(xmlAssinado);
  
  if (resultado.status === 'autorizado') {
    await db('quotations').where('id', quotation.id).update({
      nfe_key: resultado.chave,
      nfe_protocol: resultado.protocolo,
      nfe_issued_at: new Date()
    });
    
    const danfe = await nfe.gerarDANFE(xmlAssinado);
    return { chave: resultado.chave, danfe_url: danfe.url };
  }
}
```

## 3. ANTT (Emissão de CIOT)

### 3.1 API do CIOT

**Documentação:** https://www.antt.gov.br/ciot/api

**Autenticação:**

```typescript
import axios from 'axios';

const anttAPI = axios.create({
  baseURL: 'https://api.antt.gov.br/ciot/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.ANTT_API_KEY}`
  }
});
```

**Emitir CIOT:**

```typescript
async function emitCIOT(quotation: Quotation, carrier: Carrier, vehicle: Vehicle) {
  // Validações
  if (!carrier.is_autonomous || !carrier.has_ciot) {
    throw new Error('Transportadora não está habilitada para CIOT');
  }
  
  if (!quotation.payment_confirmed) {
    throw new Error('Pagamento deve ser confirmado antes de emitir CIOT');
  }
  
  const ciotData = {
    operacao: {
      cpf_motorista: vehicle.driver_cpf,
      placa_veiculo: vehicle.plate,
      renavam: vehicle.renavam,
      rntrc: carrier.antt_rntrc
    },
    contratante: {
      tipo_documento: quotation.shipper.cnpj ? 'CNPJ' : 'CPF',
      documento: quotation.shipper.cnpj || quotation.shipper.cpf,
      nome: quotation.shipper.company_name || quotation.shipper.full_name
    },
    percurso: {
      origem: {
        municipio: quotation.pickup_address.city,
        uf: quotation.pickup_address.state
      },
      destino: {
        municipio: quotation.delivery_address.city,
        uf: quotation.delivery_address.state
      }
    },
    carga: {
      descricao: quotation.product.description,
      peso_kg: quotation.total_weight,
      valor_nota_fiscal: quotation.invoice_value,
      numero_nota_fiscal: quotation.invoice_number
    },
    valores: {
      valor_frete: quotation.final_value,
      forma_pagamento: 'CREDITO_CONTA', // Sempre antecipado
      data_pagamento: format(new Date(), 'yyyy-MM-dd')
    }
  };
  
  try {
    const response = await anttAPI.post('/emitir', ciotData);
    
    if (response.data.sucesso) {
      const ciotCode = response.data.codigo_ciot;
      const validUntil = parse(response.data.validade, 'yyyy-MM-dd', new Date());
      
      await db('quotations').where('id', quotation.id).update({
        ciot_code: ciotCode,
        ciot_issued_at: new Date(),
        ciot_valid_until: validUntil,
        updated_at: new Date()
      });
      
      return {
        codigo: ciotCode,
        validade: validUntil,
        protocolo: response.data.protocolo
      };
    } else {
      throw new Error(`Erro ANTT: ${response.data.mensagem}`);
    }
  } catch (error) {
    logger.error('Erro ao emitir CIOT', error);
    throw error;
  }
}
```

**Consultar CIOT:**

```typescript
async function consultCIOT(ciotCode: string) {
  const response = await anttAPI.get(`/consultar/${ciotCode}`);
  return response.data;
}
```

**Cancelar CIOT:**

```typescript
async function cancelCIOT(ciotCode: string, reason: string) {
  const response = await anttAPI.post('/cancelar', {
    codigo_ciot: ciotCode,
    motivo: reason
  });
  
  if (response.data.sucesso) {
    await db('quotations')
      .where('ciot_code', ciotCode)
      .update({
        ciot_canceled: true,
        ciot_cancel_reason: reason,
        ciot_canceled_at: new Date()
      });
  }
  
  return response.data;
}
```

## 4. Geolocalização e Mapas

### 4.1 Google Maps API

**Geocoding (Endereço → Coordenadas):**

```typescript
import { Client } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

async function geocodeAddress(address: Address) {
  const response = await mapsClient.geocode({
    params: {
      address: `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.postal_code}`,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });
  
  if (response.data.results.length > 0) {
    const location = response.data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  }
  
  throw new Error('Endereço não encontrado');
}
```

**Calcular Distância e Tempo:**

```typescript
async function calculateRoute(origin: Address, destination: Address) {
  const response = await mapsClient.distancematrix({
    params: {
      origins: [`${origin.latitude},${origin.longitude}`],
      destinations: [`${destination.latitude},${destination.longitude}`],
      mode: 'driving',
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });
  
  const element = response.data.rows[0].elements[0];
  
  return {
    distance_km: element.distance.value / 1000,
    duration_minutes: element.duration.value / 60,
    distance_text: element.distance.text,
    duration_text: element.duration.text
  };
}
```

### 4.2 Mapbox (Alternativa)

```typescript
import mapbox from '@mapbox/mapbox-sdk/services/geocoding';
import directions from '@mapbox/mapbox-sdk/services/directions';

const geocodingClient = mapbox({ accessToken: process.env.MAPBOX_TOKEN });
const directionsClient = directions({ accessToken: process.env.MAPBOX_TOKEN });
```

## 5. Notificações

### 5.1 Email (Resend)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendQuotationAcceptedEmail(quotation: Quotation, carrier: Carrier) {
  await resend.emails.send({
    from: 'Achei Meu Frete <noreply@acheimeufrete.com.br>',
    to: carrier.email,
    subject: `Proposta Aceita - Cotação #${quotation.sequential_number}`,
    html: renderEmailTemplate('quotation-accepted', {
      carrier_name: carrier.company_name,
      quotation_number: quotation.sequential_number,
      pickup_address: quotation.pickup_address,
      delivery_address: quotation.delivery_address,
      pickup_datetime: quotation.pickup_datetime,
      value: quotation.final_value
    })
  });
}
```

### 5.2 SMS (Twilio)

```typescript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendDeliveryConfirmationSMS(quotation: Quotation, shipper: Shipper) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: shipper.phone,
    body: `Sua mercadoria foi entregue! Cotação #${quotation.sequential_number}. Não esqueça de avaliar o serviço.`
  });
}
```

### 5.3 WhatsApp (Twilio)

```typescript
async function sendWhatsAppNotification(phone: string, message: string) {
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phone}`,
    body: message
  });
}
```

### 5.4 Push Notifications (Expo)

```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(deviceToken: string, notification: any) {
  const messages = [{
    to: deviceToken,
    sound: 'default',
    title: notification.title,
    body: notification.message,
    data: notification.data
  }];
  
  const chunks = expo.chunkPushNotifications(messages);
  
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
```

## 6. Armazenamento de Arquivos

### 6.1 AWS S3 / Cloudflare R2

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function uploadFile(file: Buffer, filename: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `documents/${filename}`,
    Body: file,
    ContentType: contentType,
    ACL: 'private'
  });
  
  await s3Client.send(command);
  
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/documents/${filename}`;
}

async function uploadCTeXML(quotation: Quotation, xml: string) {
  const filename = `cte-${quotation.sequential_number}-${Date.now()}.xml`;
  const buffer = Buffer.from(xml, 'utf-8');
  
  const url = await uploadFile(buffer, filename, 'application/xml');
  
  await db('quotations').where('id', quotation.id).update({
    cte_xml_url: url
  });
  
  return url;
}
```

## 7. Monitoramento e Logs

### 7.1 Better Stack (Logs)

```typescript
import { createLogger, transports, format } from 'winston';
import { LogtailTransport } from '@logtail/winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new LogtailTransport({
      sourceToken: process.env.LOGTAIL_SOURCE_TOKEN
    })
  ]
});

export default logger;
```

### 7.2 Sentry (Erro Tracking)

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Capturar erros
try {
  await emitCTe(quotation, carrier);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      quotation_id: quotation.id,
      carrier_id: carrier.id
    }
  });
  throw error;
}
```

## Resumo das Integrações

| Serviço | Propósito | Prioridade |
|---------|-----------|------------|
| InfinitePay | Pagamentos (PIX, Cartão, Boleto) | ⚠️ Crítico |
| SEFAZ | Emissão CT-e e NF-e | ⚠️ Crítico |
| ANTT | Emissão CIOT | ⚠️ Crítico (autônomos) |
| Google Maps | Geolocalização e rotas | 🔸 Importante |
| Resend | Emails transacionais | 🔸 Importante |
| Twilio | SMS e WhatsApp | 🔹 Opcional |
| AWS S3 | Armazenamento de documentos | 🔸 Importante |
| Better Stack | Logs e monitoramento | 🔸 Importante |
| Sentry | Error tracking | 🔸 Importante |

Todas as credenciais devem ser armazenadas em variáveis de ambiente e NUNCA commitadas no código.

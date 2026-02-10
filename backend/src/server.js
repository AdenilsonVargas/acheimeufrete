import clienteRoutes from './routes/clienteRoutes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initializeWebSocket } from './websocket/socketHandler.js';
import authRoutes from './routes/authRoutes.js';
import cotacaoRoutes from './routes/cotacaoRoutes.js';
import respostaRoutes from './routes/respostaRoutes.js';
import enderecoRoutes from './routes/enderecoRoutes.js';
import enderecoColetaRoutes from './routes/enderecoColetaRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import destinatarioRoutes from './routes/destinatarioRoutes.js';
import ncmRoutes from './routes/ncmRoutes.js';
import ncmAtendidoRoutes from './routes/ncmAtendidoRoutes.js';
import regioesRoutes from './routes/regioesRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import cotacaoChatRoutes from './routes/cotacaoChatRoutes.js';
import pagamentoRoutes from './routes/pagamentoRoutes.js';
import avaliacaoRoutes from './routes/avaliacaoRoutes.js';
import financeiroRoutes from './routes/financeiroRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import perfilRoutes from './routes/perfilRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import cotacaoFavoritaRoutes from './routes/cotacaoFavoritaRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';

dotenv.config();

// Carregar configurações centralizadas
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.config do diretório raiz
try {
  const configPath = join(__dirname, '../../.env.config');
  const configContent = readFileSync(configPath, 'utf8');
  const lines = configContent.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
  
  console.log('✅ Configurações centralizadas carregadas de .env.config');
} catch (error) {
  console.warn('⚠️  Arquivo .env.config não encontrado, usando configurações padrão');
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO FIXA DE PORTAS - NÃO MODIFICAR                ║
// ║  As portas são definidas no arquivo .env.config             ║
// ║  Sistema configurado para funcionar como em produção        ║
// ╚══════════════════════════════════════════════════════════════╝

const app = express();

// Porta fixa (não pode ser alterada)
const BACKEND_PORT = process.env.BACKEND_PORT || '5000';
const PORT = parseInt(BACKEND_PORT);

// Validar se a porta configurada está correta
if (process.env.STRICT_PORT_CHECK === 'true' && PORT !== 5000) {
  console.error('❌ ERRO: Porta do backend deve ser 5000!');
  console.error('❌ Verifique o arquivo .env.config');
  process.exit(1);
}

console.log(`🔒 Sistema configurado com porta fixa: ${PORT}`);

// CORS - Apenas portas autorizadas
// ⚠️ ATENÇÃO: Esta configuração é FIXA e não pode ser alterada
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',  // Frontend (Vite) - PORTA FIXA
      'https://localhost:3000', // Frontend HTTPS (Codespaces)
      'http://localhost:5173',  // Vite (porta padrão alternativa)
      'https://localhost:5173', // Vite HTTPS (Codespaces)
    ];

// Adicionar automaticamente origens do Codespaces se detectado
const CODESPACE_NAME = process.env.CODESPACE_NAME;
if (CODESPACE_NAME) {
  const codespaceUrl = `https://${CODESPACE_NAME}-3000.app.github.dev`;
  ALLOWED_ORIGINS.push(codespaceUrl);
  console.log('🌐 Codespace detectado, adicionando origem:', codespaceUrl);
}

console.log('🔒 CORS configurado para:', ALLOWED_ORIGINS.join(', '));

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origem (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verificar se a origem está na lista permitida
    const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
      // Permitir match exato
      if (origin === allowedOrigin) return true;
      
      // Permitir Codespaces com qualquer porta (para desenvolvimento)
      if (origin.includes('.app.github.dev') || origin.includes('preview.app.github.dev')) {
        return true;
      }
      
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Origem bloqueada pelo CORS: ${origin}`);
      console.warn(`✅ Origens permitidas: ${ALLOWED_ORIGINS.join(', ')}`);
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cotacoes', cotacaoRoutes);
app.use('/api/cotacoes-favoritas', cotacaoFavoritaRoutes);
app.use('/api/respostas', respostaRoutes);
app.use('/api/enderecos', enderecoRoutes);
app.use('/api/enderecos-coleta', enderecoColetaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/destinatarios', destinatarioRoutes);
app.use('/api/ncms', ncmRoutes);
app.use('/api/ncm-atendido', ncmAtendidoRoutes);
app.use('/api/regioes', regioesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-cotacao', cotacaoChatRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/metrics', metricsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
  });
});

// Iniciar servidor HTTP com Socket.io
const server = http.createServer(app);

// Inicializar WebSocket (Socket.io)
try {
  initializeWebSocket(server);
  console.log('✅ WebSocket (Socket.io) inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar WebSocket:', error);
}

server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  BACKEND INICIADO - ACHEI MEU FRETE                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 API disponível em http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}`);
  console.log('');
  console.log('🔒 SEGURANÇA:');
  console.log(`   • Porta FIXA: ${PORT} (não pode ser alterada)`);
  console.log(`   • CORS habilitado para:`);
  ALLOWED_ORIGINS.forEach(origin => {
    console.log(`     - ${origin}`);
  });
  console.log('   • Origens não autorizadas serão bloqueadas');
  console.log('');
  console.log('📊 BANCO DE DADOS:');
  console.log(`   • PostgreSQL: localhost:5432`);
  console.log(`   • Database: acheimeufrete`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

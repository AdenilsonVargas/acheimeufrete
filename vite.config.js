import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO FIXA DE PORTAS - NÃO MODIFICAR                ║
// ║  As portas são definidas no arquivo .env.config             ║
// ║  Qualquer alteração aqui será ignorada pelo sistema         ║
// ╚══════════════════════════════════════════════════════════════╝

// Carregar configurações do .env.config
let FRONTEND_PORT = 3000;
let BACKEND_PORT = 5000;

try {
  const configPath = path.resolve(__dirname, '.env.config');
  const configContent = readFileSync(configPath, 'utf8');
  const lines = configContent.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key === 'FRONTEND_PORT') FRONTEND_PORT = parseInt(value);
      if (key === 'BACKEND_PORT') BACKEND_PORT = parseInt(value);
    }
  });
  
  console.log(`✅ Configurações carregadas: Frontend=${FRONTEND_PORT}, Backend=${BACKEND_PORT}`);
} catch (error) {
  console.warn('⚠️  Usando configurações padrão (Frontend=3000, Backend=5000)');
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: FRONTEND_PORT,
    strictPort: true, // Falha se a porta estiver ocupada (não muda automaticamente)
    host: true, // Permite acesso externo
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        
        onProxyReq: (proxyReq, req, res) => {
          console.log(`📤 Proxy: ${req.method} ${req.url} → http://localhost:${BACKEND_PORT}`);
        },
        
        onError: (err, req, res) => {
          console.error(`❌ Erro ao conectar ao backend em localhost:${BACKEND_PORT}`);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Backend temporariamente indisponível',
            message: `Certifique-se de que o backend está rodando em http://localhost:${BACKEND_PORT}`
          }));
        }
      },
    },
  },
})

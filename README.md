# Achei Meu Frete 🚚

Uma plataforma moderna para conectar transportadores e embarcadores, facilitando a busca e o gerenciamento de fretes.

## 📋 Sobre o Projeto

O **Achei Meu Frete** é uma solução desenvolvida para otimizar o processo de encontrar e gerenciar fretes, conectando quem precisa transportar mercadorias com transportadores disponíveis de forma rápida e eficiente.

## 🚀 Funcionalidades Planejadas

- Busca inteligente de fretes disponíveis
- Cadastro de transportadores e embarcadores
- Sistema de avaliação e reputação
- Rastreamento de cargas
- Gestão de documentos e contratos
- Dashboard com métricas e relatórios

## 🛠️ Tecnologias

### Backend
- **Node.js** com Express/Fastify ou **Python** com FastAPI
- **PostgreSQL** - Banco de dados relacional (principal)
- **Redis** - Cache e sessões
- **JWT** - Autenticação e autorização

### Frontend
- React/Next.js ou Vue/Nuxt.js
- Tailwind CSS para estilização
- Axios para requisições HTTP

### DevOps
- Docker para containerização
- GitHub Actions para CI/CD
- Monitoramento e logging estruturado

## 📦 Estrutura do Projeto

```
acheimeufrete/
├── docs/                    # Documentação do projeto
│   ├── technical/           # Documentação técnica
│   │   ├── API_DESIGN.md    # Padrões de design da API
│   │   ├── DATABASE.md      # Boas práticas de banco de dados
│   │   ├── DATABASE_SCHEMA.md # Schema completo do banco
│   │   └── BUSINESS_RULES.md  # Regras de negócio críticas
│   └── PROJECT_STRUCTURE.md # Arquitetura e organização
├── src/                     # Código fonte da aplicação
├── tests/                   # Testes automatizados
└── README.md                # Este arquivo
```

## 📚 Documentação Técnica Completa

### 📖 Documentos Essenciais (Leia ANTES de Desenvolver)

- **[Fluxos Completos de Negócio](docs/technical/COMPLETE_BUSINESS_FLOWS.md)** ⭐ **ESSENCIAL** - Processos end-to-end detalhados:
  - Fluxo completo de cotação (criação → pagamento → entrega → avaliação)
  - Emissão de CIOT para transportadores autônomos
  - Emissão de CT-e com certificado digital e ajuste automático de valor
  - Emissão de NF-e de serviço
  - Processamento de pagamentos (InfinitePay, boleto)
  - Sistema de avaliações obrigatórias
  - Jobs automatizados (cron)

- **[Guia de Integrações](docs/technical/INTEGRATIONS.md)** ⭐ **ESSENCIAL** - Integrações com sistemas externos:
  - InfinitePay (pagamentos PIX, cartão, boleto)
  - SEFAZ (CT-e e NF-e)
  - ANTT (CIOT)
  - Google Maps / Mapbox (geolocalização)
  - Resend / Twilio (notificações)
  - AWS S3 / Cloudflare R2 (arquivos)
  - Better Stack / Sentry (monitoramento)

### 🏗️ Documentação de Arquitetura e Implementação

- **[Visão Geral da Arquitetura](docs/technical/OVERVIEW.md)** - Stack tecnológica moderna 2026, arquitetura 3 camadas, fluxos principais
- **[API Design](docs/technical/API_DESIGN.md)** - Padrões RESTful, JWT, rate limiting, validação com Zod, endpoints documentados
- **[Database Best Practices](docs/technical/DATABASE.md)** - PostgreSQL + Redis, índices críticos, transações, otimização de queries
- **[Database Schema](docs/technical/DATABASE_SCHEMA.md)** - Schema completo: tabelas, relacionamentos, constraints, indexes, triggers
- **[Business Rules](docs/technical/BUSINESS_RULES.md)** - State machine, cálculos financeiros (5% taxa), pagamentos, avaliações obrigatórias
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Arquitetura geral e organização do código

> 💡 **Para Desenvolvedores:** 
> 1. **SEMPRE** leia os documentos de **Fluxos Completos** e **Integrações** ANTES de implementar
> 2. Estes documentos garantem compreensão total do negócio e evitam retrabalho
> 3. Todos os fluxos incluem código de exemplo pronto para uso

## 🤝 Como Contribuir

Contribuições são sempre bem-vindas! Por favor, leia o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre o processo de contribuição.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

Para mais informações, entre em contato através do repositório do projeto.

---

**Status**: Em desenvolvimento inicial 🔧
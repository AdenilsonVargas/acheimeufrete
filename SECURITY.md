# Política de Segurança

## Versões Suportadas

Atualmente, como o projeto está em desenvolvimento inicial, todas as atualizações de segurança serão aplicadas à versão principal (main branch).

| Versão | Suportada          |
| ------ | ------------------ |
| main   | :white_check_mark: |

## Reportando uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança, por favor, **NÃO** abra uma issue pública.

### Como Reportar

1. Envie um email para o mantenedor do projeto com detalhes da vulnerabilidade
2. Inclua informações sobre:
   - Tipo de vulnerabilidade
   - Localização do código afetado
   - Passos para reproduzir
   - Possível impacto
   - Sugestões de correção (se houver)

### O que esperar

- **Confirmação**: Você receberá uma confirmação do recebimento em até 48 horas
- **Avaliação**: A vulnerabilidade será avaliada dentro de 5 dias úteis
- **Correção**: Se confirmada, trabalharemos para corrigir o problema o mais rápido possível
- **Crédito**: Com sua permissão, você será creditado pela descoberta quando a correção for publicada

## Boas Práticas de Segurança

### Para Desenvolvedores

1. **Nunca** commite senhas, chaves de API ou tokens
2. Use variáveis de ambiente para informações sensíveis
3. Mantenha dependências atualizadas
4. Revise código antes de fazer merge
5. Execute testes de segurança regularmente

### Dependências

- Mantenha todas as dependências atualizadas
- Use apenas pacotes de fontes confiáveis
- Revise alterações em dependências antes de atualizar
- Use ferramentas de análise de vulnerabilidades (npm audit, pip check, etc.)

### Dados Sensíveis

- Nunca armazene dados sensíveis em plain text
- Use criptografia forte para dados em repouso
- Use HTTPS/TLS para dados em trânsito
- Implemente controle de acesso baseado em roles

## Política de Divulgação

Quando uma vulnerabilidade é corrigida:

1. A correção é aplicada ao código
2. Uma versão atualizada é lançada
3. A vulnerabilidade é documentada (se apropriado)
4. Usuários são notificados sobre a necessidade de atualização

---

Obrigado por ajudar a manter o Achei Meu Frete seguro! 🔒

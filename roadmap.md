# Delux Liquid Glass

## Ajustes pontuais de movimento
- [x] Corrigir rolagem das barras e transições essenciais, sem alterar regras ou integrações.
- [x] Executar teste de rota (1 aprovado) e verificar em navegador: barras com rolagem lenta, topo, troca de aba, menu/assistente abrindo e fechando, redução de movimento e navegação desktop. Sem erros de execução; build automático OK. Gemini não foi chamado.

- [x] Aplicar tokens de vidro e estados de interação sem alterar lógica.
- [x] Atualizar navegação móvel/desktop e superfícies de modais, menu e assistente.
- [ ] Verificar testes, lint, compilação e fluxos em celular e desktop.

## Ajuste complementar

- Corrigido o espaçamento superior do conteúdo mobile para respeitar a altura do cabeçalho Liquid Glass e a safe area de dispositivos com recorte/notch.
- A validação de build/lint e os testes visuais ainda precisam ser executados no ambiente do projeto Lovable; não marcar como concluídos até confirmar.

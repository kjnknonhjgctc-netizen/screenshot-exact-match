// Ported from the original Delux server (tool + prompt definitions).
export const DELUX_SYSTEM_INSTRUCTION = `Você é o assistente especialista em planejamento e execução do Pixel Perfect Replay.

MISSÃO
Transforme qualquer objetivo do usuário em um plano específico, progressivo, detalhado e executável. Não entregue apenas conselhos ou listas genéricas: ensine exatamente como executar cada etapa, de acordo com a natureza do objetivo. Cada domínio exige sua própria metodologia; nunca force todos os objetivos a seguirem o mesmo modelo.

COMO ENTENDER O OBJETIVO
- Identifique o resultado concreto desejado, o nível atual, a experiência, os recursos, as restrições, o prazo e a disponibilidade.
- Pergunte apenas o que for essencial e ainda não estiver no contexto. Faça até 3 perguntas curtas por vez.
- Não invente recursos, habilidades, orçamento, ferramentas ou disponibilidade que o usuário não informou.
- Se o pedido já estiver suficientemente claro, avance sem fazer perguntas repetidas.

COMO CONSTRUIR UM PLANO
- Descubra a sequência real de etapas necessária para aquele objetivo específico.
- Divida o percurso em 6 a 14 etapas sequenciais, concretas e úteis. Não force etapas artificiais.
- Cada etapa deve explicar, em linguagem simples, o que fazer e COMO fazer: ações em ordem, materiais ou ferramentas pertinentes, exemplos, quantidades ou entregáveis quando aplicáveis, erros comuns e como verificar o resultado.
- A profundidade deve ser proporcional à complexidade. Não use tarefas vagas como estudar, pesquisar, praticar ou melhorar sem explicar exatamente o que a pessoa deve fazer.
- Cada etapa deve ter título específico, instrução prática detalhada e duração estimada em minutos.
- Respeite pré-requisitos e progressão. Não coloque atividades avançadas antes dos fundamentos necessários.
- Exemplos de um domínio são apenas demonstrações de nível de detalhe, nunca modelos universais para outros objetivos.
- Não invente fatos técnicos. Quando informações atuais ou ferramentas específicas forem necessárias e não estiverem disponíveis, sinalize a incerteza em vez de adivinhar.
- Não prometa resultados garantidos. Defina critérios de conclusão observáveis.

INTEGRAÇÃO COM O APLICATIVO — OBRIGATÓRIA
- Quando o usuário pedir para criar, montar, estruturar ou transformar um objetivo em um plano para acompanhar no aplicativo, DEVE chamar create_goal depois de esclarecer as informações essenciais.
- Não entregue somente um plano em texto quando o usuário pediu para criar um plano no aplicativo.
- A chamada create_goal é uma PROPOSTA. Inclua todas as etapas detalhadas no campo steps, além de title, category, reason, deadline, summary e replyMessage quando aplicáveis.
- Nunca diga que o plano foi criado antes de o usuário aprovar a ação na interface.
- Se create_goal não puder ser chamada ou se os dados estiverem incompletos, explique claramente o que faltou. Nunca finja que a integração aconteceu.
- Não divida um único plano em várias ações create_task independentes. Use create_goal para criar a meta e todas as etapas em uma única proposta.
- A interface deve mostrar a proposta e o botão Aprovar e aplicar. Só depois dessa aprovação a aplicação deverá criar a meta e as tarefas correspondentes.
- Depois da aprovação, as tarefas precisam ser gravadas no estado do aplicativo e aparecer no Planejamento e no Calendário, com instruções preservadas.
- Se o usuário apenas pedir explicações, ideias ou orientações sem solicitar criação no aplicativo, responda em texto e não crie uma meta automaticamente.

PODERES DE CONTROLE
Você pode propor ações estruturadas que o usuário aprovará explicitamente: reagendar tarefas, criar tarefas isoladas, atualizar/concluir/reabrir/excluir tarefas, ajustar rotina, criar objetivos completos por create_goal e replanejar objetivos existentes.

REGRAS DE EXECUÇÃO
- SEMPRE respeite os dias disponíveis e o tempo diário do usuário. Nunca programe em dia bloqueado.
- Não crie conflitos com tarefas existentes.
- Para criar um objetivo, não chame create_goal enquanto faltarem informações essenciais.
- Para cada etapa, forneça título claro, instrução detalhada e duração estimada. Use 6 a 14 etapas úteis, sem repetição artificial.
- Cada duração deve caber no limite diário informado. Se uma atividade exigir mais tempo, divida-a em sessões sequenciais.
- Use datas YYYY-MM-DD e horários HH:mm quando aplicável.
- Para tarefas existentes, utilize o ID exato informado no contexto. Nunca invente IDs.
- Para datas relativas, calcule a partir da data atual fornecida no contexto.
- No replyMessage, escreva em Português do Brasil e explique que se trata de uma proposta ainda não aplicada.
- Se nenhuma ferramenta for necessária, responda diretamente.
- Nunca afirme que uma tarefa, meta ou evento foi criado, alterado ou sincronizado antes de a aplicação confirmar a operação.`;

export type ToolDecl = { name: string; description: string; parameters: Record<string, unknown> };
export const assistantTools: ToolDecl[] = [
  {
    name: 'reschedule_task',
    description: 'Reagenda uma etapa/tarefa específica para uma data (YYYY-MM-DD) que obrigatoriamente deve cair em um dos dias disponíveis do usuário; nunca escolha dia bloqueado. Opcionalmente um horário de início (HH:mm, ex: "09:00", "14:30"). Use sempre que o usuário pedir para adiar, antecipar, mudar de dia ou marcar horário para uma tarefa.',
    parameters: {
      type: "OBJECT",
      properties: {
        taskId: {
          type: "STRING",
          description: 'O ID exato da tarefa (ex: "task_goal_1", "task_1")',
        },
        newDate: {
          type: "STRING",
          description: 'A nova data de execução no formato YYYY-MM-DD',
        },
        newTime: {
          type: "STRING",
          description: 'Horário sugerido no formato HH:mm (ex: "08:30", "15:00", "20:00"). Opcional.',
        },
        summary: {
          type: "STRING",
          description: 'Frase curta explicando o reagendamento (ex: "Reagendada para quarta-feira, 28/10 às 15:00")',
        },
        replyMessage: {
          type: "STRING",
          description: 'Mensagem simpática e encorajadora para o usuário explicando o reagendamento efetuado',
        },
      },
      required: ['taskId', 'newDate', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'batch_reschedule_tasks',
    description: 'Reagenda múltiplas tarefas em lote somente para datas que caiam em dias disponíveis do usuário; descarte qualquer data em dia bloqueado. Para novos dias ou horários (ex: empurrar toda a rotina em 1 dia, passar tarefas de fim de semana para a semana, etc.).',
    parameters: {
      type: "OBJECT",
      properties: {
        updates: {
          type: "ARRAY",
          description: 'Lista de tarefas e suas novas datas/horários',
          items: {
            type: "OBJECT",
            properties: {
              taskId: { type: "STRING", description: 'ID da tarefa' },
              newDate: { type: "STRING", description: 'Nova data YYYY-MM-DD' },
              newTime: { type: "STRING", description: 'Novo horário HH:mm (opcional)' },
            },
            required: ['taskId', 'newDate'],
          },
        },
        summary: {
          type: "STRING",
          description: 'Resumo das alterações em lote',
        },
        replyMessage: {
          type: "STRING",
          description: 'Mensagem amigável explicando o reagendamento em lote aplicado',
        },
      },
      required: ['updates', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa no app somente em um dia disponível do usuário, com dia e horário definidos pelo usuário ou sugeridos pela IA. Nunca crie em dia bloqueado.',
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: 'Título claro e objetivo da etapa' },
        instruction: { type: "STRING", description: 'Dica prática de como executar' },
        date: { type: "STRING", description: 'Data YYYY-MM-DD' },
        time: { type: "STRING", description: 'Horário HH:mm (opcional, ex: "14:00")' },
        durationMinutes: { type: "NUMBER", description: 'Duração estimada em minutos' },
        goalId: { type: "STRING", description: 'ID da meta a qual pertence (se houver)' },
        summary: { type: "STRING", description: 'Resumo da criação' },
        replyMessage: { type: "STRING", description: 'Mensagem amigável de confirmação da nova etapa' },
      },
      required: ['title', 'date', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'update_task',
    description: 'Modifica detalhes de uma tarefa existente (título, instrução, data, horário ou duração). Se alterar a data, use somente dia disponível.',
    parameters: {
      type: "OBJECT",
      properties: {
        taskId: { type: "STRING", description: 'ID da tarefa' },
        title: { type: "STRING", description: 'Novo título (opcional)' },
        instruction: { type: "STRING", description: 'Nova instrução (opcional)' },
        date: { type: "STRING", description: 'Nova data YYYY-MM-DD (opcional)' },
        time: { type: "STRING", description: 'Novo horário HH:mm (opcional)' },
        durationMinutes: { type: "NUMBER", description: 'Nova duração em minutos (opcional)' },
        summary: { type: "STRING", description: 'Resumo das mudanças' },
        replyMessage: { type: "STRING", description: 'Mensagem amigável explicando o ajuste' },
      },
      required: ['taskId', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'toggle_task_completion',
    description: 'Marca uma tarefa como concluída ou reabre uma tarefa.',
    parameters: {
      type: "OBJECT",
      properties: {
        taskId: { type: "STRING", description: 'ID da tarefa' },
        completed: { type: "BOOLEAN", description: 'true para concluir, false para reabrir' },
        summary: { type: "STRING", description: 'Resumo da alteração' },
        replyMessage: { type: "STRING", description: 'Mensagem de parabéns ou incentivo' },
      },
      required: ['taskId', 'completed', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'delete_task',
    description: 'Exclui uma tarefa indesejada do plano.',
    parameters: {
      type: "OBJECT",
      properties: {
        taskId: { type: "STRING", description: 'ID da tarefa a excluir' },
        summary: { type: "STRING", description: 'Motivo da exclusão' },
        replyMessage: { type: "STRING", description: 'Confirmação simpática da exclusão' },
      },
      required: ['taskId', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'adjust_routine_days_and_time',
    description: 'Ajusta a rotina semanal do usuário: quais dias da semana estão disponíveis para tarefas, quantos minutos por dia, horário preferido e ritmo.',
    parameters: {
      type: "OBJECT",
      properties: {
        availableDays: {
          type: "ARRAY",
          description: 'Dias da semana disponíveis como números: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado',
          items: { type: "NUMBER" },
        },
        dailyMinutes: {
          type: "NUMBER",
          description: 'Tempo diário disponível em minutos (ex: 15, 25, 30, 45, 60)',
        },
        preferredTime: {
          type: "STRING",
          description: 'Período preferido: "morning", "afternoon" ou "evening"',
        },
        rhythm: {
          type: "STRING",
          description: 'Ritmo: "light", "balanced" ou "intense"',
        },
        summary: {
          type: "STRING",
          description: 'Resumo das alterações de rotina',
        },
        replyMessage: {
          type: "STRING",
          description: 'Mensagem amigável explicando a nova rotina aplicada',
        },
      },
      required: ['summary', 'replyMessage'],
    },
  },
  {
    name: 'create_goal',
    description: 'Propõe a criação de um objetivo somente depois de esclarecer o resultado esperado e as restrições. Inclua um plano concreto dividido em etapas; a criação só será efetivada após aprovação explícita do usuário.',
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: 'Título específico do objetivo' },
        category: {
          type: "STRING",
          description: 'Categoria da meta: Estudos, Carreira, Saúde e condicionamento, Criatividade, Finanças pessoais, Hábitos, Projetos pessoais ou Outros',
        },
        reason: { type: "STRING", description: 'Motivação e resultado esperado (opcional)' },
        deadline: { type: "STRING", description: 'Data final do plano YYYY-MM-DD, calculada a partir de durationDays se o usuário não informar uma data exata' },
        durationDays: { type: "NUMBER", description: 'Duração total escolhida pelo usuário: no mínimo 30 dias e no máximo 365. Pergunte quantos dias deseja se não estiver claro; nunca escolha prazo inferior a 30 dias.' },
        steps: {
          type: "ARRAY",
          description: 'OBRIGATÓRIO: 6 a 14 etapas sequenciais, específicas e detalhadas. Cada etapa deve ensinar exatamente como executar a ação, com passos práticos, ferramentas pertinentes, exemplos, possíveis erros e critério de conclusão quando aplicável. Não use títulos vagos. Cada sessão deve caber no limite diário do usuário.',
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: 'Ação específica e executável' },
              instruction: { type: "STRING", description: 'Passo a passo e critério de conclusão' },
              durationMinutes: { type: "NUMBER", description: 'Duração estimada em minutos, respeitando o limite diário' },
            },
            required: ['title', 'instruction', 'durationMinutes'],
          },
        },
        summary: { type: "STRING", description: 'Resumo do plano proposto' },
        replyMessage: { type: "STRING", description: 'Mensagem amigável apresentando a proposta, sem afirmar que foi criada' },
      },
      required: ['title', 'category', 'durationDays', 'steps', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'replan_goal',
    description: 'Replaneja e redistribui automaticamente todas as etapas pendentes de uma meta nos dias da semana disponíveis.',
    parameters: {
      type: "OBJECT",
      properties: {
        goalId: { type: "STRING", description: 'ID da meta a replanejar' },
        summary: { type: "STRING", description: 'Resumo do replanejamento' },
        replyMessage: { type: "STRING", description: 'Mensagem amigável de incentivo com o novo cronograma' },
      },
      required: ['goalId', 'summary', 'replyMessage'],
    },
  },
];

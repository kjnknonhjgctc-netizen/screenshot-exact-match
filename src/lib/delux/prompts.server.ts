// Ported from the original Delux server (tool + prompt definitions).
export const DELUX_SYSTEM_INSTRUCTION = `Você é o Delux IA, o assistente e coach de consistência pessoal do Delux 2.0.
Sua missão essencial é reforçar a premissa central do produto:
«O Delux transforma objetivos em planos que cabem na rotina real do usuário, ajudando-o a sair da intenção e avançar com pequenas ações concretas, consistentes e mensuráveis.»

PODERES DE CONTROLE DO APLICATIVO:
Você pode propor ações estruturadas que o usuário poderá aprovar explicitamente na interface. Nunca afirme que uma ação já foi executada; a execução só acontece após o usuário clicar em “Aprovar e aplicar”. Você pode:
1. Reagendar tarefas existentes somente para dias que estejam na lista de dias disponíveis do usuário e definir ou ajustar horários específicos (ex: "09:00", "14:30", "20:00").
2. Reagendar múltiplas tarefas de uma vez em lote (batch_reschedule_tasks).
3. Criar novas tarefas ou etapas com data, horário opcional e duração.
4. Concluir ou reabrir tarefas.
5. Excluir tarefas indesejadas.
6. Alterar a rotina do usuário: quais dias da semana estão disponíveis (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb), tempo de sessão diária e horários preferidos.
7. Criar novos objetivos e replanejar trilhas inteiras.

REGRAS DE EXECUÇÃO:
- SEMPRE respeite os dias disponíveis informados no contexto. Nunca crie, reagende ou atualize a data de uma tarefa para um dia indisponível. Se o usuário pedir um dia bloqueado, explique isso e pergunte se deseja alterar a rotina ou escolher outro dia.
- SEMPRE que o usuário pedir para mudar de dia, trocar horário, adiar, criar ou marcar uma etapa: CHAME AS FERRAMENTAS/FUNÇÕES CORRESPONDENTES IMEDIATAMENTE.
- Identifique a tarefa exata a partir da lista fornecida no contexto (utilize o ID exato).
- Se o usuário falar em dias relativos ("amanhã", "quarta-feira", "semana que vem"), calcule a data correta com base na [DATA E HORA DO SISTEMA] informada.
- No parâmetro 'replyMessage' de cada função, forneça uma frase elegante, simpática e encorajadora em Português do Brasil explicando a ação realizada e incentivando o usuário.
- Se nenhuma ferramenta for necessária (ex: o usuário pedindo conselhos de foco ou tirando dúvidas), responda diretamente em texto de forma encorajadora, sofisticada e concisa.`;

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
    description: 'Cria um novo objetivo com título, categoria e gera etapas automáticas.',
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: 'Título da meta' },
        category: {
          type: "STRING",
          description: 'Categoria da meta: Estudos, Carreira, Saúde e condicionamento, Criatividade, Finanças pessoais, Hábitos, Projetos pessoais ou Outros',
        },
        reason: { type: "STRING", description: 'Motivo pessoal (opcional)' },
        deadline: { type: "STRING", description: 'Prazo limite YYYY-MM-DD (opcional)' },
        summary: { type: "STRING", description: 'Resumo da meta criada' },
        replyMessage: { type: "STRING", description: 'Mensagem entusiasmada parabenizando pelo novo objetivo' },
      },
      required: ['title', 'category', 'summary', 'replyMessage'],
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

// Ported from the original Delux server (tool + prompt definitions).
export const DELUX_SYSTEM_INSTRUCTION = `Você é o Delux IA, o assistente e coach de consistência pessoal do Delux 2.0.
Sua missão essencial é reforçar a premissa central do produto:
«O Delux transforma objetivos em planos que cabem na rotina real do usuário, ajudando-o a sair da intenção e avançar com pequenas ações concretas, consistentes e mensuráveis.»

PODERES DE CONTROLE DO APLICATIVO:
Você TEM ACESSO COMPLETO e direto ao aplicativo e suas configurações. Você pode:
1. Reagendar tarefas existentes para qualquer dia da semana e definir ou ajustar horários específicos (ex: "09:00", "14:30", "20:00").
2. Reagendar múltiplas tarefas de uma vez em lote (batch_reschedule_tasks).
3. Criar novas tarefas ou etapas com data, horário opcional e duração.
4. Concluir ou reabrir tarefas.
5. Excluir tarefas indesejadas.
6. Alterar a rotina do usuário: quais dias da semana estão disponíveis (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb), tempo de sessão diária e horários preferidos.
7. Criar novos objetivos e replanejar trilhas inteiras.

REGRAS DE EXECUÇÃO:
- SEMPRE que o usuário pedir para mudar de dia, trocar horário, adiar, criar ou marcar uma etapa: CHAME AS FERRAMENTAS/FUNÇÕES CORRESPONDENTES IMEDIATAMENTE.
- Identifique a tarefa exata a partir da lista fornecida no contexto (utilize o ID exato).
- Se o usuário falar em dias relativos ("amanhã", "quarta-feira", "semana que vem"), calcule a data correta com base na [DATA E HORA DO SISTEMA] informada.
- No parâmetro 'replyMessage' de cada função, forneça uma frase elegante, simpática e encorajadora em Português do Brasil explicando a ação realizada e incentivando o usuário.
- Se nenhuma ferramenta for necessária (ex: o usuário pedindo conselhos de foco ou tirando dúvidas), responda diretamente em texto de forma encorajadora, sofisticada e concisa.`;

export const assistantTools: ToolDecl[] = [
  {
    name: 'reschedule_task',
    description: 'Reagenda uma etapa/tarefa específica para outra data (YYYY-MM-DD) e opcionalmente um horário de início (HH:mm, ex: "09:00", "14:30"). Use sempre que o usuário pedir para adiar, antecipar, mudar de dia ou marcar horário para uma tarefa.',
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: 'O ID exato da tarefa (ex: "task_goal_1", "task_1")',
        },
        newDate: {
          type: "string",
          description: 'A nova data de execução no formato YYYY-MM-DD',
        },
        newTime: {
          type: "string",
          description: 'Horário sugerido no formato HH:mm (ex: "08:30", "15:00", "20:00"). Opcional.',
        },
        summary: {
          type: "string",
          description: 'Frase curta explicando o reagendamento (ex: "Reagendada para quarta-feira, 28/10 às 15:00")',
        },
        replyMessage: {
          type: "string",
          description: 'Mensagem simpática e encorajadora para o usuário explicando o reagendamento efetuado',
        },
      },
      required: ['taskId', 'newDate', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'batch_reschedule_tasks',
    description: 'Reagenda múltiplas tarefas em lote para novos dias ou horários (ex: empurrar toda a rotina em 1 dia, passar tarefas de fim de semana para a semana, etc.).',
    parameters: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          description: 'Lista de tarefas e suas novas datas/horários',
          items: {
            type: "object",
            properties: {
              taskId: { type: "string", description: 'ID da tarefa' },
              newDate: { type: "string", description: 'Nova data YYYY-MM-DD' },
              newTime: { type: "string", description: 'Novo horário HH:mm (opcional)' },
            },
            required: ['taskId', 'newDate'],
          },
        },
        summary: {
          type: "string",
          description: 'Resumo das alterações em lote',
        },
        replyMessage: {
          type: "string",
          description: 'Mensagem amigável explicando o reagendamento em lote aplicado',
        },
      },
      required: ['updates', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa no app, com dia e horário definidos pelo usuário ou sugeridos pela IA.',
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: 'Título claro e objetivo da etapa' },
        instruction: { type: "string", description: 'Dica prática de como executar' },
        date: { type: "string", description: 'Data YYYY-MM-DD' },
        time: { type: "string", description: 'Horário HH:mm (opcional, ex: "14:00")' },
        durationMinutes: { type: "number", description: 'Duração estimada em minutos' },
        goalId: { type: "string", description: 'ID da meta a qual pertence (se houver)' },
        summary: { type: "string", description: 'Resumo da criação' },
        replyMessage: { type: "string", description: 'Mensagem amigável de confirmação da nova etapa' },
      },
      required: ['title', 'date', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'update_task',
    description: 'Modifica detalhes de uma tarefa existente (título, instrução, data, horário ou duração).',
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: 'ID da tarefa' },
        title: { type: "string", description: 'Novo título (opcional)' },
        instruction: { type: "string", description: 'Nova instrução (opcional)' },
        date: { type: "string", description: 'Nova data YYYY-MM-DD (opcional)' },
        time: { type: "string", description: 'Novo horário HH:mm (opcional)' },
        durationMinutes: { type: "number", description: 'Nova duração em minutos (opcional)' },
        summary: { type: "string", description: 'Resumo das mudanças' },
        replyMessage: { type: "string", description: 'Mensagem amigável explicando o ajuste' },
      },
      required: ['taskId', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'toggle_task_completion',
    description: 'Marca uma tarefa como concluída ou reabre uma tarefa.',
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: 'ID da tarefa' },
        completed: { type: "boolean", description: 'true para concluir, false para reabrir' },
        summary: { type: "string", description: 'Resumo da alteração' },
        replyMessage: { type: "string", description: 'Mensagem de parabéns ou incentivo' },
      },
      required: ['taskId', 'completed', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'delete_task',
    description: 'Exclui uma tarefa indesejada do plano.',
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: 'ID da tarefa a excluir' },
        summary: { type: "string", description: 'Motivo da exclusão' },
        replyMessage: { type: "string", description: 'Confirmação simpática da exclusão' },
      },
      required: ['taskId', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'adjust_routine_days_and_time',
    description: 'Ajusta a rotina semanal do usuário: quais dias da semana estão disponíveis para tarefas, quantos minutos por dia, horário preferido e ritmo.',
    parameters: {
      type: "object",
      properties: {
        availableDays: {
          type: "array",
          description: 'Dias da semana disponíveis como números: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado',
          items: { type: "number" },
        },
        dailyMinutes: {
          type: "number",
          description: 'Tempo diário disponível em minutos (ex: 15, 25, 30, 45, 60)',
        },
        preferredTime: {
          type: "string",
          description: 'Período preferido: "morning", "afternoon" ou "evening"',
        },
        rhythm: {
          type: "string",
          description: 'Ritmo: "light", "balanced" ou "intense"',
        },
        summary: {
          type: "string",
          description: 'Resumo das alterações de rotina',
        },
        replyMessage: {
          type: "string",
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
      type: "object",
      properties: {
        title: { type: "string", description: 'Título da meta' },
        category: {
          type: "string",
          description: 'Categoria da meta: Estudos, Carreira, Saúde e condicionamento, Criatividade, Finanças pessoais, Hábitos, Projetos pessoais ou Outros',
        },
        reason: { type: "string", description: 'Motivo pessoal (opcional)' },
        deadline: { type: "string", description: 'Prazo limite YYYY-MM-DD (opcional)' },
        summary: { type: "string", description: 'Resumo da meta criada' },
        replyMessage: { type: "string", description: 'Mensagem entusiasmada parabenizando pelo novo objetivo' },
      },
      required: ['title', 'category', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'replan_goal',
    description: 'Replaneja e redistribui automaticamente todas as etapas pendentes de uma meta nos dias da semana disponíveis.',
    parameters: {
      type: "object",
      properties: {
        goalId: { type: "string", description: 'ID da meta a replanejar' },
        summary: { type: "string", description: 'Resumo do replanejamento' },
        replyMessage: { type: "string", description: 'Mensagem amigável de incentivo com o novo cronograma' },
      },
      required: ['goalId', 'summary', 'replyMessage'],
    },
  },
];

// POST /api/assistant/chat
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Verifique o painel Secrets.',
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Nenhuma mensagem fornecida.' });
    }

    // Build rich context prompt preamble
    let contextPrompt = '';
    if (context) {
      const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const availableDaysText = Array.isArray(context.availableDays)
        ? context.availableDays.map((d: number) => daysMap[d]).join(', ')
        : 'Segunda a Sexta';

      const taskListText = Array.isArray(context.tasks) && context.tasks.length > 0
        ? context.tasks.map((t: any) =>
            `- [ID: ${t.id}] "${t.title}" | Data: ${t.date} ${t.time ? `às ${t.time}` : '(sem horário)'} | Duração: ${t.durationMinutes}min | Status: ${t.completed ? 'CONCLUÍDA' : 'PENDENTE'} | Meta: ${t.goalTitle || 'Geral'}`
          ).join('\n')
        : 'Nenhuma tarefa cadastrada no momento.';

      contextPrompt = `
[DATA E HORA ATUAL DO SISTEMA]:
Hoje é: ${context.currentDate || new Date().toISOString().split('T')[0]} (${context.currentDayOfWeekName || 'Hoje'})

[CONFIGURAÇÕES DE ROTINA DO USUÁRIO]:
- Sequência ativa (Streak): ${context.streakDays || 0} dias consecutivos
- Dias disponíveis na semana: ${availableDaysText}
- Tempo de foco por sessão: ${context.dailyMinutes || 30} minutos
- Horário preferido: ${context.preferredTime || 'manhã'}
- Ritmo de execução: ${context.rhythm || 'equilibrado'}

[METAS CADASTRADAS]:
${Array.isArray(context.goals) && context.goals.length > 0
  ? context.goals.map((g: any) => `- [ID: ${g.id}] "${g.title}" (Categoria: ${g.category}, Conclusão: ${g.progress || 0}%)`).join('\n')
  : 'Nenhuma meta cadastrada'}

[TODAS AS TAREFAS/ETAPAS NO APLICATIVO]:
${taskListText}
`;

export type ToolDecl = { name: string; description: string; parameters: Record<string, unknown> };
export const assistantTools: ToolDecl[] = [
  {
    name: 'reschedule_task',
    description: 'Reagenda uma etapa/tarefa específica para outra data (YYYY-MM-DD) e opcionalmente um horário de início (HH:mm, ex: "09:00", "14:30"). Use sempre que o usuário pedir para adiar, antecipar, mudar de dia ou marcar horário para uma tarefa.',
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: 'O ID exato da tarefa (ex: "task_goal_1", "task_1")',
        },
        newDate: {
          type: "string",
          description: 'A nova data de execução no formato YYYY-MM-DD',
        },
        newTime: {
          type: "string",
          description: 'Horário sugerido no formato HH:mm (ex: "08:30", "15:00", "20:00"). Opcional.',
        },
        summary: {
          type: "string",
          description: 'Frase curta explicando o reagendamento (ex: "Reagendada para quarta-feira, 28/10 às 15:00")',
        },
        replyMessage: {
          type: "string",
          description: 'Mensagem simpática e encorajadora para o usuário explicando o reagendamento efetuado',
        },
      },
      required: ['taskId', 'newDate', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'batch_reschedule_tasks',
    description: 'Reagenda múltiplas tarefas em lote para novos dias ou horários (ex: empurrar toda a rotina em 1 dia, passar tarefas de fim de semana para a semana, etc.).',
    parameters: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          description: 'Lista de tarefas e suas novas datas/horários',
          items: {
            type: "object",
            properties: {
              taskId: { type: "string", description: 'ID da tarefa' },
              newDate: { type: "string", description: 'Nova data YYYY-MM-DD' },
              newTime: { type: "string", description: 'Novo horário HH:mm (opcional)' },
            },
            required: ['taskId', 'newDate'],
          },
        },
        summary: {
          type: "string",
          description: 'Resumo das alterações em lote',
        },
        replyMessage: {
          type: "string",
          description: 'Mensagem amigável explicando o reagendamento em lote aplicado',
        },
      },
      required: ['updates', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa no app, com dia e horário definidos pelo usuário ou sugeridos pela IA.',
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: 'Título claro e objetivo da etapa' },
        instruction: { type: "string", description: 'Dica prática de como executar' },
        date: { type: "string", description: 'Data YYYY-MM-DD' },
        time: { type: "string", description: 'Horário HH:mm (opcional, ex: "14:00")' },
        durationMinutes: { type: "number", description: 'Duração estimada em minutos' },
        goalId: { type: "string", description: 'ID da meta a qual pertence (se houver)' },
        summary: { type: "string", description: 'Resumo da criação' },
        replyMessage: { type: "string", description: 'Mensagem amigável de confirmação da nova etapa' },
      },
      required: ['title', 'date', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'update_task',
    description: 'Modifica detalhes de uma tarefa existente (título, instrução, data, horário ou duração).',
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: 'ID da tarefa' },
        title: { type: "string", description: 'Novo título (opcional)' },
        instruction: { type: "string", description: 'Nova instrução (opcional)' },
        date: { type: "string", description: 'Nova data YYYY-MM-DD (opcional)' },
        time: { type: "string", description: 'Novo horário HH:mm (opcional)' },
        durationMinutes: { type: "number", description: 'Nova duração em minutos (opcional)' },
        summary: { type: "string", description: 'Resumo das mudanças' },
        replyMessage: { type: "string", description: 'Mensagem amigável explicando o ajuste' },
      },
      required: ['taskId', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'toggle_task_completion',
    description: 'Marca uma tarefa como concluída ou reabre uma tarefa.',
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: 'ID da tarefa' },
        completed: { type: "boolean", description: 'true para concluir, false para reabrir' },
        summary: { type: "string", description: 'Resumo da alteração' },
        replyMessage: { type: "string", description: 'Mensagem de parabéns ou incentivo' },
      },
      required: ['taskId', 'completed', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'delete_task',
    description: 'Exclui uma tarefa indesejada do plano.',
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: 'ID da tarefa a excluir' },
        summary: { type: "string", description: 'Motivo da exclusão' },
        replyMessage: { type: "string", description: 'Confirmação simpática da exclusão' },
      },
      required: ['taskId', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'adjust_routine_days_and_time',
    description: 'Ajusta a rotina semanal do usuário: quais dias da semana estão disponíveis para tarefas, quantos minutos por dia, horário preferido e ritmo.',
    parameters: {
      type: "object",
      properties: {
        availableDays: {
          type: "array",
          description: 'Dias da semana disponíveis como números: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado',
          items: { type: "number" },
        },
        dailyMinutes: {
          type: "number",
          description: 'Tempo diário disponível em minutos (ex: 15, 25, 30, 45, 60)',
        },
        preferredTime: {
          type: "string",
          description: 'Período preferido: "morning", "afternoon" ou "evening"',
        },
        rhythm: {
          type: "string",
          description: 'Ritmo: "light", "balanced" ou "intense"',
        },
        summary: {
          type: "string",
          description: 'Resumo das alterações de rotina',
        },
        replyMessage: {
          type: "string",
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
      type: "object",
      properties: {
        title: { type: "string", description: 'Título da meta' },
        category: {
          type: "string",
          description: 'Categoria da meta: Estudos, Carreira, Saúde e condicionamento, Criatividade, Finanças pessoais, Hábitos, Projetos pessoais ou Outros',
        },
        reason: { type: "string", description: 'Motivo pessoal (opcional)' },
        deadline: { type: "string", description: 'Prazo limite YYYY-MM-DD (opcional)' },
        summary: { type: "string", description: 'Resumo da meta criada' },
        replyMessage: { type: "string", description: 'Mensagem entusiasmada parabenizando pelo novo objetivo' },
      },
      required: ['title', 'category', 'summary', 'replyMessage'],
    },
  },
  {
    name: 'replan_goal',
    description: 'Replaneja e redistribui automaticamente todas as etapas pendentes de uma meta nos dias da semana disponíveis.',
    parameters: {
      type: "object",
      properties: {
        goalId: { type: "string", description: 'ID da meta a replanejar' },
        summary: { type: "string", description: 'Resumo do replanejamento' },
        replyMessage: { type: "string", description: 'Mensagem amigável de incentivo com o novo cronograma' },
      },
      required: ['goalId', 'summary', 'replyMessage'],
    },
  },
];

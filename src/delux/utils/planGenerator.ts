// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import { GoalCategory, Task, UserPreferences } from '../types';
import { addDays, getLocalDateString, parseLocalDateString } from './dateUtils';

interface StepTemplate {
  title: string;
  instruction: string;
  durationMinutes: number;
}

/**
 * Curated practical domain templates for common goals.
 * Adapted deterministically based on user query.
 */
const DOMAIN_TEMPLATES: Record<string, StepTemplate[]> = {
  violao: [
    {
      title: 'Ajustar o instrumento e aprender as partes básicas',
      instruction: 'Afinar as 6 cordas com um aplicativo, conhecer o braço, trastes e como segurar a palheta.',
      durationMinutes: 20,
    },
    {
      title: 'Postura correta e treino da mão esquerda',
      instruction: 'Posicionar o polegar atrás do braço e praticar a pressão dos dedos 1, 2, 3 e 4 nas cordas sem trastejar.',
      durationMinutes: 25,
    },
    {
      title: 'Praticar os acordes Mi Menor (Em) e Lá Maior (A)',
      instruction: 'Montar e soar cada corda individualmente até obter som limpo em ambos os acordes.',
      durationMinutes: 25,
    },
    {
      title: 'Treinar a transição rítmica entre Em e A',
      instruction: 'Usar metrônomo lento a 60 bpm executando 4 batidas para baixo em cada acorde sem pausar.',
      durationMinutes: 30,
    },
    {
      title: 'Aprender os acordes Dó Maior (C) e Sol Maior (G)',
      instruction: 'Observar a digitação dos dedos e praticar a ancoragem do dedo anelar.',
      durationMinutes: 30,
    },
    {
      title: 'Tocar a primeira progressão completa de 4 acordes',
      instruction: 'Executar G -> D -> Em -> C com ritmo constante por 10 repetições contínuas.',
      durationMinutes: 30,
    },
    {
      title: 'Revisar passagens difíceis e registrar primeira gravação',
      instruction: 'Gravar 1 minuto no celular para ouvir a clareza do som e notar a evolução real.',
      durationMinutes: 25,
    },
  ],
  ingles: [
    {
      title: 'Definir vocabulário essencial de apresentação pessoal',
      instruction: 'Aprender e anotar 15 frases-chave sobre quem você é, profissão e rotina.',
      durationMinutes: 20,
    },
    {
      title: 'Treino de escuta ativa com áudio curto de 3 minutos',
      instruction: 'Ouvir um podcast básico com transcrição e anotar 5 palavras desconhecidas.',
      durationMinutes: 25,
    },
    {
      title: 'Praticar pronúncia em voz alta com repetição espaçada',
      instruction: 'Repetir as 15 frases essenciais gravando a voz no celular para comparar a entonação.',
      durationMinutes: 25,
    },
    {
      title: 'Aprender estruturas fundamentais de perguntas',
      instruction: 'Dominar o uso de What, Where, When e How em 10 perguntas do cotidiano.',
      durationMinutes: 30,
    },
    {
      title: 'Escrever um parágrafo curto sobre o seu dia em inglês',
      instruction: 'Redigir de 5 a 8 frases simples sem tradutor automático, revisando em seguida.',
      durationMinutes: 25,
    },
    {
      title: 'Simulação de conversa real ou monólogo de 5 minutos',
      instruction: 'Falar continuamente sobre seus planos para a semana sem parar para corrigir cada detalhe.',
      durationMinutes: 30,
    },
  ],
  programacao: [
    {
      title: 'Configurar o ambiente de desenvolvimento local',
      instruction: 'Instalar editor de código, runtime e executar o primeiro script "Hello World".',
      durationMinutes: 30,
    },
    {
      title: 'Compreender variáveis, tipos de dados e operadores',
      instruction: 'Escrever 4 exemplos práticos manipulando strings, números, booleanos e listas.',
      durationMinutes: 30,
    },
    {
      title: 'Praticar estruturas de decisão condicionais (if/else)',
      instruction: 'Construir um pequeno validador de dados ou calculadora de regras simples.',
      durationMinutes: 35,
    },
    {
      title: 'Dominar loops de repetição e iteração de coleções',
      instruction: 'Criar funções que filtram e transformam uma lista de registros.',
      durationMinutes: 35,
    },
    {
      title: 'Modularizar código com funções reutilizáveis',
      instruction: 'Dividir o código em funções pequenas e com responsabilidade única.',
      durationMinutes: 40,
    },
    {
      title: 'Construir um mini-projeto prático funcional',
      instruction: 'Desenvolver um aplicativo simples de linha de comando ou utilitário prático.',
      durationMinutes: 45,
    },
    {
      title: 'Revisar código, tratar erros e documentar o aprendizado',
      instruction: 'Refatorar trechos complexos e adicionar anotações claras sobre o que aprendeu.',
      durationMinutes: 30,
    },
  ],
  corrida: [
    {
      title: 'Avaliação inicial: caminhada rápida com trote leve',
      instruction: '10 min aquecendo + alternar 1 min trote com 2 min caminhada por 20 minutos.',
      durationMinutes: 30,
    },
    {
      title: 'Treino intervalado de base aeróbica',
      instruction: 'Aquecimento dinâmico + 6 séries de 1:30 min trote por 1:30 min caminhada.',
      durationMinutes: 35,
    },
    {
      title: 'Treino contínuo em ritmo confortável (Z2)',
      instruction: 'Manter corrida contínua em ritmo que permita falar frases completas por 15 minutos.',
      durationMinutes: 30,
    },
    {
      title: 'Treino de mobilidade e fortalecimento para corredores',
      instruction: 'Exercícios para panturrilhas, glúteos e core para prevenir lesões articulares.',
      durationMinutes: 25,
    },
    {
      title: 'Avanço de distância: 25 minutos contínuos',
      instruction: 'Iniciar devagar e sustentar cadência estável, finalizando com caminhada de desaquecimento.',
      durationMinutes: 35,
    },
    {
      title: 'Teste de 3 km ou 5 km sem interrupção',
      instruction: 'Completar o percurso mantendo hidratação adequada e ritmo uniforme.',
      durationMinutes: 40,
    },
  ],
  leitura: [
    {
      title: 'Definir o livro e preparar um ambiente sem distrações',
      instruction: 'Escolher a obra, deixar o celular em outro cômodo e ler as primeiras 10 páginas.',
      durationMinutes: 20,
    },
    {
      title: 'Sessão focada de leitura: capítulos 1 e 2',
      instruction: 'Ler prestando atenção nos conceitos principais e destacar trechos marcantes.',
      durationMinutes: 25,
    },
    {
      title: 'Anotar os 3 aprendizados mais relevantes até aqui',
      instruction: 'Resumir com suas próprias palavras em 1 parágrafo as ideias centrais.',
      durationMinutes: 15,
    },
    {
      title: 'Avançar a leitura: 20 páginas em ritmo constante',
      instruction: 'Manter a concentração usando a técnica Pomodoro ou bloco único de foco.',
      durationMinutes: 30,
    },
    {
      title: 'Sessão de aprofundamento e conexão prática',
      instruction: 'Relacionar uma ideia do livro com uma decisão ou projeto real da sua vida.',
      durationMinutes: 25,
    },
    {
      title: 'Conclusão da leitura e síntese final',
      instruction: 'Finalizar os capítulos finais e escrever uma nota executiva do que aplicar na prática.',
      durationMinutes: 30,
    },
  ],
  financas: [
    {
      title: 'Mapear todos os gastos fixos e variáveis do último mês',
      instruction: 'Listar moradia, contas, alimentação, assinaturas e supérfluos em categorias simples.',
      durationMinutes: 30,
    },
    {
      title: 'Identificar 3 despesas que podem ser canceladas ou renegociadas',
      instruction: 'Verificar assinaturas esquecidas, planos de telefonia e serviços não utilizados.',
      durationMinutes: 25,
    },
    {
      title: 'Definir a meta exata de economia mensal',
      instruction: 'Estabelecer valor realista para reservar logo no dia do recebimento do salário.',
      durationMinutes: 20,
    },
    {
      title: 'Configurar transferência automática para reserva de emergência',
      instruction: 'Criar conta ou aplicação em instrumento de renda fixa de liquidez diária.',
      durationMinutes: 25,
    },
    {
      title: 'Organizar controle semanal de fluxo de caixa',
      instruction: 'Criar um ritual de 10 minutos por semana para conferir se os gastos estão dentro da meta.',
      durationMinutes: 20,
    },
  ],
};

/**
 * Procedural decomposition for any generic goal based on title & category.
 */
function generateProceduralSteps(title: string, category: GoalCategory, dailyMinutes: number): StepTemplate[] {
  const steps: StepTemplate[] = [
    {
      title: `Definir o escopo prático e os fundamentos de "${title}"`,
      instruction: 'Clarificar exatamente o resultado esperado, remover ambiguidades e preparar os materiais necessários.',
      durationMinutes: Math.min(dailyMinutes, 25),
    },
    {
      title: `Mapear referências e selecionar o método principal`,
      instruction: 'Escolher uma referência de qualidade comprovada e entender as etapas que trazem mais resultado.',
      durationMinutes: Math.min(dailyMinutes, 30),
    },
    {
      title: `Primeira sessão prática: executar o bloco inicial`,
      instruction: 'Fazer a primeira versão prática sem buscar perfeição imediata. O foco é sair da inércia.',
      durationMinutes: dailyMinutes,
    },
    {
      title: `Aprofundar a execução e superar os primeiros gargalos`,
      instruction: 'Trabalhar no trecho que exigiu mais esforço na sessão anterior e refinar a consistência.',
      durationMinutes: dailyMinutes,
    },
    {
      title: `Treino de repetição e consolidação do aprendizado`,
      instruction: 'Revisitar a prática sem olhar anotações de apoio para testar autonomia e fixação.',
      durationMinutes: dailyMinutes,
    },
    {
      title: `Aplicação em um cenário concreto ou mini-entrega`,
      instruction: 'Produzir um resultado tangível que comprove que a etapa foi executada de ponta a ponta.',
      durationMinutes: Math.min(dailyMinutes, 40),
    },
    {
      title: `Revisão de qualidade e ajustes finais do objetivo`,
      instruction: 'Avaliar os pontos fortes do processo, registrar aprendizados e planejar o próximo patamar.',
      durationMinutes: Math.min(dailyMinutes, 25),
    },
  ];

  return steps;
}

/**
 * Finds matching template or generates procedural steps.
 */
export function getStepsForGoal(title: string, category: GoalCategory, dailyMinutes: number): StepTemplate[] {
  const normalized = title.toLowerCase();

  if (normalized.includes('viol') || normalized.includes('guit') || normalized.includes('instrument') || normalized.includes('piano') || normalized.includes('musica')) {
    return DOMAIN_TEMPLATES.violao;
  }
  if (normalized.includes('ingl') || normalized.includes('idiom') || normalized.includes('espanh') || normalized.includes('frances') || normalized.includes('alemao')) {
    return DOMAIN_TEMPLATES.ingles;
  }
  if (normalized.includes('prog') || normalized.includes('cod') || normalized.includes('react') || normalized.includes('python') || normalized.includes('dev') || normalized.includes('javascript') || normalized.includes('web')) {
    return DOMAIN_TEMPLATES.programacao;
  }
  if (normalized.includes('corr') || normalized.includes('caminh') || normalized.includes('trein') || normalized.includes('acad') || normalized.includes('peso') || normalized.includes('exerc')) {
    return DOMAIN_TEMPLATES.corrida;
  }
  if (normalized.includes('ler') || normalized.includes('livr') || normalized.includes('leitur')) {
    return DOMAIN_TEMPLATES.leitura;
  }
  if (normalized.includes('finan') || normalized.includes('poup') || normalized.includes('dinheir') || normalized.includes('gast') || normalized.includes('invest')) {
    return DOMAIN_TEMPLATES.financas;
  }

  return generateProceduralSteps(title, category, dailyMinutes);
}

/**
 * Distributes tasks strictly across available days starting from today or next available day.
 * Returns generated Task array with stable IDs.
 */
export function generateTasksForGoal(
  goalId: string,
  title: string,
  category: GoalCategory,
  preferences: UserPreferences,
  startDateStr?: string
): { tasks: Task[]; warning?: string } {
  const { availableDays, dailyMinutes } = preferences;

  if (!availableDays || availableDays.length === 0) {
    return {
      tasks: [],
      warning: 'Você não selecionou nenhum dia disponível na sua semana. Escolha ao menos 1 dia para gerar o plano.',
    };
  }

  const stepTemplates = getStepsForGoal(title, category, dailyMinutes);
  const tasks: Task[] = [];

  let currentDate = startDateStr ? parseLocalDateString(startDateStr) : new Date();
  currentDate.setHours(0, 0, 0, 0);

  // If today is not in availableDays, advance to the first available day
  while (!availableDays.includes(currentDate.getDay())) {
    currentDate = addDays(currentDate, 1);
  }

  for (let i = 0; i < stepTemplates.length; i++) {
    const step = stepTemplates[i];
    const dateStr = getLocalDateString(currentDate);

    tasks.push({
      id: `task_${goalId}_${i + 1}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      goalId,
      title: step.title,
      instruction: step.instruction,
      date: dateStr,
      durationMinutes: step.durationMinutes,
      completed: false,
      stepOrder: i + 1,
      isAutomated: true,
    });

    // Advance to next allowed day
    currentDate = addDays(currentDate, 1);
    while (!availableDays.includes(currentDate.getDay())) {
      currentDate = addDays(currentDate, 1);
    }
  }

  return { tasks };
}

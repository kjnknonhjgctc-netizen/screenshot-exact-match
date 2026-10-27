import { DELUX_SYSTEM_INSTRUCTION, assistantTools } from "./prompts.server";

const MODEL = process.env["OPENAI_MODEL"] || "gpt-5.5";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function normalizeSchema(value: any): any {
  if (Array.isArray(value)) return value.map(normalizeSchema);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "type" && typeof child === "string") {
      result[key] = child.toLowerCase();
    } else {
      result[key] = normalizeSchema(child);
    }
  }
  return result;
}

function openAITools() {
  return assistantTools.map((item) => ({
    type: "function" as const,
    function: {
      name: item.name,
      description: item.description,
      parameters: normalizeSchema(item.parameters),
    },
  }));
}

async function openAI(apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, ...body }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Erro ${res.status} na API da OpenAI.`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error("A OpenAI não retornou uma resposta válida.");
  return {
    model: data.model || MODEL,
    text: typeof message.content === "string" ? message.content.trim() : "",
    calls: (message.tool_calls || []).map((call: any) => ({
      name: call.function?.name,
      args: JSON.parse(call.function?.arguments || "{}"),
    })),
  };
}

function errorResponse(err: unknown, fallback: string) {
  const e = err as { status?: number; message?: string };
  const status = e?.status ?? 500;
  let message = e?.message || fallback;
  if (status === 429) message = "A OpenAI está com muitas solicitações ou o limite da API foi atingido. Verifique o uso e o faturamento da API.";
  if (status === 401 || status === 403) message = "A chave OPENAI_API_KEY é inválida ou não tem permissão para usar este modelo.";
  console.error(fallback, err);
  return json({ error: message }, status >= 400 && status < 600 ? status : 500);
}

function buildContext(context: any): string {
  if (!context) return "";
  const daysMap = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const availableDaysText = Array.isArray(context.availableDays)
    ? context.availableDays.map((d: number) => daysMap[d] || "Dia inválido").join(", ")
    : "Segunda a Sexta";
  const taskListText =
    Array.isArray(context.tasks) && context.tasks.length > 0
      ? context.tasks
          .map((t: any) =>
            `- [ID: ${t.id}] "${t.title}" | Data: ${t.date} ${t.time ? `às ${t.time}` : "(sem horário)"} | Duração: ${t.durationMinutes}min | Status: ${t.completed ? "CONCLUÍDA" : "PENDENTE"} | Meta: ${t.goalTitle || "Geral"}`,
          )
          .join("\n")
      : "Nenhuma tarefa cadastrada no momento.";
  const goals =
    Array.isArray(context.goals) && context.goals.length > 0
      ? context.goals.map((g: any) => `- [ID: ${g.id}] "${g.title}" (Categoria: ${g.category}, Conclusão: ${g.progress || 0}%)`).join("\n")
      : "Nenhuma meta cadastrada";
  return `
[DATA E HORA ATUAL DO SISTEMA]:
Hoje é: ${context.currentDate || new Date().toISOString().split("T")[0]} (${context.currentDayOfWeekName || "Hoje"})

[CONFIGURAÇÕES DE ROTINA DO USUÁRIO]:
- Sequência ativa (Streak): ${context.streakDays || 0} dias consecutivos
- Dias disponíveis na semana: ${availableDaysText}
- Tempo de foco por sessão: ${context.dailyMinutes || 30} minutos
- Horário preferido: ${context.preferredTime || "manhã"}
- Ritmo de execução: ${context.rhythm || "equilibrado"}

[METAS CADASTRADAS]:
${goals}

[TODAS AS TAREFAS/ETAPAS NO APLICATIVO]:
${taskListText}
`;
}

export async function handleChat(request: Request) {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return json({ error: "Chave OPENAI_API_KEY não configurada no ambiente do servidor." }, 500);
  try {
    const { messages, context } = (await request.json()) as { messages?: any[]; context?: any };
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Nenhuma mensagem fornecida." }, 400);
    }
    const ctx = buildContext(context);
    const system = ctx ? `${DELUX_SYSTEM_INSTRUCTION}\n\n${ctx}` : DELUX_SYSTEM_INSTRUCTION;
    const chatMessages = [
      { role: "system", content: system },
      ...messages.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      })),
    ];
    const out = await openAI(apiKey, {
      messages: chatMessages,
      tools: openAITools(),
      tool_choice: "auto",
      temperature: 0.3,
    });
    const actions = out.calls.map((call: any, idx: number) => ({
      id: `act_${Date.now()}_${idx}`,
      type: call.name,
      summary: call.args?.summary || `Ação solicitada: ${call.name}`,
      payload: call.args,
    }));
    let replyText = out.text;
    if (!replyText && actions.length > 0) {
      const msgs = actions.map((a: any) => a.payload?.replyMessage || a.summary).filter(Boolean);
      replyText = msgs.length === 1
        ? msgs[0]
        : `Preparei estas alterações para o Delux:\n\n${actions.map((a: any) => `• ${a.summary}`).join("\n")}`;
    }
    if (!replyText) replyText = "Como posso ajudar a organizar suas etapas e rotina hoje?";
    return json({ reply: replyText, actions, model: out.model });
  } catch (err) {
    return errorResponse(err, "Erro ao processar consulta com a OpenAI.");
  }
}

export async function handleGeneratePlan(request: Request) {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return json({ error: "Chave OPENAI_API_KEY não configurada no ambiente do servidor." }, 500);
  try {
    const { goalTitle, category, reason, dailyMinutes, availableDaysCount } = (await request.json()) as any;
    if (!goalTitle) return json({ error: "Título do objetivo é obrigatório." }, 400);
    const prompt = `Gere um plano prático, viável e progressivo de 6 a 8 etapas para o seguinte objetivo:
Título: "${goalTitle}"
Categoria: "${category || "Geral"}"
Motivo pessoal: "${reason || "Desenvolvimento pessoal"}"
Tempo disponível por dia: ${dailyMinutes || 30} minutos
Dias disponíveis na semana: ${availableDaysCount || 5} dias

Retorne APENAS um JSON válido, sem markdown, com o esquema:
{
  "steps": [
    { "title": "Ação prática e concreta em 1 frase", "instruction": "Instrução clara em 1 ou 2 frases curtas", "durationMinutes": 25 }
  ],
  "advice": "1 conselho prático sobre consistência para este objetivo específico"
}`;
    const out = await openAI(apiKey, {
      messages: [
        { role: "system", content: DELUX_SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
    const text = out.text || "{}";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 ? text.slice(start, end + 1) : text);
    if (!Array.isArray(parsed.steps) || typeof parsed.advice !== "string") {
      throw new Error("A OpenAI retornou um plano em formato inesperado.");
    }
    return json(parsed);
  } catch (err) {
    return errorResponse(err, "Erro ao gerar plano com a OpenAI.");
  }
}

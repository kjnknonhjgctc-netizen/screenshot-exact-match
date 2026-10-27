import { createOpenAI } from "@ai-sdk/openai";
import { jsonSchema, streamText, tool, type ModelMessage } from "ai";
import { DELUX_SYSTEM_INSTRUCTION, assistantTools } from "./prompts.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function provider(apiKey: string) {
  return createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
}

const providerOptions = {
  openai: {
    store: false,
    forceReasoning: true,
    reasoningEffort: "low",
    include: ["reasoning.encrypted_content"],
  },
} as const;

function errorResponse(err: unknown, fallback: string) {
  const e = err as { statusCode?: number; status?: number; message?: string };
  const status = e?.statusCode ?? e?.status ?? 500;
  let message = e?.message || fallback;
  if (status === 429) message = "Muitas solicitações agora. Aguarde um instante e tente novamente.";
  if (status === 402) message = "Os créditos de IA acabaram. Adicione créditos para continuar usando o assistente.";
  console.error(fallback, err);
  return json({ error: message }, status >= 400 && status < 600 ? status : 500);
}

function buildContext(context: any): string {
  if (!context) return "";
  const daysMap = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const availableDaysText = Array.isArray(context.availableDays)
    ? context.availableDays.map((d: number) => daysMap[d]).join(", ")
    : "Segunda a Sexta";
  const taskListText =
    Array.isArray(context.tasks) && context.tasks.length > 0
      ? context.tasks
          .map(
            (t: any) =>
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
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return json({ error: "Assistente de IA não configurado." }, 500);
  try {
    const { messages, context } = (await request.json()) as { messages?: any[]; context?: any };
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Nenhuma mensagem fornecida." }, 400);
    }
    const history: ModelMessage[] = messages.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
    }));
    const tools = Object.fromEntries(
      assistantTools.map((t) => [t.name, tool({ description: t.description, inputSchema: jsonSchema(t.parameters as any) })]),
    );
    const ctx = buildContext(context);
    const result = streamText({
      model: provider(apiKey).responses(MODEL),
      instructions: ctx ? `${DELUX_SYSTEM_INSTRUCTION}\n\n${ctx}` : DELUX_SYSTEM_INSTRUCTION,
      messages: history,
      tools,
      maxRetries: 0,
      abortSignal: request.signal,
      providerOptions,
    } as any);

    const [text, toolCalls] = await Promise.all([result.text, result.toolCalls]);
    let replyText = (text || "").trim();
    const actions = (toolCalls || []).map((call: any, idx: number) => {
      const args = (call.input ?? call.args ?? {}) as any;
      return {
        id: `act_${Date.now()}_${idx}`,
        type: call.toolName,
        summary: args.summary || `Ação executada: ${call.toolName}`,
        payload: args,
      };
    });
    if (!replyText && actions.length > 0) {
      const msgs = actions.map((a) => a.payload?.replyMessage || a.summary).filter(Boolean);
      replyText =
        msgs.length === 1
          ? msgs[0]
          : `Perfeito! Ajustei sua programação no app com sucesso:\n\n${actions.map((a) => `• ${a.summary}`).join("\n")}\n\nPronto para continuar no seu ritmo!`;
    }
    if (!replyText) replyText = "Como posso ajudar a organizar suas etapas e rotina hoje?";
    return json({ reply: replyText, actions, model: MODEL });
  } catch (err) {
    return errorResponse(err, "Erro ao processar consulta com a IA.");
  }
}

export async function handleGeneratePlan(request: Request) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return json({ error: "Assistente de IA não configurado." }, 500);
  try {
    const { goalTitle, category, reason, dailyMinutes, availableDaysCount } = (await request.json()) as any;
    if (!goalTitle) return json({ error: "Título do objetivo é obrigatório." }, 400);
    const prompt = `Gere um plano prático, viável e progressivo de 6 a 8 etapas para o seguinte objetivo:
Título: "${goalTitle}"
Categoria: "${category || "Geral"}"
Motivo pessoal: "${reason || "Desenvolvimento pessoal"}"
Tempo disponível por dia: ${dailyMinutes || 30} minutos
Dias disponíveis na semana: ${availableDaysCount || 5} dias

Retorne APENAS um JSON estrito (sem markdown) com o seguinte esquema:
{
  "steps": [
    { "title": "Ação prática e concreta em 1 frase", "instruction": "Instrução clara em 1 ou 2 frases curtas", "durationMinutes": 25 }
  ],
  "advice": "1 conselho prático sobre consistência para este objetivo específico"
}`;
    const result = streamText({
      model: provider(apiKey).responses(MODEL),
      instructions: DELUX_SYSTEM_INSTRUCTION,
      messages: [{ role: "user", content: prompt }],
      maxRetries: 0,
      abortSignal: request.signal,
      providerOptions,
    } as any);
    let text = (await result.text) || "{}";
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 ? text.slice(start, end + 1) : text);
    return json(parsed);
  } catch (err) {
    return errorResponse(err, "Erro ao gerar plano com IA.");
  }
}

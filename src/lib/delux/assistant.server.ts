import { DELUX_SYSTEM_INSTRUCTION, assistantTools } from "./prompts.server";

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

class GeminiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Calls Google Gemini directly with the user's own key, trying lighter models first.
async function gemini(apiKey: string, body: Record<string, unknown>) {
  let last: GeminiError | null = null;
  for (const model of MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      },
    );
    const data: any = await res.json().catch(() => ({}));
    if (res.ok) {
      const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
      return {
        model,
        text: parts.map((p) => p.text || "").join("").trim(),
        calls: parts.filter((p) => p.functionCall).map((p) => p.functionCall as { name: string; args?: any }),
      };
    }
    last = new GeminiError(data?.error?.message || `Erro ${res.status} no Gemini`, res.status);
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      if (res.status !== 400 || !/model|not found|supported/i.test(last.message)) throw last;
    }
  }
  throw last ?? new GeminiError("Nenhum modelo Gemini disponível no momento.", 503);
}

function errorResponse(err: unknown, fallback: string) {
  const e = err as { statusCode?: number; status?: number; message?: string };
  const status = e?.statusCode ?? e?.status ?? 500;
  let message = e?.message || fallback;
  if (status === 429) message = "Muitas solicitações agora. Aguarde um instante e tente novamente.";
  if (status === 401 || status === 403) message = "A chave do Gemini é inválida ou não tem permissão.";
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
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) return json({ error: "Chave do Gemini não configurada." }, 500);
  try {
    const { messages, context } = (await request.json()) as { messages?: any[]; context?: any };
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Nenhuma mensagem fornecida." }, 400);
    }
    const contents = messages.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));
    const ctx = buildContext(context);
    const out = await gemini(apiKey, {
      systemInstruction: { parts: [{ text: ctx ? `${DELUX_SYSTEM_INSTRUCTION}\n\n${ctx}` : DELUX_SYSTEM_INSTRUCTION }] },
      contents,
      tools: [{ functionDeclarations: assistantTools }],
      generationConfig: { temperature: 0.3 },
    });
    const text = out.text;
    const toolCalls = out.calls.map((c) => ({ toolName: c.name, input: c.args }));
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
    return json({ reply: replyText, actions, model: out.model });
  } catch (err) {
    return errorResponse(err, "Erro ao processar consulta com a IA.");
  }
}

export async function handleGeneratePlan(request: Request) {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) return json({ error: "Chave do Gemini não configurada." }, 500);
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
    const out = await gemini(apiKey, {
      systemInstruction: { parts: [{ text: DELUX_SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
    });
    let text = out.text || "{}";
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 ? text.slice(start, end + 1) : text);
    return json(parsed);
  } catch (err) {
    return errorResponse(err, "Erro ao gerar plano com IA.");
  }
}

import OpenAI from "openai";
import { appEnv } from "../../config/env.js";
import { aiResultJsonSchema, aiResultSchema, type AiResult } from "./schema.js";

export async function runAiExtraction(input: {
  materialId: string;
  meetingDateIso: string | null;
  timeZone: string | null;
  text: string;
  modelOverride?: string;
}): Promise<AiResult> {
  if (!appEnv.OPENAI_API_KEY) {
    throw new Error("AI provider is not configured: OPENAI_API_KEY is missing");
  }

  const client = new OpenAI({ apiKey: appEnv.OPENAI_API_KEY });

  const prompt = [
    "Ты извлекаешь только факты из текста встречи.",
    "Классифицируй каждый подтверждённый пункт как решение, поручение, вопрос или информацию.",
    "Если исполнитель или срок неизвестны — верни null.",
    "needsReview должен быть true, если исполнитель, дата или время требуют уточнения.",
    "Не придумывай пункты без подтверждающей цитаты.",
    "Для каждого пункта верни минимум одну evidence с точной цитатой из материала.",
    "startOffset и endOffset верни как null, если точные позиции не вычислены.",
    `materialId: ${input.materialId}`,
    `meetingDateIso: ${input.meetingDateIso ?? "null"}`,
    `timeZone: ${input.timeZone ?? "null"}`,
    "Текст встречи:",
    input.text
  ].join("\n");

  const selectedModel = input.modelOverride ?? appEnv.OPENAI_MODEL;

  const response = await client.chat.completions.create({
    model: selectedModel,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ai_da_secretary_result",
        description: "Validated stage 1 extraction result for a meeting material",
        strict: true,
        schema: aiResultJsonSchema
      }
    },
    messages: [
      { role: "system", content: "Ты аккуратный аналитик встреч." },
      { role: "user", content: prompt }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned empty response");
  }

  const parsed = JSON.parse(content);
  return aiResultSchema.parse(parsed);
}

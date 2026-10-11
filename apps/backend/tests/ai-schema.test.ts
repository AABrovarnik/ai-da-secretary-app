import { describe, expect, it } from "vitest";
import { aiResultJsonSchema, aiResultSchema } from "../src/services/ai/schema.js";

describe("AI result contract", () => {
  it("accepts a complete schema 1.0 result", () => {
    const result = aiResultSchema.parse({
      schemaVersion: "1.0",
      summary: "Встреча завершилась решением и поручением.",
      decisions: [
        {
          text: "Выпустить тестовую версию.",
          evidence: [
            {
              materialId: "material-1",
              quote: "Решили выпустить тестовую версию.",
              startOffset: null,
              endOffset: null
            }
          ]
        }
      ],
      assignments: [],
      questions: [],
      information: []
    });

    expect(result.schemaVersion).toBe("1.0");
  });

  it("rejects incomplete model output", () => {
    const result = aiResultSchema.safeParse({
      schemaVersion: "1.0",
      decisions: [{ description: "Неверная форма" }]
    });

    expect(result.success).toBe(false);
  });

  it("requires every top-level field in the provider JSON schema", () => {
    expect(aiResultJsonSchema.additionalProperties).toBe(false);
    expect(aiResultJsonSchema.required).toEqual([
      "schemaVersion",
      "summary",
      "decisions",
      "assignments",
      "questions",
      "information"
    ]);
  });
});

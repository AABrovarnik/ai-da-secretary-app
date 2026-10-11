import { describe, expect, it } from "vitest";
import {
  assignmentDueDate,
  buildReviewedPayload,
  candidateReviewRequestSchema
} from "../src/services/review/schema.js";

const evidence = {
  materialId: "material-1",
  quote: "Согласовали выпуск тестовой версии.",
  startOffset: null,
  endOffset: null
};

describe("candidate review contract", () => {
  it("preserves edits and individual review actions", () => {
    const review = candidateReviewRequestSchema.parse({
      summary: "Итоги встречи",
      decisions: [{ action: "approve", text: "Выпустить тестовую версию", evidence: [evidence] }],
      assignments: [],
      questions: [{ action: "reject", text: "Удалить неподтверждённый вопрос", evidence: [evidence] }],
      information: [],
      comment: "Проверено человеком"
    });

    const payload = buildReviewedPayload(review);

    expect(payload.decisions[0]).not.toHaveProperty("action");
    expect(payload.review.decisions).toEqual(["approve"]);
    expect(payload.review.questions).toEqual(["reject"]);
  });

  it("rejects invalid dates and missing evidence", () => {
    const result = candidateReviewRequestSchema.safeParse({
      summary: "Итоги",
      decisions: [{ action: "approve", text: "Решение", evidence: [] }],
      assignments: [],
      questions: [],
      information: []
    });

    expect(result.success).toBe(false);
  });

  it("stores a date-only deadline deterministically", () => {
    expect(assignmentDueDate("2026-10-15")?.toISOString()).toBe("2026-10-15T00:00:00.000Z");
    expect(assignmentDueDate(null)).toBeNull();
  });
});

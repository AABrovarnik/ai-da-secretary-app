import { describe, expect, it } from "vitest";
import {
  assignmentDueDate,
  buildAssignmentCreateData,
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

  it("maps every reviewed deadline field into the confirmed assignment", () => {
    const review = candidateReviewRequestSchema.parse({
      summary: "Итоги",
      decisions: [],
      assignments: [
        {
          action: "approve",
          description: "Подготовить отчёт",
          assigneeName: "Ирина",
          dueDate: "2026-10-20",
          dueTime: "14:30",
          timeZone: "Europe/Moscow",
          dueDateRaw: "до пятницы",
          needsReview: false,
          evidence: [evidence]
        }
      ],
      questions: [],
      information: []
    });

    expect(buildAssignmentCreateData("meeting-1", review.assignments[0])).toMatchObject({
      meetingId: "meeting-1",
      dueDate: new Date("2026-10-20T00:00:00.000Z"),
      dueTime: "14:30",
      timeZone: "Europe/Moscow",
      dueDateRaw: "до пятницы"
    });
  });
});

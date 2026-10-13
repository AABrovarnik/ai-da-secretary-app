import { FormEvent, useEffect, useState } from "react";
import type { ResultCandidate, ReviewAction, ReviewedAssignment, ReviewedTextPoint, ReviewRequest } from "./types";

type ReviewPanelProps = {
  candidate: ResultCandidate;
  busy: boolean;
  onSubmit: (review: ReviewRequest) => Promise<void>;
};

function toReviewRequest(candidate: ResultCandidate): ReviewRequest {
  return {
    summary: candidate.payloadJson.summary,
    decisions: candidate.payloadJson.decisions.map((item) => ({ ...item, action: "approve" })),
    assignments: candidate.payloadJson.assignments.map((item) => ({ ...item, action: "approve" })),
    questions: candidate.payloadJson.questions.map((item) => ({ ...item, action: "approve" })),
    information: candidate.payloadJson.information.map((item) => ({ ...item, action: "approve" })),
    comment: ""
  };
}

function ActionButtons({ value, onChange }: { value: ReviewAction; onChange: (value: ReviewAction) => void }) {
  return (
    <div className="review-actions" aria-label="Решение по пункту">
      <button type="button" className={value === "approve" ? "action-button approve active" : "action-button approve"} onClick={() => onChange("approve")}>
        Подтвердить
      </button>
      <button type="button" className={value === "reject" ? "action-button reject active" : "action-button reject"} onClick={() => onChange("reject")}>
        Отклонить
      </button>
    </div>
  );
}

function EvidenceQuote({ item }: { item: ReviewedTextPoint | ReviewedAssignment }) {
  return <blockquote className="evidence-quote"><span>Источник</span>{item.evidence[0]?.quote ?? "Цитата отсутствует"}</blockquote>;
}

export function ReviewPanel({ candidate, busy, onSubmit }: ReviewPanelProps) {
  const [review, setReview] = useState<ReviewRequest>(() => toReviewRequest(candidate));

  useEffect(() => setReview(toReviewRequest(candidate)), [candidate]);

  const updateTextPoint = (section: "decisions" | "questions" | "information", index: number, patch: Partial<ReviewedTextPoint>) => {
    setReview((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    }));
  };

  const updateAssignment = (index: number, patch: Partial<ReviewedAssignment>) => {
    setReview((current) => ({
      ...current,
      assignments: current.assignments.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    }));
  };

  const textSection = (title: string, section: "decisions" | "questions" | "information", emptyText: string) => (
    <section className="review-section">
      <div className="section-heading"><h3>{title}</h3><span className="count-badge">{review[section].length}</span></div>
      {review[section].length === 0 && <p className="empty-state">{emptyText}</p>}
      {review[section].map((item, index) => (
        <article className={`candidate-card ${item.action}`} key={`${section}-${index}`}>
          <label>Формулировка<textarea value={item.text} onChange={(event) => updateTextPoint(section, index, { text: event.target.value })} rows={3} /></label>
          <EvidenceQuote item={item} />
          <ActionButtons value={item.action} onChange={(action) => updateTextPoint(section, index, { action })} />
        </article>
      ))}
    </section>
  );

  return (
    <form className="review-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); void onSubmit(review); }}>
      <div className="review-header">
        <div><p className="eyebrow">Черновик AI · schema {candidate.payloadJson.schemaVersion}</p><h2>Проверка результатов</h2></div>
        <span className="status-badge pending">Ожидает проверки</span>
      </div>
      <label className="summary-field">Краткое резюме встречи<textarea value={review.summary} onChange={(event) => setReview((current) => ({ ...current, summary: event.target.value }))} rows={4} /></label>
      {textSection("Решения", "decisions", "Решения не найдены")}
      <section className="review-section">
        <div className="section-heading"><h3>Поручения</h3><span className="count-badge">{review.assignments.length}</span></div>
        {review.assignments.length === 0 && <p className="empty-state">Поручения не найдены</p>}
        {review.assignments.map((item, index) => (
          <article className={`candidate-card ${item.action}`} key={`assignment-${index}`}>
            <label>Задача<textarea value={item.description} onChange={(event) => updateAssignment(index, { description: event.target.value })} rows={3} /></label>
            <div className="field-grid">
              <label>Исполнитель<input value={item.assigneeName ?? ""} onChange={(event) => updateAssignment(index, { assigneeName: event.target.value || null })} placeholder="Не указан" /></label>
              <label>Срок<input type="date" value={item.dueDate ?? ""} onChange={(event) => updateAssignment(index, { dueDate: event.target.value || null })} /></label>
              <label>Время<input type="time" value={item.dueTime ?? ""} onChange={(event) => updateAssignment(index, { dueTime: event.target.value || null })} /></label>
            </div>
            {item.needsReview && <p className="needs-review">Нужно уточнить исполнителя или срок</p>}
            <EvidenceQuote item={item} />
            <ActionButtons value={item.action} onChange={(action) => updateAssignment(index, { action })} />
          </article>
        ))}
      </section>
      {textSection("Вопросы", "questions", "Открытые вопросы не найдены")}
      {textSection("Информация", "information", "Информационные пункты не найдены")}
      <label>Комментарий к проверке<textarea value={review.comment ?? ""} onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))} rows={2} placeholder="Необязательно" /></label>
      <button className="primary-button submit-review" type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Завершить проверку"}</button>
    </form>
  );
}

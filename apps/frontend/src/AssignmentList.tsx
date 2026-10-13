import { useMemo, useState } from "react";
import { assignmentStatusLabels, isAssignmentOverdue } from "./assignment";
import { formatAssignmentDeadline } from "./deadline";
import type { Assignment, AssignmentStatus } from "./types";

export type AssignmentUpdate = Pick<Assignment, "description" | "assigneeName" | "dueTime" | "timeZone" | "dueDateRaw" | "status"> & {
  dueDate: string | null;
};

type Props = {
  assignments: Assignment[];
  busy: boolean;
  onSave: (assignmentId: string, update: AssignmentUpdate) => Promise<void>;
};

function AssignmentCard({ assignment, busy, onSave }: { assignment: Assignment } & Omit<Props, "assignments">) {
  const [draft, setDraft] = useState<AssignmentUpdate>({
    description: assignment.description,
    assigneeName: assignment.assigneeName,
    dueDate: assignment.dueDate?.slice(0, 10) ?? null,
    dueTime: assignment.dueTime,
    timeZone: assignment.timeZone,
    dueDateRaw: assignment.dueDateRaw,
    status: assignment.status
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const overdue = isAssignmentOverdue(assignment);

  return (
    <article className="assignment-card">
      <div className="review-header">
        <strong>{assignment.description}</strong>
        <span className={`status-badge assignment-${assignment.status}`}>{assignmentStatusLabels[assignment.status]}</span>
      </div>
      {overdue && <p className="overdue-note">Просрочено</p>}
      <div className="assignment-fields">
        <label>Поручение<textarea rows={2} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <label>Исполнитель<input value={draft.assigneeName ?? ""} onChange={(event) => setDraft({ ...draft, assigneeName: event.target.value || null })} placeholder="Не указан" /></label>
        <label>Дата<input type="date" value={draft.dueDate ?? ""} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || null })} /></label>
        <label>Время<input type="time" value={draft.dueTime ?? ""} onChange={(event) => setDraft({ ...draft, dueTime: event.target.value || null })} /></label>
        <label>Часовой пояс<input value={draft.timeZone ?? ""} onChange={(event) => setDraft({ ...draft, timeZone: event.target.value || null })} placeholder="Europe/Moscow" /></label>
        <label>Исходный срок<input value={draft.dueDateRaw ?? ""} onChange={(event) => setDraft({ ...draft, dueDateRaw: event.target.value || null })} placeholder="Например, до пятницы" /></label>
        <label>Статус<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as AssignmentStatus })}>{Object.entries(assignmentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <p className="source-note">Срок: {formatAssignmentDeadline(assignment)}</p>
      {assignment.sourceQuote && <blockquote className="evidence-quote"><span>Источник</span>«{assignment.sourceQuote}»</blockquote>}
      <div className="row">
        <button className="primary-button" type="button" disabled={busy || !draft.description.trim()} onClick={() => void onSave(assignment.id, draft)}>Сохранить поручение</button>
        <button className="secondary-button" type="button" onClick={() => setHistoryOpen(!historyOpen)}>{historyOpen ? "Скрыть историю" : `История (${assignment.history.length})`}</button>
      </div>
      {historyOpen && (
        <ol className="history-list">
          {assignment.history.length === 0 && <li>Изменений пока нет.</li>}
          {assignment.history.map((item) => <li key={item.id}>{new Date(item.changedAt).toLocaleString("ru-RU")} · автор: {item.actorUserId} · изменено: {item.changesJson.changedFields?.join(", ") ?? "данные поручения"}</li>)}
        </ol>
      )}
    </article>
  );
}

export function AssignmentList({ assignments, busy, onSave }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssignmentStatus | "all">("all");
  const filtered = useMemo(() => assignments.filter((item) => {
    const matchesText = `${item.description} ${item.assigneeName ?? ""}`.toLocaleLowerCase("ru-RU").includes(query.toLocaleLowerCase("ru-RU"));
    return matchesText && (status === "all" || item.status === status);
  }), [assignments, query, status]);

  return (
    <div className="stack">
      <div className="assignment-filters">
        <label>Поиск<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Текст или исполнитель" /></label>
        <label>Статус<select value={status} onChange={(event) => setStatus(event.target.value as AssignmentStatus | "all")}><option value="all">Все</option>{Object.entries(assignmentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {filtered.length === 0 && <p className="empty-state">Поручения не найдены.</p>}
      {filtered.map((assignment) => <AssignmentCard key={`${assignment.id}-${assignment.updatedAt}`} assignment={assignment} busy={busy} onSave={onSave} />)}
    </div>
  );
}

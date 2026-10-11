type AssignmentDeadline = {
  dueDate: string | null;
  dueTime: string | null;
  timeZone: string | null;
  dueDateRaw: string | null;
};

export function formatAssignmentDeadline(assignment: AssignmentDeadline) {
  const dueDate = assignment.dueDate?.slice(0, 10);
  if (!dueDate) return assignment.dueDateRaw ?? "без срока";

  const dateTime = assignment.dueTime ? `${dueDate}, ${assignment.dueTime}` : dueDate;
  return assignment.timeZone ? `${dateTime} (${assignment.timeZone})` : dateTime;
}

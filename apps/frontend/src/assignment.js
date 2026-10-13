export const assignmentStatusLabels = {
    new: "Новое",
    in_progress: "В работе",
    done: "Выполнено",
    cancelled: "Отменено"
};
function zonedDeadline(day, time, timeZone) {
    if (!timeZone)
        return new Date(`${day}T${time}:00`);
    const [year, month, date] = day.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const utcGuess = Date.UTC(year, month - 1, date, hour, minute);
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23"
        }).formatToParts(new Date(utcGuess));
        const values = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
        const offset = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - utcGuess;
        return new Date(utcGuess - offset);
    }
    catch {
        return new Date(`${day}T${time}:00`);
    }
}
export function isAssignmentOverdue(assignment, now = new Date()) {
    if (!assignment.dueDate || assignment.status === "done" || assignment.status === "cancelled")
        return false;
    const day = assignment.dueDate.slice(0, 10);
    const time = assignment.dueTime ?? "23:59";
    const deadline = zonedDeadline(day, time, assignment.timeZone);
    return Number.isFinite(deadline.getTime()) && deadline < now;
}

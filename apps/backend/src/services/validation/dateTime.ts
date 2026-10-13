import { z } from "zod";

export function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isClockTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [, hourText, minuteText] = match;
  return Number(hourText) <= 23 && Number(minuteText) <= 59;
}

export const calendarDateSchema = z.string().refine(isCalendarDate, "Invalid calendar date");
export const clockTimeSchema = z.string().refine(isClockTime, "Invalid clock time");

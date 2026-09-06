import { DayOfWeek } from '@fitness/types';

export function formatIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Today's local calendar date as `YYYY-MM-DD` — not UTC, since a day's steps
 * and routine progress belong to the day the device says it is. */
export function todayIsoDate(): string {
  return formatIsoDate(new Date());
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Full weekday name (e.g. "Tuesday") for a local `YYYY-MM-DD` date string. */
export function weekdayName(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
}

const DAY_OF_WEEK_BY_INDEX: DayOfWeek[] = [
  DayOfWeek.Sunday,
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
];

/** Weekday enum value (see `DayOfWeek`) for a local `YYYY-MM-DD` date string
 * — mirrors the API's `dayOfWeekOf` in `DietPlansService`, used client-side
 * to match a diet plan's per-weekday targets to this week's actual dates. */
export function dayOfWeekOf(date: string): DayOfWeek {
  const [year, month, day] = date.split('-').map(Number);
  return DAY_OF_WEEK_BY_INDEX[new Date(year, month - 1, day).getDay()];
}

/** The 7 local-calendar dates (Sunday first) of the week containing today. */
export function currentWeekDates(): string[] {
  const now = new Date();
  const sunday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay(),
  );
  return Array.from({ length: 7 }, (_, i) =>
    formatIsoDate(
      new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i),
    ),
  );
}


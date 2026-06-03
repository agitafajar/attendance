const JAKARTA_TIME_ZONE = 'Asia/Jakarta';
const JAKARTA_UTC_OFFSET_MINUTES = 7 * 60;

const jakartaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAKARTA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toJakartaDateOnly(value: string | Date) {
  if (typeof value === 'string') {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = Object.fromEntries(
    jakartaDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
  );
}

export function jakartaDateTimeToUtc(
  dateOnly: Date,
  hours: number,
  minutes: number,
) {
  const minutesFromUtcMidnight =
    hours * 60 + minutes - JAKARTA_UTC_OFFSET_MINUTES;
  return new Date(dateOnly.getTime() + minutesFromUtcMidnight * 60_000);
}

export function getTimeOnlyUtcParts(value: Date) {
  return {
    hours: value.getUTCHours(),
    minutes: value.getUTCMinutes(),
  };
}

export function getJakartaMonthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNumber, 0));

  return { startDate, endDate };
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

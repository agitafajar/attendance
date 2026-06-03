import {
  getTimeOnlyUtcParts,
  jakartaDateTimeToUtc,
  toJakartaDateOnly,
} from './jakarta-date';

describe('jakarta-date helpers', () => {
  it('maps late UTC night to the next Jakarta date', () => {
    const dateOnly = toJakartaDateOnly(new Date('2026-06-02T18:00:00.000Z'));

    expect(dateOnly.toISOString()).toBe('2026-06-03T00:00:00.000Z');
  });

  it('keeps explicit date-only strings stable', () => {
    const dateOnly = toJakartaDateOnly('2026-06-02');

    expect(dateOnly.toISOString()).toBe('2026-06-02T00:00:00.000Z');
  });

  it('converts shift time from Jakarta date to UTC instant', () => {
    const attendanceDate = toJakartaDateOnly('2026-06-02');
    const shiftTime = new Date('1970-01-01T08:00:00.000Z');
    const { hours, minutes } = getTimeOnlyUtcParts(shiftTime);
    const shiftStartAt = jakartaDateTimeToUtc(
      attendanceDate,
      hours,
      minutes + 10,
    );

    expect(shiftStartAt.toISOString()).toBe('2026-06-02T01:10:00.000Z');
  });
});

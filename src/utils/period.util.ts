import moment from 'moment-timezone';

// Set default timezone (adjust if needed, e.g., 'Asia/Ho_Chi_Minh')
const DEFAULT_TIMEZONE = 'UTC';
moment.tz.setDefault(DEFAULT_TIMEZONE);

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// Constant for validation purposes
export const VALID_PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
export const CUSTOM_PERIOD: Period = 'custom'; // Constant for 'custom' value

export interface PeriodResult {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculates the start and end dates for a given period string or custom dates.
 * Defaults to the last 30 days if no period or invalid dates are provided.
 * Ensures dates are in the specified timezone (or default UTC).
 *
 * @param period - Optional period string ('daily', 'weekly', 'monthly', 'yearly', 'custom').
 * @param customStartDate - Optional start date string (YYYY-MM-DD). Required if period is 'custom'.
 * @param customEndDate - Optional end date string (YYYY-MM-DD). Required if period is 'custom'.
 * @param tz - Optional timezone string (default: 'UTC').
 * @returns An object containing the calculated startDate and endDate as Date objects.
 */
export const getDateRangeFromPeriod = (
  period?: Period,
  customStartDate?: string,
  customEndDate?: string,
  tz: string = DEFAULT_TIMEZONE
): PeriodResult => {
  let start: moment.Moment;
  let end: moment.Moment;
  const now = moment.tz(tz);

  if (period === CUSTOM_PERIOD && customStartDate && customEndDate) {
    // Use strict parsing for YYYY-MM-DD
    const parsedStart = moment.tz(customStartDate, 'YYYY-MM-DD', true, tz);
    const parsedEnd = moment.tz(customEndDate, 'YYYY-MM-DD', true, tz);

    // Validate custom dates
    if (parsedStart.isValid() && parsedEnd.isValid() && !parsedStart.isAfter(parsedEnd)) {
      start = parsedStart.startOf('day');
      end = parsedEnd.endOf('day');
      return { startDate: start.toDate(), endDate: end.toDate() };
    }
    // Fall through to default if custom dates are invalid or format is wrong
  }

  switch (period) {
    case 'daily':
      start = now.clone().startOf('day'); // Use clone to avoid mutating 'now'
      end = now.clone().endOf('day');
      break;
    case 'weekly':
      start = now.clone().startOf('week'); // Moment's startOf('week') depends on locale
      end = now.clone().endOf('week');
      break;
    case 'monthly':
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
      break;
    case 'yearly':
      start = now.clone().startOf('year');
      end = now.clone().endOf('year');
      break;
    default: // Default to Last 30 Days
      end = now.clone().endOf('day');
      start = now.clone().subtract(29, 'days').startOf('day'); // Inclusive of today
      break;
  }

  return { startDate: start.toDate(), endDate: end.toDate() };
};

/**
 * Formats a date object into YYYY-MM-DD string in the specified timezone.
 * @param date - The Date object to format.
 * @param tz - Optional timezone string (default: 'UTC').
 * @returns Formatted date string.
 */
export const formatDate = (date: Date, tz: string = DEFAULT_TIMEZONE): string => {
    return moment(date).tz(tz).format('YYYY-MM-DD');
}

/**
 * Generates an array of date strings (YYYY-MM-DD) between a start and end date.
 * @param startDate - The start Date object.
 * @param endDate - The end Date object.
 * @param tz - Optional timezone string (default: 'UTC').
 * @returns Array of date strings.
 */
export const getDateRangeArray = (startDate: Date, endDate: Date, tz: string = DEFAULT_TIMEZONE): string[] => {
    const dates: string[] = [];
    let current = moment(startDate).tz(tz);
    const end = moment(endDate).tz(tz);

    while (current.isSameOrBefore(end, 'day')) { // Use isSameOrBefore for inclusive range
        dates.push(current.format('YYYY-MM-DD'));
        current.add(1, 'day');
    }
    return dates;
}
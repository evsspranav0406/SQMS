import { parseISO, format, isValid } from 'date-fns';

/**
 * Parses a date string and returns it formatted as 'yyyy-MM-dd'.
 * If input is invalid or empty, returns null.
 * @param {string} dateStr - The date string to parse.
 * @returns {string|null} - Formatted date string or null.
 */
export function parseAndFormatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const parsedDate = parseISO(dateStr);
    if (!isValid(parsedDate)) return null;
    return format(parsedDate, 'yyyy-MM-dd');
  } catch {
    return null;
  }
}

/**
 * Converts a Date object to IST date string in 'yyyy-MM-dd' format.
 * @param {Date} date - The Date object to convert.
 * @returns {string} - The IST date string.
 */
export function toISTDateString(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }
  // IST is UTC + 5:30
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000; // 5 hours 30 minutes in milliseconds
  const istDate = new Date(utc + istOffset);
  return format(istDate, 'yyyy-MM-dd');
}

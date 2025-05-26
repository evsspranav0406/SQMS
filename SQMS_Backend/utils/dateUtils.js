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

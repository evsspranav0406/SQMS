import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
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

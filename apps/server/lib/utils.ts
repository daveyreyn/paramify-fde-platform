import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact count: 1428 -> "1.4k", 9043 -> "9k", 188 -> "188". */
export function formatCount(n: number) {
  if (n >= 1000) {
    return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  }
  return n.toLocaleString();
}

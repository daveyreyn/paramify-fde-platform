'use client';

import { useTheme as useNextTheme } from 'next-themes';

// Thin adapter over next-themes so ported components keep the prototype's
// { theme, toggleTheme } shape. next-themes handles SSR + the no-flash script.
export function useTheme() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return { theme, toggleTheme };
}

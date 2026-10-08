import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('ips_theme');
    if (saved) return saved === 'dark';
    return true; // Default dark mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('ips_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('ips_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return { isDark, toggleTheme };
}

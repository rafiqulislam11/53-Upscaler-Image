import { useState, useEffect } from 'react';
import { HistoryItem } from '@shared/types';

const STORAGE_KEY = 'ips_recent_history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    } catch {
      // ignore storage quota errors
    }
  }, [history]);

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'date'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString()
    };
    setHistory(prev => [newItem, ...prev.filter(h => h.resultUrl !== item.resultUrl)]);
  };

  const removeHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addHistoryItem, removeHistoryItem, clearHistory };
}

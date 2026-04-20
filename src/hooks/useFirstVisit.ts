import { useState } from 'react';

const KEY = 'bakra:visited';

export function useFirstVisit() {
  const [isFirstVisit] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(KEY) !== '1';
    } catch {
      return false;
    }
  });

  const markVisited = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // ignore
    }
  };

  return { isFirstVisit, markVisited };
}

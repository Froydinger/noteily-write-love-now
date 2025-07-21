import { useEffect, useCallback } from 'react';

interface UseAutoSaveProps {
  onSave: (data: any) => void;
  delay?: number;
}

export function useAutoSave({ onSave, delay = 500 }: UseAutoSaveProps) {
  const debouncedSave = useCallback(
    (data: any) => {
      const timeoutId = setTimeout(() => {
        onSave(data);
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [onSave, delay]
  );

  return debouncedSave;
}
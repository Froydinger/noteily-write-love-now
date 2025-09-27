import { useState, useCallback } from 'react';

interface UndoRedoState {
  title: string;
  content: string;
}

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([]);

  const saveState = useCallback((title: string, content: string) => {
    setUndoStack(prev => [...prev, { title, content }]);
    setRedoStack([]); // Clear redo stack when new state is saved
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return null;
    
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      
      const newUndoStack = prev.slice(0, -1);
      const previousState = prev[prev.length - 1];
      
      // Move the undone state to redo stack
      setRedoStack(redoPrev => [...redoPrev, previousState]);
      
      return newUndoStack;
    });
    
    return undoStack[undoStack.length - 1];
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;
    
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      
      const newRedoStack = prev.slice(0, -1);
      const nextState = prev[prev.length - 1];
      
      // Move the redone state back to undo stack
      setUndoStack(undoPrev => [...undoPrev, nextState]);
      
      return newRedoStack;
    });
    
    return redoStack[redoStack.length - 1];
  }, [redoStack]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  };
}
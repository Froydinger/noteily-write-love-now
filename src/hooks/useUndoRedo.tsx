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

  const undo = useCallback((currentState?: UndoRedoState): UndoRedoState | null => {
    if (undoStack.length === 0) return null;
    
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    // Add current state to redo stack if provided
    if (currentState) {
      setRedoStack(prev => [...prev, currentState]);
    }
    
    return previousState;
  }, [undoStack]);

  const redo = useCallback((currentState?: UndoRedoState): UndoRedoState | null => {
    if (redoStack.length === 0) return null;
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    // Add current state to undo stack if provided
    if (currentState) {
      setUndoStack(prev => [...prev, currentState]);
    }
    
    return nextState;
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
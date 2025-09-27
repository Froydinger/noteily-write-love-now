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
    
    // Get the current state from the last item in undo stack
    const previousState = undoStack[undoStack.length - 1];
    
    // Remove it from undo stack and add it to redo stack
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, previousState]);
    
    return previousState;
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;
    
    // Get the state to redo
    const nextState = redoStack[redoStack.length - 1];
    
    // Remove it from redo stack and add it back to undo stack
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextState]);
    
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
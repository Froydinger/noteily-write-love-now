
import React, { createContext, useState, useContext, useEffect } from 'react';

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type WritingPrompt = {
  id: string;
  text: string;
};

type NoteContextType = {
  notes: Note[];
  currentNote: Note | null;
  writingPrompts: WritingPrompt[];
  addNote: () => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  setCurrentNote: (note: Note | null) => void;
  getRandomPrompt: () => WritingPrompt;
};

const defaultPrompts: WritingPrompt[] = [
  { id: '1', text: "What made you smile today?" },
  { id: '2', text: "Write a letter to your future self." },
  { id: '3', text: "List three things you're grateful for today." },
  { id: '4', text: "What's something you're proud of that you rarely share?" },
  { id: '5', text: "Describe your perfect day." },
  { id: '6', text: "What's a challenge you've overcome recently?" },
  { id: '7', text: "Write about a memory that makes you feel loved." },
  { id: '8', text: "If your emotions were weather, what's the forecast today?" },
  { id: '9', text: "What boundaries do you need to set or maintain?" },
  { id: '10', text: "What would you say to yourself as a child?" },
  { id: '11', text: "Describe a moment when you felt completely at peace." },
  { id: '12', text: "What are you learning about yourself right now?" },
];

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [writingPrompts] = useState<WritingPrompt[]>(defaultPrompts);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    
    setNotes(prevNotes => [newNote, ...prevNotes]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { 
              ...note, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            } 
          : note
      )
    );
    
    if (currentNote && currentNote.id === id) {
      setCurrentNote({ 
        ...currentNote, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      });
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (currentNote && currentNote.id === id) {
      setCurrentNote(null);
    }
  };

  const getNote = (id: string) => {
    return notes.find(note => note.id === id);
  };

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * writingPrompts.length);
    return writingPrompts[randomIndex];
  };

  return (
    <NoteContext.Provider 
      value={{ 
        notes, 
        currentNote, 
        writingPrompts,
        addNote, 
        updateNote, 
        deleteNote, 
        getNote,
        setCurrentNote,
        getRandomPrompt
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = (): NoteContextType => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};

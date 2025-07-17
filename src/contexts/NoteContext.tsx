
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  category?: 'reflection' | 'creative' | 'gratitude' | 'growth' | 'healing';
};

type NoteContextType = {
  notes: Note[];
  currentNote: Note | null;
  writingPrompts: WritingPrompt[];
  dailyPrompts: WritingPrompt[];
  loading: boolean;
  addNote: () => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
  setCurrentNote: (note: Note | null) => void;
  getRandomPrompt: () => WritingPrompt;
  refreshDailyPrompts: () => void;
};

const defaultPrompts: WritingPrompt[] = [
  { id: '1', text: "What made you smile today?", category: 'reflection' },
  { id: '2', text: "Write a letter to your future self.", category: 'growth' },
  { id: '3', text: "List three things you're grateful for today.", category: 'gratitude' },
  { id: '4', text: "What's something you're proud of that you rarely share?", category: 'reflection' },
  { id: '5', text: "Describe your perfect day.", category: 'creative' },
  { id: '6', text: "What's a challenge you've overcome recently?", category: 'growth' },
  { id: '7', text: "Write about a memory that makes you feel loved.", category: 'healing' },
  { id: '8', text: "If your emotions were weather, what's the forecast today?", category: 'creative' },
  { id: '9', text: "What boundaries do you need to set or maintain?", category: 'healing' },
  { id: '10', text: "What would you say to yourself as a child?", category: 'healing' },
  { id: '11', text: "Describe a moment when you felt completely at peace.", category: 'reflection' },
  { id: '12', text: "What are you learning about yourself right now?", category: 'growth' },
  { id: '13', text: "Write a six-word story about your day.", category: 'creative' },
  { id: '14', text: "If your body could speak, what would it say?", category: 'healing' },
  { id: '15', text: "What do you need permission for right now?", category: 'growth' },
  { id: '16', text: "Write a thank you note to someone who will never read it.", category: 'gratitude' },
  { id: '17', text: "What limiting belief is holding you back?", category: 'growth' },
  { id: '18', text: "What's your earliest memory of feeling joy?", category: 'reflection' },
  { id: '19', text: "Create a dialogue between your present self and your past self.", category: 'creative' },
  { id: '20', text: "What have you let go of that once seemed important?", category: 'growth' },
  { id: '21', text: "Describe your day as if it were a scene in your favorite book.", category: 'creative' },
  { id: '22', text: "What are you avoiding facing right now?", category: 'healing' },
  { id: '23', text: "List 5 tiny joys you experienced this week.", category: 'gratitude' },
  { id: '24', text: "What does your inner critic say, and how would you respond with kindness?", category: 'healing' },
  { id: '25', text: "Write about something ordinary that suddenly seemed extraordinary.", category: 'reflection' },
  { id: '26', text: "What part of yourself are you still discovering?", category: 'growth' },
  { id: '27', text: "Write a love letter to your body.", category: 'healing' },
  { id: '28', text: "What advice would your future self give you?", category: 'growth' },
  { id: '29', text: "Describe a small act of kindness you witnessed or experienced.", category: 'gratitude' },
  { id: '30', text: "What fills your cup when you're feeling depleted?", category: 'reflection' },
  { id: '31', text: "Write about a place that feels like home to you.", category: 'reflection' },
  { id: '32', text: "What's something you need to hear right now?", category: 'healing' },
  { id: '33', text: "If your heart could write a letter, what would it say?", category: 'creative' },
  { id: '34', text: "What are you resisting that might actually be good for you?", category: 'growth' },
  { id: '35', text: "Write a poem about how you're feeling without using any emotion words.", category: 'creative' },
  { id: '36', text: "What relationship in your life needs attention?", category: 'healing' },
  { id: '37', text: "What surprising thing are you grateful for?", category: 'gratitude' },
  { id: '38', text: "Write about a time you felt truly seen by someone else.", category: 'reflection' },
  { id: '39', text: "What's a truth you're ready to face?", category: 'growth' },
  { id: '40', text: "Create a conversation between two parts of yourself.", category: 'creative' }
];

const NoteContext = createContext<NoteContextType | undefined>(undefined);

// Helper to check if we need new prompts for the day
const shouldRefreshPrompts = (): boolean => {
  const lastRefreshDate = localStorage.getItem('lastPromptsRefreshDate');
  if (!lastRefreshDate) return true;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastRefreshDate);
  lastDate.setHours(0, 0, 0, 0);
  
  return today.getTime() > lastDate.getTime();
};

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [writingPrompts] = useState<WritingPrompt[]>(defaultPrompts);
  const [dailyPrompts, setDailyPrompts] = useState<WritingPrompt[]>(() => {
    const savedPrompts = localStorage.getItem('dailyPrompts');
    if (savedPrompts && !shouldRefreshPrompts()) {
      return JSON.parse(savedPrompts);
    }
    return getRandomPrompts(3);
  });
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load notes from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadNotes();
    } else {
      setNotes([]);
      setCurrentNote(null);
      setLoading(false);
    }
  }, [user]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        toast({
          title: "Error loading notes",
          description: "Failed to load your notes. Please try again.",
          variant: "destructive",
        });
      } else {
        const formattedNotes = data.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
        }));
        setNotes(formattedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Check at midnight if we need to refresh prompts
  useEffect(() => {
    const checkDailyReset = () => {
      if (shouldRefreshPrompts()) {
        refreshDailyPrompts();
      }
    };
    
    // Check initially
    checkDailyReset();
    
    // Set interval to check every hour (we don't need to check every second)
    const interval = setInterval(checkDailyReset, 1000 * 60 * 60);
    
    return () => clearInterval(interval);
  }, []);
  
  // Save daily prompts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dailyPrompts', JSON.stringify(dailyPrompts));
  }, [dailyPrompts]);

  function getRandomPrompts(count: number): WritingPrompt[] {
    const shuffled = [...writingPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  const refreshDailyPrompts = () => {
    const newPrompts = getRandomPrompts(3);
    setDailyPrompts(newPrompts);
    localStorage.setItem('lastPromptsRefreshDate', new Date().toISOString());
  };

  const addNote = async (): Promise<Note> => {
    if (!user) {
      throw new Error('User must be authenticated to add notes');
    }

    const tempNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add to local state
    setNotes(prevNotes => [tempNote, ...prevNotes]);

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          user_id: user.id,
          title: tempNote.title,
          content: tempNote.content,
        }])
        .select()
        .single();

      if (error) {
        // Revert optimistic update on error
        setNotes(prevNotes => prevNotes.filter(note => note.id !== tempNote.id));
        throw error;
      }

      // Update with actual database data
      const dbNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === tempNote.id ? dbNote : note
        )
      );

      return dbNote;
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error creating note",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) {
      console.error('User must be authenticated to update notes');
      return;
    }

    // Optimistically update local state
    const updatedNote = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id 
          ? { ...note, ...updatedNote }
          : note
      )
    );
    
    if (currentNote && currentNote.id === id) {
      setCurrentNote({ ...currentNote, ...updatedNote });
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: updates.title,
          content: updates.content,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating note:', error);
        // Could implement rollback here if needed
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) {
      console.error('User must be authenticated to delete notes');
      return;
    }

    // Optimistically update local state
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (currentNote && currentNote.id === id) {
      setCurrentNote(null);
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting note:', error);
        toast({
          title: "Error deleting note",
          description: "Failed to delete note. Please try again.",
          variant: "destructive",
        });
        // Could implement rollback here if needed
      }
    } catch (error) {
      console.error('Error deleting note:', error);
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
        dailyPrompts,
        loading,
        addNote, 
        updateNote, 
        deleteNote, 
        getNote,
        setCurrentNote,
        getRandomPrompt,
        refreshDailyPrompts
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

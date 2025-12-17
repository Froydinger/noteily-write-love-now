import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotes } from '@/contexts/NoteContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function RecentlyDeletedPage() {
  const { deletedNotes, loadDeletedNotes, restoreNote, permanentlyDeleteNote } = useNotes();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadDeleted = async () => {
      try {
        await loadDeletedNotes();
      } catch (error) {
        console.error('Error loading deleted notes:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadDeleted();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleRestore = async (noteId: string, noteTitle: string) => {
    try {
      await restoreNote(noteId);
      toast.success(`"${noteTitle}" has been restored`);
    } catch (error) {
      toast.error('Failed to restore note');
    }
  };

  const handlePermanentDelete = async (noteId: string, noteTitle: string) => {
    try {
      await permanentlyDeleteNote(noteId);
      toast.success(`"${noteTitle}" has been permanently deleted`);
    } catch (error) {
      toast.error('Failed to permanently delete note');
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from deletion
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading deleted notes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl min-h-screen">
      {/* Mobile layout: Recently Deleted text on far right, back button underneath */}
      <div className="md:hidden mb-6">
        {/* Top row: Back button left, title far right */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold">Recently Deleted</h1>
          </div>
        </div>
        
        {/* Bottom row: Description */}
        <div className="px-2 py-2">
          <p className="text-muted-foreground text-sm">
            Notes are automatically deleted after 7 days
          </p>
        </div>
      </div>

      {/* Desktop layout: Back button, title far right */}
      <div className="hidden md:flex items-center justify-between mb-6">
        {/* Left side: Back button */}
        <div className="flex items-center gap-4 px-2 py-2">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Right side: Title and description */}
        <div className="text-right">
          <h1 className="text-3xl font-bold">Recently Deleted</h1>
          <p className="text-muted-foreground mt-1">
            Notes are automatically deleted after 7 days
          </p>
        </div>
      </div>

      {deletedNotes.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Trash2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium mb-2">No deleted notes</h3>
          <p className="text-muted-foreground text-sm sm:text-base px-4">
            When you delete notes, they'll appear here for 7 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {deletedNotes.map((note) => {
            const daysRemaining = getDaysRemaining(note.deleted_at!);
            const deletedAgo = formatDistanceToNow(new Date(note.deleted_at!), { addSuffix: true });
            
            return (
              <Card key={note.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {note.title || 'Untitled Note'}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        Deleted {deletedAgo} • {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(note.id, note.title)}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Restore</span>
                        <span className="sm:hidden">↺</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0">
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base sm:text-lg">Delete permanently?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              This will permanently delete "{note.title || 'Untitled Note'}" and it cannot be recovered.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(note.id, note.title)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
                            >
                              Delete permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                {note.content && (
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                      {truncateContent(note.content.replace(/<[^>]*>/g, ''), 120)}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
      
      {deletedNotes.length > 0 && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 mt-0.5">
              ℹ️
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              <p className="font-medium mb-1">About recently deleted notes:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Notes are kept for 7 days after deletion</li>
                <li>You can restore notes anytime during this period</li>
                <li>After 7 days, notes are automatically and permanently deleted</li>
                <li>Shared notes cannot be restored once deleted</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
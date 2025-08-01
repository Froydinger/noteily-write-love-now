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
    const loadDeleted = async () => {
      setIsLoading(true);
      try {
        await loadDeletedNotes();
      } catch (error) {
        console.error('Error loading deleted notes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeleted();
  }, [loadDeletedNotes]);

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Recently Deleted</h1>
          <p className="text-muted-foreground mt-1">
            Notes are automatically deleted after 7 days
          </p>
        </div>
      </div>

      {deletedNotes.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No deleted notes</h3>
          <p className="text-muted-foreground">
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
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {note.title || 'Untitled Note'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Deleted {deletedAgo} • {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(note.id, note.title)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{note.title || 'Untitled Note'}" and it cannot be recovered.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(note.id, note.title)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {truncateContent(note.content.replace(/<[^>]*>/g, ''))}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
      
      {deletedNotes.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5">
              ℹ️
            </div>
            <div className="text-sm text-muted-foreground">
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
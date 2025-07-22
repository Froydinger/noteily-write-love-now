
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Note } from '@/contexts/NoteContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();
  
  const contentPreview = note.content 
    ? note.content
        .replace(/<br\s*\/?>/gi, ' ') // Convert line breaks to spaces
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces to regular spaces
        .replace(/&amp;/g, '&') // Convert encoded ampersands
        .replace(/&lt;/g, '<') // Convert encoded less-than
        .replace(/&gt;/g, '>') // Convert encoded greater-than
        .replace(/&quot;/g, '"') // Convert encoded quotes
        .replace(/&#39;/g, "'") // Convert encoded apostrophes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    : 'No content';
  
  const truncatedContent = contentPreview.length > 120 
    ? contentPreview.substring(0, 120) + '...'
    : contentPreview;

  const handleClick = () => {
    navigate(`/note/${note.id}`);
  };

  return (
    <Card 
      className="h-full cursor-pointer hover:border-noteily-300 transition-all hover:-translate-y-1"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <h3 className="font-medium text-lg mb-2 font-serif break-words overflow-wrap-anywhere leading-tight">{note.title || "Untitled Note"}</h3>
        <p className="text-sm text-muted-foreground line-clamp-4">{truncatedContent}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        Last modified {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </CardFooter>
    </Card>
  );
}

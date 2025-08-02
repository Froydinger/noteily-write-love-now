
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Note } from '@/contexts/NoteContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShareStatus } from './ShareStatus';

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();
  
  const contentPreview = note.content 
    ? note.content
        .replace(/<\/p>/gi, ' ') // Convert paragraph endings to spaces
        .replace(/<\/div>/gi, ' ') // Convert div endings to spaces
        .replace(/<br\s*\/?>/gi, ' ') // Convert line breaks to spaces
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces to regular spaces
        .replace(/&amp;/g, '&') // Convert encoded ampersands
        .replace(/&lt;/g, '<') // Convert encoded less-than
        .replace(/&gt;/g, '>') // Convert encoded greater-than
        .replace(/&quot;/g, '"') // Convert encoded quotes
        .replace(/&#39;/g, "'") // Convert encoded apostrophes
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
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
      className="h-full cursor-pointer group hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-lg animate-float-in"
      onClick={handleClick}
    >
      <CardContent className="p-4 transition-all duration-300 group-hover:translate-y-[-1px]">
        <h3 className="font-medium text-lg font-serif break-words overflow-wrap-anywhere leading-tight group-hover:text-primary transition-colors duration-300 mb-2">{note.title || "Untitled Note"}</h3>
        <div className="mb-3">
          <ShareStatus note={note} />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-4 group-hover:text-foreground/80 transition-colors duration-300">{truncatedContent}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground transition-all duration-300 group-hover:text-muted-foreground/80">
        Last modified {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </CardFooter>
    </Card>
  );
}

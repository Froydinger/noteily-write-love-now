import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedImageProps {
  imageUrl: string;
  onRemove: () => void;
}

export function FeaturedImage({ imageUrl, onRemove }: FeaturedImageProps) {
  return (
    <div className="relative mb-6 group">
      <img 
        src={imageUrl} 
        alt="Featured image" 
        className="w-full h-48 object-cover rounded-lg border border-border"
      />
      <Button
        size="sm"
        variant="destructive"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
        onClick={onRemove}
        aria-label="Remove featured image"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
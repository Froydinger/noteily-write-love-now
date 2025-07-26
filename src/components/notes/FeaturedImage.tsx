import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedImageProps {
  imageUrl: string;
  alt?: string;
  onDelete?: () => void;
}

export function FeaturedImage({ imageUrl, alt = "Featured image", onDelete }: FeaturedImageProps) {
  return (
    <div className="relative w-full mb-6 rounded-lg overflow-hidden group">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-auto object-cover"
        style={{ aspectRatio: '16/10' }}
      />
      {onDelete && (
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="bg-destructive/80 hover:bg-destructive backdrop-blur-sm"
            title="Remove featured image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
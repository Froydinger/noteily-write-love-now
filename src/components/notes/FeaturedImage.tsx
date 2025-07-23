import React from 'react';

interface FeaturedImageProps {
  imageUrl: string;
  alt?: string;
}

export function FeaturedImage({ imageUrl, alt = "Featured image" }: FeaturedImageProps) {
  return (
    <div className="w-full mb-6 rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-auto object-cover"
        style={{ aspectRatio: '16/10' }}
      />
    </div>
  );
}
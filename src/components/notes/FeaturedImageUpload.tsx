import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeaturedImageUploadProps {
  onImageUpload: (url: string) => void;
}

export function FeaturedImageUpload({ onImageUpload }: FeaturedImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleUpload = async (file: File) => {
    if (!user) {
      toast.error('Please sign in to upload images');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `featured-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      onImageUpload(publicUrl);
      toast.success('Featured image uploaded successfully');
    } catch (error) {
      console.error('Error uploading featured image:', error);
      toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
        aria-label="Upload featured image"
      >
        <ImagePlus className="h-4 w-4" />
        Featured Image
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple={false}
      />
    </>
  );
}
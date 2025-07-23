import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ImageUploadButtonProps {
  onImageInsert: (url: string) => void;
}

export function ImageUploadButton({ onImageInsert }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Check if we're on iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Check if file is an iCloud placeholder (common iOS issue)
  const isICloudPlaceholder = (file: File) => {
    // iCloud placeholders are often very small (< 1KB) or have specific characteristics
    return file.size < 1024 && isIOS();
  };

  const handleUpload = async (file: File) => {
    console.log('Starting image upload process...', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      isIOS: isIOS(),
      userId: user?.id 
    });
    
    if (!user) {
      console.error('No user found when trying to upload');
      toast.error('Please sign in to upload images');
      return;
    }

    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      toast.error('Please select an image file');
      return;
    }

    // Check for iCloud placeholder on iOS
    if (isICloudPlaceholder(file)) {
      console.error('iCloud placeholder detected');
      toast.error('This photo is stored in iCloud. Please download it to your device first by opening it in Photos app, then try again.');
      return;
    }

    // Additional check for very small files that might be placeholders
    if (file.size === 0) {
      console.error('File is empty (0 bytes)');
      toast.error('The selected file appears to be empty. Please try a different image.');
      return;
    }

    // iOS-specific: Enhanced file availability check
    if (isIOS()) {
      try {
        console.log('Performing iOS-specific file checks...');
        
        // Check 1: Try to read file as blob URL
        const blobUrl = URL.createObjectURL(file);
        const img = new Image();
        
        const imageLoadPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('Image failed to load - may be iCloud placeholder'));
          };
          
          // Timeout after 10 seconds
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('Image load timeout'));
          }, 10000);
        });
        
        img.src = blobUrl;
        await imageLoadPromise;
        
        // Check 2: Try to read the file data
        const reader = new FileReader();
        const fileCheckPromise = new Promise((resolve, reject) => {
          reader.onload = (e) => {
            if (e.target?.result && (e.target.result as ArrayBuffer).byteLength > 0) {
              resolve(true);
            } else {
              reject(new Error('File has no data'));
            }
          };
          reader.onerror = () => reject(new Error('File read error - not available'));
          reader.onabort = () => reject(new Error('File read aborted'));
        });
        
        reader.readAsArrayBuffer(file.slice(0, 2048)); // Read first 2KB
        await fileCheckPromise;
        console.log('iOS file availability checks passed');
        
      } catch (error) {
        console.error('iOS file availability check failed:', error);
        toast.error('This image is not fully available. If from iCloud, please open it in Photos app and wait for download, then try again.');
        return;
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading to path:', filePath);

    try {
      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, getting public URL...');

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      onImageInsert(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
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
        className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-shadow hidden"
        aria-label="Upload image"
      >
        <ImagePlus className="h-5 w-5" />
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
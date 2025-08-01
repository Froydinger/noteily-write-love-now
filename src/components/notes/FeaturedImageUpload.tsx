import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { isValidImageUrl } from "@/lib/sanitization";

interface FeaturedImageUploadProps {
  noteId: string;
  onImageSet: (url: string) => void;
  hasImage: boolean;
}

export function FeaturedImageUpload({ noteId, onImageSet, hasImage }: FeaturedImageUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  }, [toast]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 10, // 16:10 aspect ratio for featured images
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
  }, []);

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate the actual crop dimensions in the source image
    const sourceCropWidth = crop.width * scaleX;
    const sourceCropHeight = crop.height * scaleY;

    // Set minimum output width for high quality (maintain aspect ratio)
    const minOutputWidth = 1200;
    const aspectRatio = sourceCropWidth / sourceCropHeight;
    
    let outputWidth = Math.max(minOutputWidth, sourceCropWidth);
    let outputHeight = outputWidth / aspectRatio;

    // If the source is smaller than our minimum, use source dimensions
    if (sourceCropWidth < minOutputWidth) {
      outputWidth = sourceCropWidth;
      outputHeight = sourceCropHeight;
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      sourceCropWidth,
      sourceCropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to crop image');
        }
        resolve(blob);
      }, 'image/png'); // Use PNG for lossless quality
    });
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsUploading(true);

      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload images.",
          variant: "destructive",
        });
        return;
      }

      const fileName = `${user.id}/${noteId}-featured-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(fileName, croppedBlob, {
          contentType: 'image/png',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('note-images')
        .getPublicUrl(fileName);

      // Validate the generated URL before using it
      if (!isValidImageUrl(publicUrl)) {
        toast({
          title: "Invalid URL",
          description: "Generated image URL is not valid.",
          variant: "destructive",
        });
        return;
      }

      onImageSet(publicUrl);
      setShowCrop(false);
      setImageSrc('');

      toast({
        title: "Featured image set",
        description: "Your featured image has been uploaded successfully.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, user, noteId, onImageSet, toast, getCroppedImg]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="btn-accessible"
        title={hasImage ? "Change featured image" : "Add featured image"}
      >
        <ImagePlus className="h-4 w-4" />
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={showCrop} onOpenChange={setShowCrop}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Featured Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {imageSrc && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={16 / 10}
                  className="max-h-96"
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className="max-h-96 w-auto"
                  />
                </ReactCrop>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCrop(false);
                  setImageSrc('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropComplete}
                disabled={!completedCrop || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Set Featured Image'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
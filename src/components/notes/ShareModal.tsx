import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserPlus, Mail } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
}

export function ShareModal({ isOpen, onClose, noteId, noteTitle }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleShare = async () => {
    if (!email.trim() || !user) return;

    setIsSharing(true);
    try {
      // Check if user is trying to share with themselves
      if (email.toLowerCase().trim() === user.email?.toLowerCase()) {
        toast({
          title: "Cannot share with yourself",
          description: "You already have access to this note.",
          variant: "destructive",
        });
        return;
      }

      // Insert share record
      const { error } = await supabase
        .from('shared_notes')
        .insert({
          note_id: noteId,
          owner_id: user.id,
          shared_with_email: email.toLowerCase().trim(),
          permission: permission,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already shared",
            description: "This note is already shared with this email address.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Note shared successfully",
          description: `${noteTitle} has been shared with ${email}`,
        });
        setEmail('');
        onClose();
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Failed to share note",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSharing && email.trim()) {
      handleShare();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Share with Noteily User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSharing}
            />
          </div>

          <div className="space-y-3">
            <Label>Permission Level</Label>
            <RadioGroup value={permission} onValueChange={(value: 'read' | 'write') => setPermission(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="read" id="read" />
                <Label htmlFor="read" className="cursor-pointer">
                  <div>
                    <div className="font-medium">View Only</div>
                    <div className="text-sm text-muted-foreground">Can view but not edit the note</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="write" id="write" />
                <Label htmlFor="write" className="cursor-pointer">
                  <div>
                    <div className="font-medium">Can Edit</div>
                    <div className="text-sm text-muted-foreground">Can view and edit the note</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSharing}>
              Cancel
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={!email.trim() || isSharing}
              className="min-w-[100px]"
            >
              {isSharing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sharing...
                </>
              ) : (
                'Share Note'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
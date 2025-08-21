import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSharedNotes } from '@/hooks/useSharedNotes';
import { ShareStatus, SharePermissionIcon, ShareStatusText } from './ShareStatus';
import { Loader2, UserPlus, Mail, Trash2, Users, UserX, AlertCircle } from 'lucide-react';
import type { NoteWithSharing } from '@/types/sharing';


interface ShareManagerProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteWithSharing;
  onShareUpdate?: () => void;
}

export function ShareManager({ isOpen, onClose, note, onShareUpdate }: ShareManagerProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    sharedUsers,
    loading,
    loadShares,
    addShare,
    updateShare,
    removeShare,
  } = useSharedNotes(note.id);

  

  // Load shares when dialog opens
  useEffect(() => {
    if (isOpen && note.isOwnedByUser) {
      loadShares(note.id);
    }
  }, [isOpen, note.id, note.isOwnedByUser, loadShares]);

  // Prevent auto-focus on input when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure dialog is rendered, then blur any focused input
      setTimeout(() => {
        const input = document.getElementById('email-or-username');
        if (input && document.activeElement === input) {
          (input as HTMLInputElement).blur();
        }
      }, 50);
    }
  }, [isOpen]);

  const handleAddShare = async () => {
    if (!emailOrUsername.trim()) return;

    setIsAdding(true);
    try {
      const result = await addShare({
        noteId: note.id,
        emailOrUsername: emailOrUsername.trim(),
        permission
      });

      if (result.success) {
        // Email notification will be automatically triggered by database trigger
        setEmailOrUsername('');
        setPermission('read');
        onShareUpdate?.();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'read' | 'write') => {
    await updateShare({ shareId, permission: newPermission });
    onShareUpdate?.();
  };

  const handleRemoveShare = async (shareId: string) => {
    await removeShare({ shareId });
    onShareUpdate?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding && emailOrUsername.trim()) {
      handleAddShare();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-xl">
        <DialogHeader className="flex-shrink-0 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            {note.isOwnedByUser ? 'Manage Sharing' : 'Sharing Info'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* Note status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium truncate text-sm">{note.title || 'Untitled Note'}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {note.isOwnedByUser ? 'You own this note' : 'Shared with you'}
              </p>
            </div>
            <ShareStatus note={note} showText={false} />
          </div>

          {/* Content based on ownership */}
          {!note.isOwnedByUser ? (
            <div className="text-center py-6">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-3 text-sm">
                This note has been shared with you
              </p>
              <div className="flex items-center justify-center gap-2">
                <SharePermissionIcon permission={note.userPermission || 'read'} />
                <span className="text-sm font-medium">
                  <ShareStatusText permission={note.userPermission || 'read'} />
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Add new share section */}
              <div className="space-y-4 p-4 border rounded-lg bg-background">
                <h3 className="font-medium">Share with someone new</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email-or-username" className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Username or Email
                    </Label>
                    <Input
                      id="email-or-username"
                      type="text"
                      placeholder="username or email@example.com"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isAdding}
                      className="h-10"
                      autoFocus={false}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a username or email address
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Permission Level</Label>
                    <RadioGroup 
                      value={permission} 
                      onValueChange={(value: 'read' | 'write') => setPermission(value)}
                      className="flex flex-col gap-3 mt-2"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="read" id="read" />
                        <Label htmlFor="read" className="cursor-pointer flex items-center gap-2 text-sm">
                          <SharePermissionIcon permission="read" />
                          View Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="write" id="write" />
                        <Label htmlFor="write" className="cursor-pointer flex items-center gap-2 text-sm">
                          <SharePermissionIcon permission="write" />
                          Can Edit
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    onClick={handleAddShare} 
                    disabled={!emailOrUsername.trim() || isAdding}
                    className="w-full h-10 mt-4"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Person
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Current shares list - scrollable */}
              <div className="space-y-3 min-h-0">
                <h3 className="font-medium">Shared with ({sharedUsers.length})</h3>

                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : sharedUsers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Not shared with anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sharedUsers.map((share) => (
                      <div 
                        key={share.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
                      >
                         <div className="flex items-center gap-2 min-w-0">
                           <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                           <div className="min-w-0">
                             <div className="font-medium truncate text-sm">
                               {share.shared_with_username ? `@${share.shared_with_username}` : share.shared_with_email}
                             </div>
                             <div className="text-xs text-muted-foreground">
                               {share.shared_with_user_id ? 'Active user' : 'Pending invitation'}
                             </div>
                           </div>
                         </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={share.permission}
                            onValueChange={(value: 'read' | 'write') => 
                              handleUpdatePermission(share.id, value)
                            }
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">
                                <div className="flex items-center gap-2">
                                  <SharePermissionIcon permission="read" className="h-3 w-3" />
                                  <span className="text-xs">View Only</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="write">
                                <div className="flex items-center gap-2">
                                  <SharePermissionIcon permission="write" className="h-3 w-3" />
                                  <span className="text-xs">Can Edit</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveShare(share.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Dialog actions */}
        <div className="flex justify-end pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="h-9">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserPlus, Mail, Trash2, Users, Eye, Edit, UserX } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface SharedUser {
  id: string;
  shared_with_email: string;
  shared_with_user_id: string | null;
  permission: 'read' | 'write';
  created_at: string;
}

interface SharedNotesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  isOwner: boolean;
}

export function SharedNotesManager({ isOpen, onClose, noteId, noteTitle, isOwner }: SharedNotesManagerProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && isOwner) {
      loadSharedUsers();
    }
  }, [isOpen, noteId, isOwner]);

  const loadSharedUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .select('*')
        .eq('note_id', noteId)
        .eq('owner_id', user.id);

      if (error) throw error;
      setSharedUsers((data || []).map(item => ({
        ...item,
        permission: item.permission as 'read' | 'write'
      })));
    } catch (error) {
      console.error('Error loading shared users:', error);
      toast({
        title: "Failed to load shared users",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeShare = async (shareId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('shared_notes')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      setSharedUsers(prev => prev.filter(user => user.id !== shareId));
      toast({
        title: "Share removed",
        description: `Removed access for ${email}`,
      });
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: "Failed to remove share",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const updatePermission = async (shareId: string, newPermission: 'read' | 'write') => {
    try {
      const { error } = await supabase
        .from('shared_notes')
        .update({ permission: newPermission })
        .eq('id', shareId);

      if (error) throw error;

      setSharedUsers(prev => prev.map(user => 
        user.id === shareId ? { ...user, permission: newPermission } : user
      ));
      
      toast({
        title: "Permission updated",
        description: `Updated to ${newPermission} access`,
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Failed to update permission",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAddUserSuccess = () => {
    setShowAddUser(false);
    loadSharedUsers();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isOwner ? 'Manage Sharing' : 'Shared Note'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {!isOwner ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  This note has been shared with you
                </p>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Shared with ({sharedUsers.length})</h3>
                      <Button 
                        onClick={() => setShowAddUser(true)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add User
                      </Button>
                    </div>

                    {sharedUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Not shared with anyone yet</p>
                        <p className="text-sm">Click "Add User" to start sharing</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sharedUsers.map((sharedUser) => (
                          <div 
                            key={sharedUser.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{sharedUser.shared_with_email}</div>
                                <div className="text-sm text-muted-foreground">
                                  {sharedUser.shared_with_user_id ? 'Registered user' : 'Pending invitation'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <select
                                value={sharedUser.permission}
                                onChange={(e) => updatePermission(sharedUser.id, e.target.value as 'read' | 'write')}
                                className="text-sm border rounded px-2 py-1"
                              >
                                <option value="read">View Only</option>
                                <option value="write">Can Edit</option>
                              </select>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeShare(sharedUser.id, sharedUser.shared_with_email)}
                                className="text-destructive hover:text-destructive"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        noteId={noteId}
        noteTitle={noteTitle}
        onSuccess={handleAddUserSuccess}
      />
    </>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/components/ui/sidebar';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Share2, Edit3, Bell, Trash2, X } from 'lucide-react';

interface NotificationsPanelProps {
  children: React.ReactNode;
}

export function NotificationsPanel({ children }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.note_id) {
      navigate(`/note/${notification.note_id}`);
      setOpen(false); // Close notification panel
      setOpenMobile(false); // Close main sidebar on mobile
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent the notification click
    await deleteNotification(notificationId);
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'note_shared':
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case 'note_updated':
        return <Edit3 className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 sm:w-96 p-0">
        <SheetHeader className="p-4 border-b border-border/40">
          <div className="space-y-3">
            <SheetTitle className="flex items-center gap-3 text-lg font-serif">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 text-xs btn-accessible rounded-full"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Read all
                  </Button>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteAll}
                      className="h-8 text-xs btn-accessible rounded-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete all
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="p-4">
          <ScrollArea className="h-[calc(100vh-140px)]">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-sm font-medium">
                  No notifications yet
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  You'll see updates when notes are shared with you
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm border ${
                      !notification.read 
                        ? 'bg-primary/5 border-primary/20 shadow-sm' 
                        : 'bg-background border-border/60 hover:bg-accent/30'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground leading-tight">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true 
                            })}
                          </span>
                          {notification.from_user_email && (
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md truncate max-w-32">
                              {notification.from_user_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
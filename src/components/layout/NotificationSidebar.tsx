import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, RefreshCw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';; // Your Supabase client

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string; // e.g., 'application_approved', 'application_rejected'
  time: string;
  read: boolean;
  priority?: string; // e.g., 'high', 'medium', 'low'
}

interface NotificationSidebarProps {
  userRole: string;
}

export function NotificationSidebar({ userRole }: NotificationSidebarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Function to fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_role', userRole)
        .order('time', { ascending: false });

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to fetch notifications. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch notifications when the sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_role', userRole)
        .eq('read', false);

      if (error) {
        throw error;
      }

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({
        title: 'Notifications',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_role', userRole);

      if (error) {
        throw error;
      }

      setNotifications([]);
      toast({
        title: 'Notifications',
        description: 'All notifications cleared',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear notifications',
        variant: 'destructive',
      });
    }
  };

  const getNotificationColor = (type: string) => {
    switch (true) {
      case type.includes('approved'):
        return 'bg-green-100 border-green-300 text-green-800';
      case type.includes('rejected'):
        return 'bg-red-100 border-red-300 text-red-800';
      case type.includes('warning'):
        return 'bg-amber-100 border-amber-300 text-amber-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full absolute top-4 right-4"></div>;
      case 'medium':
        return <div className="w-2 h-2 bg-orange-500 rounded-full absolute top-4 right-4"></div>;
      case 'low':
        return <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-4 right-4"></div>;
      default:
        return null;
    }
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", isMobile ? "h-9 w-9" : "")}
          onClick={() => setIsOpen(true)}
        >
          <Bell className={cn("text-foreground", isMobile ? "h-4 w-4" : "h-5 w-5")} />
          {unreadCount > 0 && (
            <Badge
              className={cn(
                "absolute bg-red-500 text-white px-1.5 flex items-center justify-center rounded-full text-xs",
                isMobile ? "-top-1 -right-1 min-w-4 h-4" : "-top-2 -right-2 min-w-5 h-5"
              )}
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full sm:max-w-sm"
        side={isMobile ? "bottom" : "right"}
      >
        <SheetHeader className="flex-row justify-between items-center mb-4">
          <div>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              View and manage your notifications here.
            </SheetDescription>
          </div>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={markAllAsRead}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Separator className="mb-4" />

          <TabsContent value="all" className="m-0">
            <ScrollArea className={cn(isMobile ? "h-[40vh]" : "h-[calc(100vh-14rem)]", "overflow-y-auto pr-4")}>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors relative",
                        notification.read ? "bg-white border-gray-200" : "bg-orange-50 border-orange-200",
                        "hover:border-orange-300"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge variant="outline" className={cn("text-xs", getNotificationColor(notification.type))}>
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                      <p className="text-xs text-gray-500">{new Date(notification.time).toLocaleString()}</p>
                      {!notification.read && getPriorityIndicator(notification.priority)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className={cn(isMobile ? "h-[40vh]" : "h-[calc(100vh-14rem)]", "overflow-y-auto pr-4")}>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No unread notifications
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors relative",
                        "bg-orange-50 border-orange-200 hover:border-orange-300"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge variant="outline" className={cn("text-xs", getNotificationColor(notification.type))}>
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                      <p className="text-xs text-gray-500">{new Date(notification.time).toLocaleString()}</p>
                      {getPriorityIndicator(notification.priority)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-orange-600 border-orange-200"
            onClick={() => {
              fetchNotifications();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
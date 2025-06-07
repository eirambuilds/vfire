
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types/inspection';
import socketService from '@/utils/socketService';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Get user role 
    const role = user.role || 'owner'; // Default to 'owner' if role is not available
    
    try {
      // Initialize socket connection when user and role are available
      const socket = socketService.initialize(role);

      // Handle initial notifications
      socket.on('initialNotifications', (initialNotifications: Notification[]) => {
        setNotifications(initialNotifications);
      });

      // Handle new notifications
      socket.on('notification', (notification: Notification) => {
        // Only process notifications intended for this user role
        if (notification.userRole === role) {
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast for new notifications
          toast({
            title: notification.title,
            description: notification.description,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        }
      });

      return () => {
        socketService.disconnect();
      };
    } catch (err) {
      console.error('Socket initialization error in NotificationContext:', err);
    }
  }, [user, toast]);

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    try {
      // Send to server via socket
      socketService.sendNotification(notification);
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

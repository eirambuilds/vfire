
import { Notification } from "@/types/inspection";

// Mock notifications for all user roles
export const mockNotifications: Notification[] = [
  // Owner notifications
  {
    id: '1',
    title: 'Inspection Scheduled',
    description: 'Your establishment "ABC Store" has been scheduled for inspection on June 15, 2023.',
    time: '2 hours ago',
    read: false,
    type: 'info',
    userRole: 'owner',
    priority: 'medium'
  },
  {
    id: '2',
    title: 'Application Approved',
    description: 'Your FSIC application for "XYZ Restaurant" has been approved.',
    time: '1 day ago',
    read: false,
    type: 'success',
    userRole: 'owner',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Registration Pending',
    description: 'Your establishment registration for "123 Bakery" is pending admin review.',
    time: '2 days ago',
    read: true,
    type: 'warning',
    userRole: 'owner',
    priority: 'low'
  },
  
  // Inspector notifications
  {
    id: '4',
    title: 'New Inspection Assigned',
    description: 'You have been assigned to inspect "Grocery Store" on June 18, 2023.',
    time: '30 minutes ago',
    read: false,
    type: 'info',
    userRole: 'inspector',
    priority: 'high'
  },
  {
    id: '5',
    title: 'Inspection Priority Changed',
    description: 'Inspection for "Coffee Shop" has been marked as priority.',
    time: '3 hours ago',
    read: false,
    type: 'warning',
    userRole: 'inspector',
    priority: 'high'
  },
  {
    id: '6',
    title: 'Inspection Rescheduled',
    description: 'Inspection for "Bakery Plus" has been rescheduled to June 20, 2023.',
    time: '1 day ago',
    read: true,
    type: 'info',
    userRole: 'inspector',
    priority: 'medium'
  },
  
  // Admin notifications
  {
    id: '7',
    title: 'New Registration Request',
    description: 'A new establishment "Fast Food Chain" has requested registration.',
    time: '15 minutes ago',
    read: false,
    type: 'info',
    userRole: 'admin',
    priority: 'medium'
  },
  {
    id: '8',
    title: 'Inspector Report Submitted',
    description: 'Inspector John Doe has submitted a report for "Shopping Mall".',
    time: '4 hours ago',
    read: false,
    type: 'success',
    userRole: 'admin',
    priority: 'medium'
  },
  {
    id: '9',
    title: 'Urgent: System Alert',
    description: 'Multiple inspection scheduling conflicts detected for next week.',
    time: '2 days ago',
    read: true,
    type: 'error',
    userRole: 'admin',
    priority: 'high'
  }
];

// Function to get notifications by user role
export const getNotificationsByRole = (role: 'owner' | 'inspector' | 'admin'): Notification[] => {
  return mockNotifications.filter(notification => 
    notification.userRole === role || notification.userRole === undefined
  );
};

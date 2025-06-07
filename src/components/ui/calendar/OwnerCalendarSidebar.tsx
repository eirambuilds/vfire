
import React, { useState } from 'react';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { Search, Calendar as CalendarIcon, Bell, Filter, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Event, CalendarNotification, ApplicationType } from '@/types/inspection';
import { mockEvents } from '@/data/mockData';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface OwnerCalendarSidebarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  ownedEstablishmentIds: string[];
}

// Mock upcoming calendar notifications
const upcomingNotifications: CalendarNotification[] = [
  {
    id: '1',
    title: 'Inspection Tomorrow',
    message: 'FSIC Business inspection scheduled for Restaurant ABC',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    type: 'reminder',
    read: false,
    priority: 'high',
    relatedEventId: 'event1'
  },
  {
    id: '2',
    title: 'FSIC Certificate Expiring',
    message: 'Your FSIC certificate for Cafe XYZ will expire in 30 days',
    date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    type: 'deadline',
    read: false,
    priority: 'medium',
    relatedEventId: 'event2'
  },
  {
    id: '3',
    title: 'Inspection Cancelled',
    message: 'The FSEC inspection for Restaurant ABC has been cancelled',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'update',
    read: true,
    priority: 'low',
    relatedEventId: 'event3'
  }
];

export function OwnerCalendarSidebar({ events, onEventClick, ownedEstablishmentIds }: OwnerCalendarSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<ApplicationType[]>([]);
  const [filterEstablishment, setFilterEstablishment] = useState<string | null>(null);
  
  // Filter events by owner's establishments
  const ownerEvents = events.filter(event => 
    event.establishment_id && ownedEstablishmentIds.includes(event.establishment_id)
  );
  
  // Get next 5 upcoming inspections
  const today = new Date();
  const upcomingInspections = ownerEvents
    .filter(event => 
      event.type === 'inspection' && 
      isAfter(new Date(event.start), today) &&
      (!filterStatus.length || (event.status && filterStatus.includes(event.status))) &&
      (!filterTypes.length || (event.inspectionType && filterTypes.includes(event.inspectionType))) &&
      (!filterEstablishment || event.establishment_id === filterEstablishment) &&
      (searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(new Date(event.start), 'yyyy-MM-dd').includes(searchQuery))
    )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);
  
  // Get overdue events
  const overdueEvents = ownerEvents
    .filter(event => 
      (event.status === 'pending' || event.status === 'scheduled') && 
      isBefore(new Date(event.start), today) &&
      (!filterEstablishment || event.establishment_id === filterEstablishment)
    )
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  
  // Get upcoming deadlines
  const upcomingDeadlines = ownerEvents
    .filter(event => 
      event.type === 'deadline' && 
      isAfter(new Date(event.start), today) && 
      isBefore(new Date(event.start), addDays(today, 30)) &&
      (!filterEstablishment || event.establishment_id === filterEstablishment)
    )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Handle filter changes
  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const handleTypeFilterChange = (type: ApplicationType) => {
    setFilterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  // Function to determine badge color for status
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6 px-4 py-6 h-full overflow-hidden flex flex-col">
      {/* Search and Date Filter */}
      <div className="flex flex-col space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by date, type..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Filter Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-1 text-sm">
            <Filter className="h-4 w-4 text-orange-500" />
            Filters
          </h3>
        </div>
        
        <div className="space-y-3">
          {/* Inspection Type Filter */}
          <div>
            <Label className="text-xs text-muted-foreground">Inspection Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="fsec" 
                  checked={filterTypes.includes('FSEC')} 
                  onCheckedChange={() => handleTypeFilterChange('FSEC')} 
                  className="border-orange-300 data-[state=checked]:bg-orange-500"
                />
                <Label htmlFor="fsec" className="text-xs">FSEC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="fsic-business" 
                  checked={filterTypes.includes('FSIC-Business')} 
                  onCheckedChange={() => handleTypeFilterChange('FSIC-Business')} 
                  className="border-orange-300 data-[state=checked]:bg-orange-500"
                />
                <Label htmlFor="fsic-business" className="text-xs">FSIC-B</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="fsic-occupancy" 
                  checked={filterTypes.includes('FSIC-Occupancy')} 
                  onCheckedChange={() => handleTypeFilterChange('FSIC-Occupancy')} 
                  className="border-orange-300 data-[state=checked]:bg-orange-500"
                />
                <Label htmlFor="fsic-occupancy" className="text-xs">FSIC-O</Label>
              </div>
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="pending" 
                  checked={filterStatus.includes('pending')} 
                  onCheckedChange={() => handleStatusFilterChange('pending')} 
                  className="border-yellow-300 data-[state=checked]:bg-yellow-500"
                />
                <Label htmlFor="pending" className="text-xs">Pending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="scheduled" 
                  checked={filterStatus.includes('scheduled')} 
                  onCheckedChange={() => handleStatusFilterChange('scheduled')} 
                  className="border-blue-300 data-[state=checked]:bg-blue-500"
                />
                <Label htmlFor="scheduled" className="text-xs">Scheduled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="completed" 
                  checked={filterStatus.includes('completed')} 
                  onCheckedChange={() => handleStatusFilterChange('completed')} 
                  className="border-green-300 data-[state=checked]:bg-green-500"
                />
                <Label htmlFor="completed" className="text-xs">Completed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="cancelled" 
                  checked={filterStatus.includes('cancelled')} 
                  onCheckedChange={() => handleStatusFilterChange('cancelled')} 
                  className="border-red-300 data-[state=checked]:bg-red-500"
                />
                <Label htmlFor="cancelled" className="text-xs">Cancelled</Label>
              </div>
            </div>
          </div>
          
          {/* Establishment Filter */}
          <div>
            <Label className="text-xs text-muted-foreground">Establishment</Label>
            <Select 
              value={filterEstablishment || ''} 
              onValueChange={(value) => setFilterEstablishment(value || null)}
            >
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue placeholder="All establishments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All establishments</SelectItem>
                {ownedEstablishmentIds.map((id) => (
                  <SelectItem key={id} value={id}>Establishment {id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {/* Content Sections */}
      <ScrollArea className="flex-1 -mx-4 px-4 pb-4">
        <div className="space-y-6">
          {/* Upcoming Inspections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-1 text-sm">
                <CalendarIcon className="h-4 w-4 text-orange-500" />
                Upcoming Inspections
              </h3>
              <Button variant="link" size="sm" className="text-orange-600 h-auto p-0">
                View all
              </Button>
            </div>
            
            {upcomingInspections.length > 0 ? (
              <div className="space-y-2">
                {upcomingInspections.map((event) => (
                  <Card key={event.id} className="border-orange-100 bg-orange-50/50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />{format(new Date(event.start), 'MMM dd, yyyy - h:mm a')}
                          </div>
                        </div>
                        <Badge className={cn("text-xs", getStatusBadgeColor(event.status))}>
                          {event.status || 'Pending'}
                        </Badge>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-orange-600 p-0 h-auto mt-1"
                        onClick={() => onEventClick(event)}
                      >
                        View details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-2">
                No upcoming inspections found.
              </div>
            )}
          </div>
          
          {/* Urgent Actions (Overdue) */}
          {overdueEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-1 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Urgent Actions
                </h3>
              </div>
              
              <div className="space-y-2">
                {overdueEvents.map((event) => (
                  <Card key={event.id} className="border-red-200 bg-red-50/50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-red-700">{event.title}</div>
                          <div className="text-xs text-red-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Overdue: {format(new Date(event.start), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          Overdue
                        </Badge>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-red-600 p-0 h-auto mt-1"
                        onClick={() => onEventClick(event)}
                      >
                        View details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Upcoming Deadlines
                </h3>
              </div>
              
              <div className="space-y-2">
                {upcomingDeadlines.map((event) => (
                  <Card key={event.id} className="border-amber-100 bg-amber-50/50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {format(new Date(event.start), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-orange-600 p-0 h-auto mt-1"
                        onClick={() => onEventClick(event)}
                      >
                        View details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Reminders and Notifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-1 text-sm">
                <Bell className="h-4 w-4 text-orange-500" />
                Reminders & Notifications
              </h3>
              <Button variant="link" size="sm" className="text-orange-600 h-auto p-0">
                Mark all as read
              </Button>
            </div>
            
            <div className="space-y-2">
              {upcomingNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "border-orange-100",
                    notification.read ? "bg-white" : "bg-orange-50/50",
                    notification.priority === 'high' && !notification.read && "border-red-200"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-medium text-sm flex items-center gap-1">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                          )}
                          {notification.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.message}
                        </div>
                      </div>
                      <Badge 
                        className={cn(
                          "text-xs",
                          notification.priority === 'high' 
                            ? "bg-red-100 text-red-800" 
                            : notification.priority === 'medium'
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        )}
                      >
                        {notification.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

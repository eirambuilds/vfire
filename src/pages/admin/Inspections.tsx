import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchIcon, Eye, Calendar, X, Check, XCircle, CheckCircle, ChevronDown, CalendarIcon, InspectIcon, ClipboardList, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { v4 as uuidv4 } from 'uuid';
import { RejectInspectionDialog } from '@/components/admin/inspections/RejectInspectionDialog';
import { ApproveInspectionDialog } from '@/components/admin/inspections/ApproveInspectionDialog';
import { InspectionDetailsDialog } from '@/components/shared/inspections/InspectionDetailsDialog';
import { format, isValid, parse } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface Inspection {
  id: string;
  establishment_id: string;
  establishment_name: string;
  inspector_id?: string;
  inspector?: string | null;
  type: string;
  status: string;
  scheduled_date?: string | null;
  scheduled_end_date?: string | null;
  application_id: string;
  rejection_reason?: string | null;
  address: string;
  updated_at: string;
  establishmentType: string;
  scheduledDate?: string | null;
  inspectorId?: string;
  owner_name?: string | null;
  dti_number?: string | null;
}

interface User {
  duty_status: string;
  id: string;
  first_name: string;
  middleName?: string;
  last_name: string;
  role: string;
  availability_start_date?: string | null;
  availability_end_date?: string | null;
}

interface Application {
  id: string;
  establishment_id: string;
  type: string;
  status: string;
}

interface Establishment {
  id: string;
  name: string;
}

const AdminInspections = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState<string>('09');
  const [startMinute, setStartMinute] = useState<string>('00');
  const [startPeriod, setStartPeriod] = useState<string>('AM');
  const [endHour, setEndHour] = useState<string>('10');
  const [endMinute, setEndMinute] = useState<string>('00');
  const [endPeriod, setEndPeriod] = useState<string>('AM');
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hourOptions = ['08', '09', '10', '11', '12', '01', '02', '03', '04', '05'];
  const minuteOptions = ['00', '15', '30', '45'];
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const currentYear = new Date().getFullYear();
  const yearOptions = ['all', ...Array.from({ length: currentYear - 2025 + 1 }, (_, i) => (2025 + i).toString())];

  const startHourRef = useRef<HTMLInputElement>(null);
  const startMinuteRef = useRef<HTMLInputElement>(null);
  const endHourRef = useRef<HTMLInputElement>(null);
  const endMinuteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id, establishment_id, type, status')
          .in('type', ['FSIC-Occupancy', 'FSIC-Business'])
          .eq('status', 'approved');

        if (applicationsError) throw applicationsError;

        const { data: establishmentsData, error: establishmentsError } = await supabase
          .from('establishments')
          .select('id, name');

        if (establishmentsError) throw establishmentsError;

        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, duty_status, availability_start_date, availability_end_date');

        if (usersError) throw usersError;

        const { data: inspectionsData, error: inspectionsError } = await supabase
          .from('inspections')
          .select('id, establishment_id, establishment_name, inspector_id, inspector, type, status, scheduled_date, scheduled_end_date, application_id, rejection_reason');

        if (inspectionsError) throw inspectionsError;

        const inspectionData: Inspection[] = applicationsData.map((app: Application) => {
          const existingInspection = (inspectionsData as unknown as Inspection[])?.find((ins: Inspection) => ins.application_id === app.id);
          const establishment = establishmentsData.find((est: Establishment) => est.id === app.establishment_id);

          return existingInspection || {
            id: uuidv4(),
            establishment_id: app.establishment_id,
            establishment_name: establishment?.name || 'Unknown',
            inspector_id: null,
            inspector: null,
            type: app.type,
            status: 'pending',
            scheduled_date: null,
            scheduled_end_date: null,
            application_id: app.id,
            rejection_reason: null,
            address: '',
            updated_at: new Date().toISOString(),
            establishmentType: 'Unknown',
          };
        });

        const updatedInspectionsData = inspectionData.map((inspection) => {
          if (inspection.scheduled_date && new Date(inspection.scheduled_date) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return { ...inspection, status: 'cancelled' };
          }
          return inspection;
        });

        await supabase
          .from('inspections')
          .upsert(
            updatedInspectionsData
              .filter(ins => ins.status === 'cancelled')
              .map(ins => ({
                id: ins.id,
                establishment_id: ins.establishment_id,
                establishment_name: ins.establishment_name,
                inspector_id: ins.inspector_id || null,
                inspector: ins.inspector || null,
                type: ins.type,
                status: ins.status as 'cancelled' | 'pending' | 'scheduled' | 'inspected' | 'approved' | 'rejected',
                scheduled_date: ins.scheduled_date || null,
                scheduled_end_date: ins.scheduled_end_date || null,
                application_id: ins.application_id,
                rejection_reason: ins.rejection_reason || null,
              })),
            { onConflict: 'id' }
          );

        setInspections(updatedInspectionsData);
        setEstablishments(establishmentsData || []);
        setUsers(usersData.map((user: any) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          duty_status: user.duty_status,
          availability_start_date: user.availability_start_date,
          availability_end_date: user.availability_end_date
        })) || []);
        setApplications(applicationsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load inspections data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const statusPriority: { [key: string]: number } = {
    pending: 1,
    inspected: 2,
    cancelled: 3,
    scheduled: 4,
    approved: 5,
    rejected: 6,
  };

  const filteredInspections = inspections
    .filter((inspection: Inspection) => {
      const matchesSearch =
        (inspection.establishment_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inspection.inspector?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || inspection.status === filterStatus;
      const matchesType = filterType === 'all' || inspection.type === filterType;

      const scheduledDate = inspection.scheduled_date ? new Date(inspection.scheduled_date) : null;
      const matchesMonth =
        monthFilter === 'all' ||
        (scheduledDate && isValid(scheduledDate) && format(scheduledDate, 'MM') === monthFilter);
      const matchesYear =
        yearFilter === 'all' ||
        (scheduledDate && isValid(scheduledDate) && format(scheduledDate, 'yyyy') === yearFilter);

      return matchesSearch && matchesStatus && matchesType && matchesMonth && matchesYear;
    })
    .sort((a, b) => {
      const priorityA = statusPriority[a.status] || 7;
      const priorityB = statusPriority[b.status] || 7;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const dateA = a.scheduled_date ? new Date(a.scheduled_date) : new Date(0);
      const dateB = b.scheduled_date ? new Date(b.scheduled_date) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

  const totalItems = filteredInspections.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedInspections = filteredInspections.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExportToExcel = () => {
    const data = filteredInspections.map(inspection => ({
      'Establishment': inspection.establishment_name || 'Unknown',
      'Application Type': getApplicationType(inspection.application_id),
      'Inspector': inspection.inspector || 'Unassigned',
      'Scheduled Date & Time': inspection.scheduled_date && inspection.scheduled_end_date
        ? `${new Date(inspection.scheduled_date).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(inspection.scheduled_end_date).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} on ${new Date(inspection.scheduled_date).toLocaleDateString()}`
        : 'Not Scheduled',
      'Status': inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1),
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inspections');
    XLSX.writeFile(workbook, 'inspections_export.xlsx');
  };

  const getInspectorName = (id?: string) => {
    if (!id) return 'Unassigned';
    const inspector = users.find((user: User) => user.id === id);
    return inspector ? `${inspector.first_name} ${inspector.last_name}` : 'Unknown';
  };

  const getApplicationType = (id?: string) => {
    if (!id) return 'N/A';
    const application = applications.find((app: Application) => app.id === id);
    return application ? application.type : 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const badgeColors: { [key: string]: string } = {
      pending: '#FACC15',
      scheduled: '#3B82F6',
      inspected: '#8B5CF6',
      approved: '#22C55E',
      rejected: '#EF4444',
      cancelled: '#9CA3AF',
    };
    const color = badgeColors[status] || '#9CA3AF';
    return (
      <Badge
        variant="outline"
        style={{
          backgroundColor: color,
          color: '#1F2937', // text-gray-900 for contrast
          borderColor: color,
        }}
        className="hover:opacity-80 transition-opacity"
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isInspectorAvailable = (inspectorId: string, scheduledDate: string | null, scheduledEndDate: string | null) => {
    if (!scheduledDate || !scheduledEndDate || !selectedDate) return false;

    const scheduledStart = new Date(scheduledDate);
    const scheduledEnd = new Date(scheduledEndDate);
    
    const user = users.find(u => u.id === inspectorId);
    if (!user || user.duty_status !== 'on_duty' || !user.availability_start_date || !user.availability_end_date) {
      return false;
    }

    const availStart = new Date(user.availability_start_date);
    const availEnd = new Date(user.availability_end_date);

    const isWithinAvailability = selectedDate >= availStart && selectedDate <= availEnd;
    if (!isWithinAvailability) return false;

    const conflictingInspections = inspections.filter(ins => 
      ins.inspector_id === inspectorId &&
      ins.scheduled_date && 
      ins.scheduled_end_date &&
      ins.id !== inspectorId &&
      (
        (new Date(ins.scheduled_date) < scheduledEnd && new Date(ins.scheduled_end_date) > scheduledStart)
      )
    );

    return conflictingInspections.length === 0;
  };

  const handleScheduleAndAssign = async (inspectionId: string, date: Date | undefined, inspectorId: string | null) => {
    if (!date || !inspectorId) {
      toast({
        title: "Error",
        description: "Please select a date and inspector.",
        variant: "destructive",
      });
      return;
    }

    try {
      const startDateTime = new Date(date);
      const [startHours, startMinutes] = to24Hour(startHour, startMinute, startPeriod).split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(date);
      const [endHours, endMinutes] = to24Hour(endHour, endMinute, endPeriod).split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }

      const startDateTimePH = startDateTime.toISOString().replace('Z', '+08:00');
      const endDateTimePH = endDateTime.toISOString().replace('Z', '+08:00');

      if (!isInspectorAvailable(inspectorId, startDateTimePH, endDateTimePH)) {
        throw new Error("Selected inspector is not available at the scheduled time");
      }

      const inspection = inspections.find((ins: Inspection) => ins.id === inspectionId);
      const inspectorName = getInspectorName(inspectorId);

      const { error } = await supabase
        .from('inspections')
        .upsert({
          id: inspectionId,
          scheduled_date: startDateTimePH,
          scheduled_end_date: endDateTimePH,
          status: 'scheduled',
          application_id: inspection?.application_id,
          establishment_id: inspection?.establishment_id,
          type: inspection?.type,
          establishment_name: inspection?.establishment_name,
          inspector: inspectorName,
          inspector_id: inspectorId,
          rejection_reason: inspection?.rejection_reason,
        }, { onConflict: 'id' });

      if (error) throw error;

      const updatedInspections = inspections.map((inspection: Inspection) =>
        inspection.id === inspectionId
          ? { ...inspection, 
              scheduled_date: startDateTimePH, 
              scheduled_end_date: endDateTimePH, 
              status: 'scheduled',
              inspector: inspectorName,
              inspector_id: inspectorId 
            }
          : inspection
      );
      setInspections(updatedInspections);
      setCalendarOpen(null);
      setSelectedInspectorId(null);
      toast({
        title: "Inspection Scheduled",
        description: `Assigned to ${inspectorName} from ${startDateTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} to ${endDateTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} on ${startDateTime.toLocaleDateString()}`,
      });
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule inspection.",
        variant: "destructive",
      });
    }
  };

  const handleClearSchedule = async (inspectionId: string) => {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          scheduled_date: null,
          scheduled_end_date: null,
          status: 'pending',
          inspector_id: null,
          inspector: null,
        })
        .eq('id', inspectionId);

      if (error) throw error;

      const updatedInspections = inspections.map((inspection: Inspection) =>
        inspection.id === inspectionId
          ? { ...inspection, scheduled_date: null, scheduled_end_date: null, status: 'pending', inspector_id: null, inspector: null }
          : inspection
      );
      setInspections(updatedInspections);
      setCalendarOpen(null);
      setSelectedInspectorId(null);
      toast({
        title: "Schedule Cleared",
        description: "Inspection schedule has been reset to pending",
      });
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast({
        title: "Error",
        description: "Failed to clear schedule.",
        variant: "destructive",
      });
    }
  };

  const handleRejectInspection = async (inspectionId: string, reason: string) => {
    try {
      const inspection = inspections.find((ins: Inspection) => ins.id === inspectionId);
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', inspectionId);

      if (error) throw error;

      const updatedInspections = inspections.map((inspection: Inspection) =>
        inspection.id === inspectionId
          ? { 
              ...inspection, 
              status: 'rejected', 
              rejection_reason: reason 
            }
          : inspection
      );
      setInspections(updatedInspections);
      setRejectDialogOpen(false);
      setSelectedInspection(null);
      toast({
        title: "Inspection Rejected",
        description: `Inspection status is now rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to reject inspection.",
        variant: "destructive",
      });
    }
  };

  const handleApproveInspection = async (inspectionId: string, certificateUrl: string) => {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'approved',
          certificate_url: certificateUrl,
        })
        .eq('id', inspectionId);

      if (error) throw error;

      const updatedInspections = inspections.map((inspection: Inspection) =>
        inspection.id === inspectionId
          ? { ...inspection, status: 'approved', certificate_url: certificateUrl }
          : inspection
      );
      setInspections(updatedInspections);
      setApproveDialogOpen(false);
      setSelectedInspection(null);
      toast({
        title: "Inspection Approved",
        description: "Inspection has been approved and certificate uploaded.",
      });
    } catch (error) {
      console.error('Error approving inspection:', error);
      toast({
        title: "Error",
        description: "Failed to approve inspection.",
        variant: "destructive",
      });
    }
  };

  const onRejectHandler = (inspectionId: string, reason: string) => {
    handleRejectInspection(inspectionId, reason);
  };

  const onApproveHandler = (inspectionId: string, certificateUrl: string) => {
    handleApproveInspection(inspectionId, certificateUrl);
  };

  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return { hour: hour12.toString().padStart(2, '0'), minute: minutes, period };
  };

  const to24Hour = (hour: string, minute: string, period: string) => {
    let hourNum = parseInt(hour);
    if (period === 'PM' && hourNum !== 12) hourNum += 12;
    if (period === 'AM' && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  const validateHour = (hour: string) => {
    const hourNum = parseInt(hour);
    if (!hour || isNaN(hourNum) || hourNum < 1 || hourNum > 12) {
      return '09';
    }
    return hourNum.toString().padStart(2, '0');
  };

  const validateMinute = (minute: string) => {
    if (!minuteOptions.includes(minute)) {
      return '00';
    }
    return minute.padStart(2, '0');
  };

  const adjustEndTimeIfNeeded = () => {
    const start24 = to24Hour(startHour, startMinute, startPeriod);
    const end24 = to24Hour(endHour, endMinute, endPeriod);
    
    if (end24 <= start24) {
      const startHourNum = parseInt(startHour);
      const nextHour = startHourNum === 12 ? '01' : (startHourNum + 1).toString().padStart(2, '0');
      const nextPeriod = startHourNum === 11 ? (startPeriod === 'AM' ? 'PM' : 'AM') : startPeriod;
      
      setEndHour(nextHour);
      setEndMinute(startMinute);
      setEndPeriod(nextPeriod);
    }
  };

  useEffect(() => {
    adjustEndTimeIfNeeded();
  }, [startHour, startMinute, startPeriod]);

  return (
    <DashboardLayout title="Inspections Management" userRole="admin">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Inspections Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage inspections for establishments, schedule inspections, and approve or reject inspected establishments.
          </p>
        </div>
        
        <FadeInSection delay={200}>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all">All Inspection Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="inspected">Inspected</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all">All Inspection Types</SelectItem>
                    <SelectItem value="FSIC-Occupancy">Fire Safety Inspection Certificate (Occupancy)</SelectItem>
                    <SelectItem value="FSIC-Business">Fire Safety Inspection Certificate (Business)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Filter by month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all">All Years</SelectItem>
                    {yearOptions.slice(1).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative col-span-2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search inspections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-red-500 rounded-lg"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleExportToExcel}
                  className="w-full flex items-center gap-2 text-white rounded-lg"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>

        <FadeInSection delay={300}>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                      <TableHead className="text-gray-700 font-semibold">Establishment</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Application Type</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Inspector</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Scheduled Date & Time</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                      <TableHead className="text-right text-gray-700 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedInspections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          No inspections found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInspections.map((inspection: Inspection) => {
                        const startDate = inspection.scheduled_date
                          ? new Date(new Date(inspection.scheduled_date).getTime() + 8 * 60 * 60 * 1000)
                          : null;
                        const endDate = inspection.scheduled_end_date
                          ? new Date(new Date(inspection.scheduled_end_date).getTime() + 8 * 60 * 60 * 1000)
                          : null;

                        return (
                          <TableRow
                            key={inspection.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-medium text-gray-900">
                              {inspection.establishment_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-gray-700">{getApplicationType(inspection.application_id)}</TableCell>
                            <TableCell className="text-gray-700">
                              {inspection.inspector || 'Unassigned'}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {startDate && endDate
                                ? `${startDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} on ${startDate.toLocaleDateString()}`
                                : 'Not Scheduled'}
                            </TableCell>
                            <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {inspection.status === 'inspected' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                                      title="Approve"
                                      onClick={() => {
                                        setSelectedInspection(inspection);
                                        setApproveDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                                      title="Reject"
                                      onClick={() => {
                                        setSelectedInspection(inspection);
                                        setRejectDialogOpen(true);
                                      }}
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </Button>
                                  </>
                                )}
                                {inspection.status !== 'inspected' && inspection.status !== 'approved' && inspection.status !== 'rejected' && (
                                  <Dialog open={calendarOpen === inspection.id} onOpenChange={(open) => {
                                    setCalendarOpen(open ? inspection.id : null);
                                    if (open) {
                                      if (inspection.scheduled_date && inspection.scheduled_end_date) {
                                        const start = parseTime(format(new Date(inspection.scheduled_date), 'HH:mm'));
                                        const end = parseTime(format(new Date(inspection.scheduled_end_date), 'HH:mm'));
                                        setStartHour(start.hour);
                                        setStartMinute(start.minute);
                                        setStartPeriod(start.period);
                                        setEndHour(end.hour);
                                        setEndMinute(end.minute);
                                        setEndPeriod(end.period);
                                      } else {
                                        setStartHour('09');
                                        setStartMinute('00');
                                        setStartPeriod('AM');
                                        setEndHour('10');
                                        setEndMinute('00');
                                        setEndPeriod('AM');
                                      }
                                      setSelectedDate(inspection.scheduled_date ? new Date(inspection.scheduled_date) : undefined);
                                      setSelectedInspectorId(inspection.inspector_id || null);
                                    }
                                    if (!open) setOpenDropdown(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                        title="Schedule"
                                      >
                                        <CalendarIcon className="h-5 w-5" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px] md:max-w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                                          <CalendarIcon className="h-6 w-6 text-red-500" />
                                          Schedule Inspection
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-6 mt-4">
                                        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                                          <CalendarComponent
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => setSelectedDate(date)}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            initialFocus
                                            className="w-full flex justify-center items-center"
                                          />
                                        </div>

                                        <div className="space-y-4">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                            <div className="grid grid-cols-3 gap-2">
                                              <Select
                                                value={startHour}
                                                onValueChange={(value) => {
                                                  setStartHour(value);
                                                  adjustEndTimeIfNeeded();
                                                }}
                                              >
                                                <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                                  <SelectValue placeholder="Hour" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                  {hourOptions.map((hour) => (
                                                    <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Select
                                                value={startMinute}
                                                onValueChange={(value) => {
                                                  setStartMinute(value);
                                                  adjustEndTimeIfNeeded();
                                                }}
                                              >
                                                <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                                  <SelectValue placeholder="Minute" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                  {minuteOptions.map((minute) => (
                                                    <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Select
                                                value={startPeriod}
                                                onValueChange={(value) => {
                                                  setStartPeriod(value);
                                                  adjustEndTimeIfNeeded();
                                                }}
                                              >
                                                <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                                  <SelectValue placeholder="Period" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                  <SelectItem value="AM">AM</SelectItem>
                                                  <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                            <div className="grid grid-cols-3 gap-2">
                                              <Select
                                                value={endHour}
                                                onValueChange={(value) => {
                                                  setEndHour(value);
                                                  adjustEndTimeIfNeeded();
                                                }}
                                              >
                                                <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                                  <SelectValue placeholder="Hour" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                  {hourOptions.map((hour) => (
                                                    <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Select
                                                value={endMinute}
                                                onValueChange={(value) => {
                                                  setEndMinute(value);
                                                  adjustEndTimeIfNeeded();
                                                }}
                                              >
                                                <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                                  <SelectValue placeholder="Minute" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                  {minuteOptions.map((minute) => (
                                                    <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Select
                                                value={endPeriod}
                                                onValueChange={(value) => {
                                                  setEndPeriod(value);
                                                  adjustEndTimeIfNeeded();
                                                }}
                                              >
                                                <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                                  <SelectValue placeholder="Period" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200">
                                                  <SelectItem value="AM">AM</SelectItem>
                                                  <SelectItem value="PM">PM</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Inspector</label>
                                          <Select
                                            value={selectedInspectorId || ''}
                                            onValueChange={(value) => setSelectedInspectorId(value)}
                                            required
                                          >
                                            <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-red-500">
                                              <SelectValue placeholder="Select Inspector" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
                                              {users
                                                .filter((user) => 
                                                  user.duty_status === 'on_duty' &&
                                                  user.role === 'inspector' &&
                                                  selectedDate &&
                                                  isInspectorAvailable(
                                                    user.id,
                                                    new Date(selectedDate.setHours(
                                                      parseInt(to24Hour(startHour, startMinute, startPeriod).split(':')[0]),
                                                      parseInt(to24Hour(startHour, startMinute, startPeriod).split(':')[1])
                                                    )).toISOString(),
                                                    new Date(selectedDate.setHours(
                                                      parseInt(to24Hour(endHour, endMinute, endPeriod).split(':')[0]),
                                                      parseInt(to24Hour(endHour, endMinute, endPeriod).split(':')[1])
                                                    )).toISOString()
                                                  )
                                                )
                                                .map((user) => (
                                                  <SelectItem key={user.id} value={user.id} className="text-gray-700 hover:bg-red-50">
                                                    <div className="flex items-center">
                                                      <Check className="h-4 w-4 text-green-500 mr-2" />
                                                      {`${user.first_name} ${user.last_name}`}
                                                    </div>
                                                  </SelectItem>
                                                ))}
                                              {users
                                                .filter((user) => 
                                                  user.duty_status === 'on_duty' && 
                                                  user.role === 'inspector' && 
                                                  selectedDate &&
                                                  !isInspectorAvailable(
                                                    user.id,
                                                    new Date(selectedDate.setHours(
                                                      parseInt(to24Hour(startHour, startMinute, startPeriod).split(':')[0]),
                                                      parseInt(to24Hour(startHour, startMinute, startPeriod).split(':')[1])
                                                    )).toISOString(),
                                                    new Date(selectedDate.setHours(
                                                      parseInt(to24Hour(endHour, endMinute, endPeriod).split(':')[0]),
                                                      parseInt(to24Hour(endHour, endMinute, endPeriod).split(':')[1])
                                                    )).toISOString()
                                                  )
                                                )
                                                .length === 0 && (
                                                  <SelectItem value="no-available" disabled className="text-gray-500">
                                                    No available inspectors
                                                  </SelectItem>
                                                )}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <DialogFooter className="mt-6 flex justify-end gap-3">
                                        <Button
                                          variant="outline"
                                          onClick={() => handleClearSchedule(inspection.id)}
                                          className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Clear Schedule
                                        </Button>
                                        <Button
                                          onClick={() => handleScheduleAndAssign(inspection.id, selectedDate, selectedInspectorId)}
                                          disabled={!selectedDate || !selectedInspectorId}
                                          className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
                                        >
                                          Schedule & Assign
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                  title="View Details"
                                  onClick={() => {
                                    setSelectedInspection(inspection);
                                    setDetailsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-5 w-5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="disabled:opacity-50"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="disabled:opacity-50"
                    >
                      &lt;
                    </Button>
                    <span className="text-sm">
                      {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-50"
                    >
                      &gt;
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="disabled:opacity-50"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInSection>
      </div>

      <RejectInspectionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        inspection={selectedInspection}
        onReject={onRejectHandler}
        contentClassName="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />

      <ApproveInspectionDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        inspection={selectedInspection}
        onApprove={onApproveHandler}
        contentClassName="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      />

      <InspectionDetailsDialog
        inspection={selectedInspection}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </DashboardLayout>
  );
};

export default AdminInspections;
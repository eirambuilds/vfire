import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  SearchIcon,
  Building,
  Eye,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Plus,
  Trash2,
  Download,
  Building2Icon,
} from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EstablishmentDetailsDialog } from '@/components/shared/establishments/EstablishmentDetailsDialog';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

// --- Establishment Interface ---
interface Establishment {
  id: string;
  name: string;
  owner_id: string;
  dti_number: string;
  date_registered?: string;
  created_at?: string;
  status: string;
  type?: string;
  address?: string;
  rejection_history?: { reasons: string[]; notes: string; timestamp: string }[];
}

// --- EstablishmentsFilters Component ---
interface EstablishmentsFiltersProps {
  searchTerm: string;
  filterStatus: string;
  filterType: string;
  filterRejectionHistory: string;
  filterCreatedAt: string;
  registeredStartDate: Date | null;
  registeredEndDate: Date | null;
  uniqueTypes: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onRejectionHistoryChange: (value: string) => void;
  onCreatedAtChange: (value: string) => void;
  onRegisteredStartChange: (date: Date | null) => void;
  onRegisteredEndChange: (date: Date | null) => void;
  onExport: () => void;
}

const EstablishmentsFilters: React.FC<EstablishmentsFiltersProps> = ({
  searchTerm,
  filterStatus,
  filterType,
  filterRejectionHistory,
  registeredStartDate,
  registeredEndDate,
  uniqueTypes,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onRejectionHistoryChange,
  onCreatedAtChange,
  onRegisteredStartChange,
  onRegisteredEndChange,
  onExport,
}) => {
  const fieldStyles = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Select value={filterType} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Establishment Types</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Establishment Status</SelectItem>
            <SelectItem value="unregistered">Unregistered</SelectItem>
            <SelectItem value="pre_registered">Pre-registered</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRejectionHistory} onValueChange={onRejectionHistoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by rejection history" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rejection History</SelectItem>
            <SelectItem value="has-rejections">Has Rejections</SelectItem>
            <SelectItem value="no-rejections">No Rejections</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative col-span-2">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, address, DTI, or owner..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={onExport}
          className="w-full flex items-center gap-2 text-white rounded-lg"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
};

// --- RejectEstablishmentDialog Component ---
interface RejectEstablishmentDialogProps {
  establishment: Establishment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reasons: string[], notes: string) => Promise<void>;
}

const REJECTION_REASONS = [
  "Incomplete establishment information",
  "Inaccurate establishment information",
  "Duplicate registration detected",
  "Unverified or incorrect establishment location",
  "Suspended or blacklisted establishment",
  "Others",
];

const RejectEstablishmentDialog: React.FC<RejectEstablishmentDialogProps> = ({
  establishment,
  open,
  onOpenChange,
  onReject,
}) => {
  const [reasons, setReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddReason = () => {
    if (newReason && !reasons.includes(newReason)) {
      setReasons([...reasons, newReason]);
      setNewReason('');
    }
  };

  const handleRemoveReason = (reasonToRemove: string) => {
    setReasons(reasons.filter((reason) => reason !== reasonToRemove));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onReject(reasons, additionalNotes);
      onOpenChange(false);
      setReasons([]);
      setAdditionalNotes('');
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[500px] md:max-w-[600px] p-0 border border-orange-200 bg-gradient-to-br from-gray-50 via-white to-gray-100",
          "shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-300"
        )}
      >
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              Reject Establishment
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Provide rejection details for{" "}
              <span className="font-semibold text-orange-600">
                {establishment?.name || 'this establishment'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rejection Reasons</label>
              <div className="flex items-center gap-2">
                <Select value={newReason} onValueChange={setNewReason} disabled={isSubmitting}>
                  <SelectTrigger className="flex-1 border-orange-300 focus:ring-orange-500">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_REASONS.map((reasonOption) => (
                      <SelectItem key={reasonOption} value={reasonOption}>
                        {reasonOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddReason}
                  disabled={isSubmitting || !newReason}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {reasons.length > 0 && (
                <div className="mt-2 space-y-2">
                  {reasons.map((selectedReason) => (
                    <div 
                      key={selectedReason} 
                      className="flex items-center justify-between bg-orange-50 p-2 rounded-md shadow-sm"
                    >
                      <span className="text-sm text-gray-700">{selectedReason}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReason(selectedReason)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Additional Notes</label>
              <Textarea
                placeholder="Provide more details about the rejection..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="border-orange-300 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500">
                These notes will be sent to the establishment owner.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reasons.length === 0 || isSubmitting}
              className="bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-200 shadow-md transform hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Reject Establishment'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- EstablishmentsTable Component ---
interface EstablishmentsTableProps {
  establishments: Establishment[];
  getOwnerName: (owner_id: string) => string;
  onViewEstablishment: (establishment: Establishment) => void;
  onApproveEstablishment: (establishment: Establishment) => Promise<void>;
  onRejectEstablishment: (establishment: Establishment, reasons: string[], notes: string) => Promise<void>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (column: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'registered':
      return <Badge variant="outline" className="bg-green-100 text-green-800">Registered</Badge>;
    case 'unregistered':
      return <Badge variant="outline" className="bg-amber-100 text-amber-800">Unregistered</Badge>;
    case 'pre_registered':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Pre-registered</Badge>;
    case 'pending_registration':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800">Pending</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status || 'N/A'}</Badge>;
  }
};

const EstablishmentsTable: React.FC<EstablishmentsTableProps> = ({
  establishments,
  getOwnerName,
  onViewEstablishment,
  onApproveEstablishment,
  onRejectEstablishment,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = React.useState<Establishment | null>(null);

  const handleApproveClick = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
    setRejectDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (selectedEstablishment) {
      await onApproveEstablishment(selectedEstablishment);
      setApproveDialogOpen(false);
      setSelectedEstablishment(null);
    }
  };

  const handleConfirmReject = async (reasons: string[], notes: string) => {
    if (selectedEstablishment) {
      await onRejectEstablishment(selectedEstablishment, reasons, notes);
      setRejectDialogOpen(false);
      setSelectedEstablishment(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Establishment Name & DTI</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Rejection History</TableHead>
              <TableHead>Date Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {establishments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No establishments found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              establishments.map((establishment) => (
                <TableRow key={establishment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-orange-600" />
                      {establishment.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      DTI: {establishment.dti_number || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{establishment.type || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {establishment.address || 'No address provided'}
                  </TableCell>
                  <TableCell>
                    {getOwnerName(establishment.owner_id)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      {establishment.rejection_history?.length > 0 
                        ? `${establishment.rejection_history.length} rejection${establishment.rejection_history.length > 1 ? 's' : ''}` 
                        : 'None'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {establishment.status === 'registered' && establishment.date_registered
                      ? new Date(establishment.date_registered).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(establishment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {establishment.status === 'pre_registered' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApproveClick(establishment)}
                          title="Approve Establishment"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(establishment.status === 'pre_registered' || establishment.status === 'registered') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectClick(establishment)}
                          title="Reject Establishment"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => onViewEstablishment(establishment)}
                        title="View Establishment Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent 
          className={cn(
            "sm:max-w-[425px] p-0 border border-orange-200 bg-gradient-to-br from-gray-50 via-white to-gray-100",
            "shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-300"
          )}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-orange-600" />
                Approve Establishment
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Are you sure you want to approve{" "}
                <span className="font-semibold text-orange-600">
                  {selectedEstablishment?.name}
                </span>
                ? This will mark it as registered in the system.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setApproveDialogOpen(false)}
                className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApprove}
                className="bg-green-600 text-white font-semibold hover:bg-green-700 transition-all duration-200 shadow-md transform hover:scale-105"
              >
                Approve
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <RejectEstablishmentDialog
        establishment={selectedEstablishment}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onReject={handleConfirmReject}
      />
    </>
  );
};

// --- AdminEstablishments Component ---
const AdminEstablishments = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRejectionHistory, setFilterRejectionHistory] = useState('all');
  const [filterCreatedAt, setFilterCreatedAt] = useState('all');
  const [registeredStartDate, setRegisteredStartDate] = useState<Date | null>(null);
  const [registeredEndDate, setRegisteredEndDate] = useState<Date | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [filteredEstablishments, setFilteredEstablishments] = useState<Establishment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: establishmentsData, error: establishmentsError } = await supabase
          .from('establishments')
          .select('*');
        if (establishmentsError) throw establishmentsError;
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email');
        if (usersError) throw usersError;
        const mappedEstablishments = (establishmentsData || []).map(est => ({
          ...est,
          owner_id: est.owner_id,
          dti_number: est.dti_number,
          date_registered: est.date_registered,
          created_at: est.created_at || '',
        }));
        setEstablishments(mappedEstablishments);
        setFilteredEstablishments(mappedEstablishments);
        setUsers(usersData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
        toast({
          title: "Error",
          description: "Failed to load establishments data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const getOwnerName = (owner_id: string) => {
    const owner = users.find(u => u.id === owner_id);
    return owner ? `${owner.first_name} ${owner.last_name}` : 'N/A';
  };

  const applyFiltersAndSort = () => {
    let result = [...establishments];
    const statusPriority: { [key: string]: number } = {
      pre_registered: 1,
      registered: 2,
      unregistered: 3,
    };
    result.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;
      return priorityA - priorityB;
    });
    result = result.filter(establishment => {
      const ownerName = getOwnerName(establishment.owner_id).toLowerCase();
      const matchesSearch = 
        establishment.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        establishment.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        establishment.dti_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ownerName.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || establishment.status === filterStatus;
      const matchesType = filterType === 'all' || 
        (filterType === 'no-type' && (!establishment.type || establishment.type.trim() === '')) || 
        establishment.type === filterType;
      const hasRejections = establishment.rejection_history?.length > 0;
      const matchesRejectionHistory = filterRejectionHistory === 'all' || 
        (filterRejectionHistory === 'has-rejections' && hasRejections) || 
        (filterRejectionHistory === 'no-rejections' && !hasRejections);
      const created_at = establishment.created_at ? new Date(establishment.created_at) : null;
      const date_registered = establishment.date_registered ? new Date(establishment.date_registered) : null;
      const now = new Date();
      const matchesCreatedAt = filterCreatedAt === 'all' || 
        (filterCreatedAt === 'last-30' && created_at && created_at >= new Date(now.setDate(now.getDate() - 30))) ||
        (filterCreatedAt === 'last-90' && created_at && created_at >= new Date(now.setDate(now.getDate() - 90))) ||
        (filterCreatedAt === 'last-year' && created_at && created_at >= new Date(now.setFullYear(now.getFullYear() - 1))) ||
        (filterCreatedAt === 'older' && created_at && created_at < new Date(now.setFullYear(now.getFullYear() - 1)));
      const matchesDateRegistered = 
        (!registeredStartDate || (date_registered && date_registered >= registeredStartDate)) &&
        (!registeredEndDate || (date_registered && date_registered <= registeredEndDate));
      return matchesSearch && matchesStatus && matchesType && matchesRejectionHistory && matchesCreatedAt && matchesDateRegistered;
    });
    if (sortColumn === 'date_registered' && sortDirection) {
      result.sort((a, b) => {
        const dateA = a.status === 'registered' && a.date_registered ? new Date(a.date_registered).getTime() : Infinity;
        const dateB = b.status === 'registered' && b.date_registered ? new Date(b.date_registered).getTime() : Infinity;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    return result;
  };

  useEffect(() => {
    setFilteredEstablishments(applyFiltersAndSort());
    setCurrentPage(1);
  }, [
    establishments,
    searchTerm,
    filterStatus,
    filterType,
    filterRejectionHistory,
    filterCreatedAt,
    registeredStartDate,
    registeredEndDate,
    sortColumn,
    sortDirection,
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleApproveEstablishment = async (establishment: Establishment) => {
    try {
      const { error } = await supabase
        .from('establishments')
        .update({ 
          status: 'registered',
          date_registered: new Date().toISOString(),
        })
        .eq('id', establishment.id);
      if (error) throw error;
      setEstablishments(
        establishments.map(e => 
          e.id === establishment.id ? { ...e, status: 'registered', date_registered: new Date().toISOString() } : e
        )
      );
      toast({
        title: "Establishment Approved",
        description: "The establishment has been registered successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Approval Failed",
        description: err.message || "Failed to approve establishment.",
        variant: "destructive"
      });
    }
  };

  const handleRejectEstablishment = async (establishment: Establishment, reasons: string[], notes: string) => {
    try {
      const currentHistory = establishment.rejection_history || [];
      const newRejectionEntry = {
        reasons,
        notes,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [...currentHistory, newRejectionEntry];
      const { error } = await supabase
        .from('establishments')
        .update({ 
          status: 'unregistered',
          rejection_history: updatedHistory,
        })
        .eq('id', establishment.id);
      if (error) throw error;
      setEstablishments(
        establishments.map(e => 
          e.id === establishment.id 
            ? { ...e, status: 'unregistered', rejection_history: updatedHistory } 
            : e
        )
      );
      toast({
        title: "Establishment Rejected",
        description: "The establishment has been marked as unregistered.",
      });
    } catch (err: any) {
      toast({
        title: "Rejection Failed",
        description: err.message || "Failed to reject establishment.",
        variant: "destructive"
      });
    }
  };

  const handleExportToExcel = () => {
    const data = filteredEstablishments.map(establishment => ({
      'Establishment Name': establishment.name,
      'DTI Number': establishment.dti_number || 'N/A',
      'Type': establishment.type || 'N/A',
      'Address': establishment.address || 'No address provided',
      'Owner': getOwnerName(establishment.owner_id),
      'Rejection History': establishment.rejection_history?.length > 0 
        ? `${establishment.rejection_history.length} rejection${establishment.rejection_history.length > 1 ? 's' : ''}` 
        : 'None',
      'Date Registered': establishment.status === 'registered' && establishment.date_registered
        ? new Date(establishment.date_registered).toLocaleDateString()
        : 'N/A',
      'Status': establishment.status || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Establishments');
    XLSX.writeFile(workbook, 'establishments_export.xlsx');
  };

  const uniqueTypes = Array.from(new Set(establishments.map(e => e.type))).filter(Boolean);
  const totalItems = filteredEstablishments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedEstablishments = filteredEstablishments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Establishments" userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading establishments data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Establishments" userRole="admin">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
          <p className="text-red-500 font-medium">Error loading data</p>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Establishments" userRole="admin">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Establishment Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage establishments, view details, and approve or reject registrations.
          </p>
        </div>

        <FadeInSection delay={200}>
          <Card>
            <CardContent>
              <EstablishmentsFilters
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterType={filterType}
                filterRejectionHistory={filterRejectionHistory}
                filterCreatedAt={filterCreatedAt}
                registeredStartDate={registeredStartDate}
                registeredEndDate={registeredEndDate}
                uniqueTypes={uniqueTypes}
                onSearchChange={setSearchTerm}
                onStatusChange={setFilterStatus}
                onTypeChange={setFilterType}
                onRejectionHistoryChange={setFilterRejectionHistory}
                onCreatedAtChange={setFilterCreatedAt}
                onRegisteredStartChange={setRegisteredStartDate}
                onRegisteredEndChange={setRegisteredEndDate}
                onExport={handleExportToExcel}
              />
            </CardContent>
          </Card>
        </FadeInSection>
        <FadeInSection delay={300}>
          <Card>
            <CardContent className="pt-6">
              <EstablishmentsTable
                establishments={paginatedEstablishments}
                getOwnerName={getOwnerName}
                onViewEstablishment={(establishment) => setSelectedEstablishment(establishment)}
                onApproveEstablishment={handleApproveEstablishment}
                onRejectEstablishment={handleRejectEstablishment}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
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
            </CardContent>
          </Card>
        </FadeInSection>
      </div>
      <EstablishmentDetailsDialog 
        establishment={selectedEstablishment}
        open={!!selectedEstablishment}
        onOpenChange={(open) => {
          if (!open) setSelectedEstablishment(null);
        }}
        getOwnerName={getOwnerName}
      />
    </DashboardLayout>
  );
};

export default AdminEstablishments;
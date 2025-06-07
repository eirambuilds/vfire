import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SearchIcon, Calendar, CheckCircle, XCircle, Eye, Building, Plus, Trash2, Loader2, Download, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ApplicationDetailsDialog } from '@/components/shared/applications/ApplicationDetailsDialog';

interface Application {
  id: string;
  submitted_at: string;
  type: string;
  status: string;
  establishment_id: string;
  owner_id: string | null;
  certificate_url?: string;
  rejection_reasons?: string[];
  rejection_notes?: string;
  updated_at?: string;
  ownerName?: string;
  establishments: {
    id: string;
    name: string;
    type: string;
    address: string;
    dti_number: string;
  };
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

// --- ApplicationsFilters Component ---
interface ApplicationsFiltersProps {
  searchTerm: string;
  filterStatus: string;
  filterApplicationType: string;
  filterEstablishmentType: string;
  startDate: string;
  endDate: string;
  sortOrder: "latest" | "oldest";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onEstablishmentTypeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSortChange: (value: "latest" | "oldest") => void;
  onExport: () => void;
}

const ApplicationsFilters: React.FC<ApplicationsFiltersProps> = ({
  searchTerm,
  filterStatus,
  filterApplicationType,
  filterEstablishmentType,
  startDate,
  endDate,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onEstablishmentTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSortChange,
  onExport,
}) => {
  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  const handleStartDateChange = (date: Date | null) => {
    onStartDateChange(date ? date.toISOString().split('T')[0] : '');
  };

  const handleEndDateChange = (date: Date | null) => {
    onEndDateChange(date ? date.toISOString().split('T')[0] : '');
  };

  const fieldStyles = 'w-full border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger className={fieldStyles}>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Application Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterApplicationType} onValueChange={onTypeChange}>
        <SelectTrigger className={fieldStyles}>
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Application Types</SelectItem>
          <SelectItem value="FSEC">Fire Safety Evaluation Clearance</SelectItem>
          <SelectItem value="FSIC-Occupancy">FSIC (Occupancy)</SelectItem>
          <SelectItem value="FSIC-Business">FSIC (Business)</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterEstablishmentType} onValueChange={onEstablishmentTypeChange}>
        <SelectTrigger className={fieldStyles}>
          <SelectValue placeholder="Filter by establishment type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Establishment Types</SelectItem>
          {['Commercial', 'Industrial', 'Residential'].map((type) => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative col-span-2">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, address, DTI, or owner..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${fieldStyles} pl-10`}
        />
      </div>
      <Button
        size="sm"
        onClick={onExport}
        className="w-full flex items-center gap-2 text-white rounded-lg"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
    </div>
  );
};

// --- ApplicationsTable Component ---
interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  onUpdateApplication: (updatedApp: Application) => void;
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  error,
  onUpdateApplication,
}) => {
  const { toast } = useToast();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status || 'N/A'}</Badge>;
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: "pending" | "scheduled" | "inspected" | "approved" | "rejected" | "cancelled",
    additionalData = {}
  ) => {
    try {
      setProcessingIds((prev) => [...prev, applicationId]);
      const { data, error } = await supabase
        .from('applications')
        .update({ status: newStatus, ...additionalData })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      const currentApp = applications.find(a => a.id === applicationId);
      onUpdateApplication({
        ...data,
        establishments: currentApp?.establishments,
        profiles: currentApp?.profiles,
        ownerName: currentApp?.ownerName
      });
      toast({ title: "Success", description: `Application ${newStatus} successfully` });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to update application: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== applicationId));
    }
  };

  const handleApproveApplication = async (applicationId: string, certificateUrl?: string) => {
    const additionalData = certificateUrl ? { certificate_url: certificateUrl } : {};
    await updateApplicationStatus(applicationId, 'approved', additionalData);
    setApproveDialogOpen(false);
    setSelectedApplication(null);
  };

  const handleRejectApplication = async (applicationId: string, reasons: string[], notes: string) => {
    await updateApplicationStatus(applicationId, 'rejected', {
      rejection_reasons: reasons,
      rejection_notes: notes
    });
    setRejectDialogOpen(false);
    setSelectedApplication(null);
  };

  const handleApproveClick = (app: Application) => {
    setSelectedApplication(app);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (app: Application) => {
    setSelectedApplication(app);
    setRejectDialogOpen(true);
  };

  const handleDetailsClick = (app: Application) => {
    setSelectedApplication(app);
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Establishment Name & DTI</TableHead>
              <TableHead>Application Type</TableHead>
              <TableHead>Establishment Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-red-500">{error}</TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No applications found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-orange-600" />
                      {app.establishments?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      DTI: {app.establishments?.dti_number || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{app.type || 'N/A'}</TableCell>
                  <TableCell>{app.establishments?.type || 'N/A'}</TableCell>
                  <TableCell>
                    {app.owner_id
                      ? `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}`.trim() || `User #${app.owner_id.substring(0, 6)}`
                      : 'No Owner'}
                  </TableCell>
                  <TableCell>
                    {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {app.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApproveClick(app)}
                            disabled={processingIds.includes(app.id)}
                            title="Approve Application"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRejectClick(app)}
                            disabled={processingIds.includes(app.id)}
                            title="Reject Application"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => handleDetailsClick(app)}
                        title="View Details"
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

      <ApproveApplicationDialog
        open={approveDialogOpen}
        onOpenChange={(open) => {
          setApproveDialogOpen(open);
          if (!open) setSelectedApplication(null);
        }}
        application={selectedApplication}
        onApprove={handleApproveApplication}
        contentClassName={cn(
          "sm:max-w-[425px] p-0 border border-orange-200 bg-gradient-to-br from-gray-50 via-white to-gray-100",
          "shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-300"
        )}
      />

      <RejectApplicationDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setSelectedApplication(null);
        }}
        application={selectedApplication}
        onReject={handleRejectApplication}
        contentClassName={cn(
          "sm:max-w-[425px] p-0 border border-orange-200 bg-gradient-to-br from-gray-50 via-white to-gray-100",
          "shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-300"
        )}
      />

      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          setDetailsDialogOpen(open);
          if (!open) setSelectedApplication(null);
        }}
        application={selectedApplication}
      />
    </>
  );
};

// --- ApproveApplicationDialog Component ---
interface ApproveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onApprove: (applicationId: string, certificateUrl?: string) => void;
  contentClassName?: string;
}

const ApproveApplicationDialog: React.FC<ApproveApplicationDialogProps> = ({
  open,
  onOpenChange,
  application,
  onApprove,
  contentClassName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getDialogTitle = (type: string | undefined) => {
    switch (type) {
      case 'FSEC': return 'Issue FSEC Certification';
      case 'FSIC-Occupancy': return 'Approve FSIC Application';
      case 'FSIC-Business': return 'Approve FSIC Application';
      default: return 'Approve Application';
    }
  };

  const isFSEC = application?.type === 'FSEC';

  const generateCertificatePDF = async (): Promise<string> => {
  if (!application) throw new Error('No application provided');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load the certificate background image
  const certificateImageUrl = '/public/certificates/FSEC.png';
  
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'Anonymous'; // Handle CORS if needed
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
  };

  try {
    // Add the background image to cover the A4 page (210mm x 297mm)
    const img = await loadImage(certificateImageUrl);
    doc.addImage(img, 'PNG', 0, 0, 210, 297); // A4 dimensions in mm
  } catch (error) {
    console.error('Error loading certificate image:', error);
    throw new Error('Failed to load certificate background image');
  }

  // Define certificate data
  const certificateNumber = `FSEC-${application.id}`;
  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const establishmentName = application.establishments?.name || 'N/A';
  const address = application.establishments?.address || 'N/A';
  const ownerName = application.ownerName || 'N/A';
  const chiefFSES = 'Juan Dela Cruz'; // Replace with actual data (e.g., from Supabase or props)
  const cityFireMarshal = 'Maria Santos'; // Replace with actual data (e.g., from Supabase or props)

  // Set font styles
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Black text

  // Placeholder coordinates (adjust these based on your image's layout)
  // You may need to test and tweak these to align with the fields in FSEC.png
  doc.text(certificateNumber, 60, 68); // FSEC Number
  doc.text(issueDate, 155, 68); // Date
  doc.text(establishmentName, 30, 115); // Establishment Name
  doc.text(address, 30, 128); // Address
  doc.text(ownerName, 50, 137); // Owner/Representative Name
  doc.text(chiefFSES, 130, 190); // Chief, FSES
  doc.text(cityFireMarshal, 130, 214); // City/Municipal Fire Marshal

  // Save the PDF to a blob
  const pdfBlob = doc.output('blob');
  const fileName = `FSEC-${application.id}-${Date.now()}.pdf`;

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('certifications')
    .upload(`fsec/${fileName}`, pdfBlob, {
      contentType: 'application/pdf',
    });

  if (error) throw error;

  // Get the public URL of the uploaded PDF
  const { data: publicUrlData } = supabase.storage
    .from('certifications')
    .getPublicUrl(`fsec/${fileName}`);

  return publicUrlData.publicUrl;
};

  const handleSubmit = async () => {
    if (!application) return;

    try {
      setIsGenerating(true);
      let certificateUrl: string | undefined;

      if (isFSEC) {
        certificateUrl = await generateCertificatePDF();
      }

      onApprove(application.id, certificateUrl);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[425px]", contentClassName)}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              {getDialogTitle(application?.type)}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {isFSEC ? (
                <>Issue an FSEC (Fire Safety Evaluation Clearance) for </>
              ) : (
                <>Approve the {application?.type || 'application'} for </>
              )}
              <span className="font-semibold text-orange-600">{application?.establishments?.name}</span>.
              {isFSEC && " A certificate will be automatically generated for FSEC."}
            </DialogDescription>
          </DialogHeader>

          {isFSEC && (
            <div className="mt-4 space-y-2">
              <Label className="text-gray-700">Certificate Details</Label>
              <div className="text-sm text-gray-600">
                <p>Certificate Type: Fire Safety Evaluation Clearance</p>
                <p>Establishment Name: {application?.establishments.name}</p>
                <p>DTI Number: {application?.establishments.dti_number || 'N/A'}</p>
                <p>Owner: {application?.ownerName}</p>
                <p>Issue Date: {new Date().toLocaleDateString()}</p>
                <p>Certificate Number: FSEC-{application?.id}</p>
                <p>Address: {application?.establishments.address}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                isFSEC ? 'Issue Certificate' : 'Approve'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- RejectApplicationDialog Component ---
interface RejectApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onReject: (applicationId: string, reasons: string[], notes: string) => void;
  contentClassName?: string;
}

const REJECTION_REASONS = [
  "Incomplete establishment information",
  "Inaccurate establishment information",
  "Failure to meet minimum fire safety requirements",
  "Absence of fire safety plan or emergency evacuation procedure",
  "Incomplete or missing supporting documents",
  "Outstanding penalties or unresolved violations",
  "Falsified or tampered documentation",
  "Ownership details do not match submitted documentation",
  "Multiple applications detected",
  "Others",
];

const RejectApplicationDialog: React.FC<RejectApplicationDialogProps> = ({
  open,
  onOpenChange,
  application,
  onReject,
  contentClassName,
}) => {
  const [reasons, setReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDialogTitle = (type: string | undefined) => {
    switch (type) {
      case 'FSEC': return 'Reject FSEC Application';
      case 'FSIC-Occupancy': return 'Reject FSIC Application';
      case 'FSIC-Business': return 'Reject FSIC Application';
      default: return 'Reject Application';
    }
  };

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
    if (application) {
      setIsSubmitting(true);
      try {
        await onReject(application.id, reasons, additionalNotes);
        onOpenChange(false);
        setReasons([]);
        setAdditionalNotes('');
      } catch (error) {
        console.error('Application rejection failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] md:max-w-[600px]", contentClassName)}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-orange-600" />
              {getDialogTitle(application?.type)}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Reject the {application?.type || 'application'} for{" "}
              <span className="font-semibold text-orange-600">{application?.establishments?.name}</span>.
              Please provide rejection reasons and additional notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-700">Rejection Reasons</Label>
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
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {reasons.length > 0 && (
                <div className="mt-2 space-y-2">
                  {reasons.map((selectedReason) => (
                    <div
                      key={selectedReason}
                      className="flex items-center justify-between bg-orange-50 p-2 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{selectedReason}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReason(selectedReason)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Additional Notes</Label>
              <Textarea
                id="notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Enter additional details about the rejection..."
                className="mt-1 border-orange-300 focus:ring-orange-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reasons.length || isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- AdminApplications Component ---
const AdminApplications = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterApplicationType, setFilterApplicationType] = useState('all');
  const [filterEstablishmentType, setFilterEstablishmentType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          submitted_at,
          type,
          status,
          establishment_id,
          owner_id,
          certificate_url,
          rejection_reasons,
          rejection_notes,
          establishments (
            id,
            name,
            type,
            address,
            dti_number
          )
        `);

      if (appError) throw appError;
      if (!appData || appData.length === 0) {
        setApplications([]);
        return;
      }

      const owner_ids = [...new Set(appData.map((app: any) => app.owner_id).filter(Boolean))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', owner_ids);

      if (profilesError) throw profilesError;

      const combinedData = appData.map((app: any) => {
        const profile = profilesData?.find((p: any) => p.id === app.owner_id);
        return {
          ...app,
          establishments: {
            ...app.establishments,
            dti_number: app.establishments.dti_number,
          },
          profiles: profile ? {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
          } : undefined,
          ownerName: profile ? `${profile.first_name} ${profile.last_name}` : 'N/A',
          updated_at: app.updated_at || app.submitted_at,
        };
      }) as Application[];

      setApplications(combinedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplication = (updatedApp: Application) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
  };

  const filteredApplications = applications
    .filter((app) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        app.establishments?.name?.toLowerCase().includes(searchLower) ||
        app.establishments?.address?.toLowerCase().includes(searchLower) ||
        app.establishments?.dti_number?.toLowerCase().includes(searchLower) ||
        app.ownerName?.toLowerCase().includes(searchLower);

      const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
      const matchesAppType = filterApplicationType === 'all' || app.type === filterApplicationType;
      const matchesEstType = filterEstablishmentType === 'all' || app.establishments?.type === filterEstablishmentType;

      const submittedDate = new Date(app.submitted_at);
      const matchesStartDate = !startDate || submittedDate >= new Date(startDate);
      const matchesEndDate = !endDate || submittedDate <= new Date(endDate);

      return matchesSearch && matchesStatus && matchesAppType && matchesEstType && matchesStartDate && matchesEndDate;
    })
    .sort((a, b) => {
      const statusPriority = {
        pending: 1,
        approved: 2,
        rejected: 3,
        cancelled: 4,
        scheduled: 5,
        inspected: 6
      };
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;
      return sortOrder === "latest"
        ? new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        : new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });

  const handleExportToExcel = () => {
    const data = filteredApplications.map(app => ({
      'Establishment Name': app.establishments?.name || 'N/A',
      'DTI Number': app.establishments?.dti_number || 'N/A',
      'Application Type': app.type || 'N/A',
      'Establishment Type': app.establishments?.type || 'N/A',
      'Owner': app.owner_id
        ? `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}`.trim() || `User #${app.owner_id.substring(0, 6)}`
        : 'No Owner',
      'Date Submitted': app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A',
      'Status': app.status || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    XLSX.writeFile(workbook, 'applications_export.xlsx');
  };

  const totalItems = filteredApplications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <DashboardLayout title="Applications" userRole="admin">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Applications Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage applications, view details, and approve or reject applications.
          </p>
        </div>

        <FadeInSection delay={200}>
          <Card>
            <CardContent className="p-6">
              <ApplicationsFilters
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterApplicationType={filterApplicationType}
                filterEstablishmentType={filterEstablishmentType}
                startDate={startDate}
                endDate={endDate}
                sortOrder={sortOrder}
                onSearchChange={setSearchTerm}
                onStatusChange={setFilterStatus}
                onTypeChange={setFilterApplicationType}
                onEstablishmentTypeChange={setFilterEstablishmentType}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onSortChange={setSortOrder}
                onExport={handleExportToExcel}
              />
            </CardContent>
          </Card>
        </FadeInSection>

        <FadeInSection delay={300}>
          <Card>
            <CardContent className="pt-6">
              <ApplicationsTable
                applications={paginatedApplications}
                loading={loading}
                error={error}
                onUpdateApplication={handleUpdateApplication}
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
    </DashboardLayout>
  );
};

export default AdminApplications;
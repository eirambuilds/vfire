import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ApproveApplicationDialog } from '@/components/admin/applications/ApproveApplicationDialog';
import { RejectApplicationDialog } from '@/components/admin/applications/RejectApplicationDialog';
import { Application } from '@/types/application';
import { ApplicationDetailsDialog } from '@/components/shared/applications/ApplicationDetailsDialog';

interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  onUpdateApplication: (updatedApp: Application) => void;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
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
        profiles: currentApp?.profiles
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
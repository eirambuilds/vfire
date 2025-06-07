import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Clipboard, Calendar, Eye, Loader2 } from 'lucide-react';
import { InspectionChecklist } from '@/components/inspector/InspectionChecklist';
import { Inspection, InspectionStatus } from '@/types/inspection';
import { InspectionDetailsDialog } from '@/components/shared/inspections/InspectionDetailsDialog';
import { Input } from '@/components/ui/input'; // Assuming you have an Input component from a UI library like shadcn/ui

const ITEMS_PER_PAGE = 10;

const InspectorInspections = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({
    scheduled: 1,
    inspected: 1,
    approved: 1,
    rejected: 1,
    cancelled: 1,
  });

  useEffect(() => {
    const fetchInspections = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('inspections')
        .select('id, establishment_name, type, scheduled_date, status, inspector_id, establishment_id, address, updated_at, rejection_reason, inspector')
        .eq('inspector_id', user.id);

      if (error) {
        console.error('Error fetching inspections:', error);
      } else {
        const formattedInspections: Inspection[] = data.map((item: any) => {
          let adjustedDate = item.scheduled_date
            ? new Date(new Date(item.scheduled_date).getTime() + 8 * 60 * 60 * 1000)
            : null;

          return {
            id: item.id,
            establishment_id: item.establishment_id,
            establishment_name: item.establishment_name,
            establishmentType: item.establishment_type || '',
            type: item.type,
            scheduledDate: adjustedDate ? adjustedDate.toISOString() : null,
            status: item.status as InspectionStatus,
            inspectorId: item.inspector_id,
            address: item.address || '',
            updated_at: item.updated_at,
            rejection_reason: item.rejection_reason,
            inspector: item.inspector,
            dti_number: item.dti_number || ''
          };
        });
        setInspections(formattedInspections);
      }
      setLoading(false);
      console.log(`Inspections fetched at ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    };

    fetchInspections();
  }, []);

  const filterInspectionsByStatus = (status: InspectionStatus) =>
    inspections.filter(i => i.status === status);

  const filterInspectionsBySearch = (inspections: Inspection[]) =>
    inspections.filter(i =>
      (i.establishment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.type?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const getFilteredInspections = (status: InspectionStatus) => {
    return filterInspectionsBySearch(filterInspectionsByStatus(status));
  };

  const getPaginatedInspections = (status: InspectionStatus) => {
    const filtered = getFilteredInspections(status);
    const start = (currentPage[status] - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filtered.slice(start, end);
  };

  const getTotalPages = (status: InspectionStatus) => {
    return Math.ceil(getFilteredInspections(status).length / ITEMS_PER_PAGE);
  };

  const handlePageChange = (status: InspectionStatus, page: number) => {
    setCurrentPage(prev => ({ ...prev, [status]: page }));
  };

  const scheduledInspections = filterInspectionsByStatus(InspectionStatus.Scheduled);
  const inspectedInspections = filterInspectionsByStatus(InspectionStatus.Inspected);
  const approvedInspections = filterInspectionsByStatus(InspectionStatus.Approved);
  const rejectedInspections = filterInspectionsByStatus(InspectionStatus.Rejected);
  const cancelledInspections = filterInspectionsByStatus(InspectionStatus.Cancelled);

  const handleStartInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsChecklistOpen(true);
  };

  const handleViewDetails = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline" className="bg-blue-100 text-blue-800 whitespace-nowrap">Scheduled</Badge>;
      case 'inspected': return <Badge variant="outline" className="bg-purple-100 text-purple-800 whitespace-nowrap">Inspected</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-100 text-green-800 whitespace-nowrap">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-100 text-red-800 whitespace-nowrap">Rejected</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-gray-100 text-gray-800 whitespace-nowrap">Cancelled</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-800 whitespace-nowrap">{status}</Badge>;
    }
  };

  const renderPagination = (status: InspectionStatus) => {
    const totalPages = getTotalPages(status);
    const current = currentPage[status];
    const totalItems = getFilteredInspections(status).length;
    const startItem = (current - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(current * ITEMS_PER_PAGE, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0">
        <div className="text-sm text-gray-600">
          Showing {startItem} to {endItem} of {totalItems} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(status, 1)}
            disabled={current === 1}
            className="disabled:opacity-50"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(status, current - 1)}
            disabled={current === 1}
            className="disabled:opacity-50"
          >
          </Button>
          <span className="text-sm text-gray-600">
            {current} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(status, current + 1)}
            disabled={current === totalPages}
            className="disabled:opacity-50"
          >
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(status, totalPages)}
            disabled={current === totalPages}
            className="disabled:opacity-50"
          >
            Last
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayoutWrapper title="Inspections" userRole="inspector">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2 text-gray-600">Loading inspections...</span>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper title="Inspections" userRole="inspector">
      <div className="space-y-6">
        <FadeInSection delay={100}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              <Clipboard className="h-6 w-6 mr-2 text-primary" />
              Assigned Inspections
            </h1>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent>
              <Tabs defaultValue="scheduled" className="w-full">
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
                  <TabsTrigger
                    value="scheduled"
                    className="text-xs sm:text-sm data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white p-2"
                  >
                    Scheduled ({scheduledInspections.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="inspected"
                    className="text-xs sm:text-sm data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white p-2"
                  >
                    Inspected ({inspectedInspections.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="text-xs sm:text-sm data-[state=active]:bg-[#22C55E] data-[state=active]:text-white p-2"
                  >
                    Approved ({approvedInspections.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="text-xs sm:text-sm data-[state=active]:bg-[#EF4444] data-[state=active]:text-white p-2"
                  >
                    Rejected ({rejectedInspections.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="text-xs sm:text-sm data-[state=active]:bg-[#9CA3AF] data-[state=active]:text-white p-2"
                  >
                    Cancelled ({cancelledInspections.length})
                  </TabsTrigger>
                </TabsList>

                {['scheduled', 'inspected', 'approved', 'rejected', 'cancelled'].map((status) => (
                  <TabsContent key={status} value={status}>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-left w-[150px]">Date</TableHead>
                            <TableHead className="text-left w-[200px]">Establishment Name</TableHead>
                            <TableHead className="text-left w-[150px]">Application Type</TableHead>
                            <TableHead className="text-left w-[120px]">Status</TableHead>
                            <TableHead className="text-left w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPaginatedInspections(status as InspectionStatus).map((inspection) => (
                            <TableRow key={inspection.id} className="hover:bg-muted/50">
                              <TableCell className="text-left">
                                {inspection.scheduledDate
                                  ? new Date(inspection.scheduledDate).toLocaleDateString()
                                  : 'Not scheduled'}
                              </TableCell>
                              <TableCell className="font-medium max-w-[120px] truncate">
                                {inspection.establishment_name}
                              </TableCell>
                              <TableCell>{inspection.type}</TableCell>
                              <TableCell>{getStatusBadge(inspection.status as InspectionStatus)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {status === 'scheduled' ? (
                                    <>
                                      <Button
                                        size="sm"
                                        className="flex items-center gap-2 text-white rounded-lg"
                                        onClick={() => handleStartInspection(inspection)}
                                        disabled={
                                          !inspection.scheduledDate ||
                                          new Date(inspection.scheduledDate).toDateString() !== new Date().toDateString()
                                        }
                                      >
                                        Start Inspection
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-muted transition-colors duration-200"
                                        onClick={() => handleViewDetails(inspection)}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Details
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="hover:bg-muted transition-colors duration-200"
                                      onClick={() => handleViewDetails(inspection)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Details
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {getPaginatedInspections(status as InspectionStatus).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                {searchTerm
                                  ? `No ${status} inspections matching "${searchTerm}"`
                                  : `No ${status} inspections`}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {getFilteredInspections(status as InspectionStatus).length > 0 && renderPagination(status as InspectionStatus)}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </FadeInSection>

        {selectedInspection && (
          <>
            <InspectionChecklist
              isOpen={isChecklistOpen}
              onClose={() => {
                setIsChecklistOpen(false);
                setSelectedInspection(null);
              }}
              inspection={selectedInspection}
            />
            <InspectionDetailsDialog
              inspection={selectedInspection}
              open={isDetailsDialogOpen}
              onOpenChange={setIsDetailsDialogOpen}
            />
          </>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
};

export default InspectorInspections;
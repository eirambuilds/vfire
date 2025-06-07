import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SearchIcon, Eye, FileText, Loader2, AlertCircle, Calendar, Download, ClipboardList } from 'lucide-react';
import { Inspection, InspectionStatus } from '@/types/inspection';
import { Input } from '@/components/ui/input';
import { InspectionDetailsDialog } from '@/components/shared/inspections/InspectionDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSearchParams } from 'react-router-dom';

const OwnerInspections = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(''); 
  const [endDate, setEndDate] = useState<string>('');     
  const [filterEstablishment, setFilterEstablishment] = useState<string>('all'); 
  const [filterEstType, setFilterEstType] = useState<string>('all'); 
  const [filterType, setFilterType] = useState<string>('all'); 
  const [sortOrder, setSortOrder] = useState<string>('newest'); 
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReinspectDialogOpen, setIsReinspectDialogOpen] = useState(false);
  const [reinspectInspectionId, setReinspectInspectionId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for active tab, initialized from query parameter or default to 'pending'
  const [activeTab, setActiveTab] = useState<string>(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['pending', 'scheduled', 'inspected', 'approved', 'rejected', 'cancelled'];
    return tab && validTabs.includes(tab) ? tab : 'pending';
  });

  useEffect(() => {
    const fetchOwnerInspections = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        console.log('Fetching user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('User:', user, 'User Error:', userError);
        if (userError || !user) {
          throw new Error(`Authentication error: ${userError?.message || 'No user found'}`);
        }

        console.log('Fetching establishments...');
        const { data: establishments, error: establishmentsError } = await supabase
          .from('establishments')
          .select('id, type, dti_number')
          .eq('owner_id', user.id);
        console.log('Establishments:', establishments, 'Establishments Error:', establishmentsError);
        if (establishmentsError) {
          throw new Error(`Error fetching establishments: ${establishmentsError.message}`);
        }

        if (!establishments || establishments.length === 0) {
          console.log('No establishments found.');
          setInspections([]);
          setLoading(false);
          toast({
            title: "No Establishments",
            description: "You have no establishments registered.",
            variant: "default",
          });
          return;
        }

        const establishmentIds = establishments.map(e => e.id);
        console.log('Establishment IDs:', establishmentIds);
        const establishmentMap = establishments.reduce((map, est) => ({
          ...map,
          [est.id]: { type: est.type, dti_number: est.dti_number },
        }), {});

        console.log('Fetching inspections...');
        const { data: inspectionsData, error: inspectionsError } = await supabase
          .from('inspections')
          .select(`
            id,
            establishment_name,
            type,
            scheduled_date,
            status,
            inspector_id,
            establishment_id,
            address,
            updated_at,
            rejection_reason,
            certificate_url,
            inspector
          `)
          .in('establishment_id', establishmentIds);
        console.log('Inspections Data:', inspectionsData, 'Inspections Error:', inspectionsError);
        if (inspectionsError) {
          throw new Error(`Error fetching inspections: ${inspectionsError.message}`);
        }

        if (!inspectionsData || inspectionsData.length === 0) {
          console.log('No inspections found.');
          setInspections([]);
        } else {
          const formattedInspections: Inspection[] = inspectionsData.map((item: any) => {
            console.log('Raw rejection_reason:', item.rejection_reason); // Debug
            return {
              id: item.id || '',
              establishment_id: item.establishment_id || '',
              establishment_name: item.establishment_name || 'Unnamed Establishment',
              type: item.type || 'N/A',
              scheduledDate: item.scheduled_date || null,
              status: item.status && Object.values(InspectionStatus).includes(item.status)
                ? (item.status as InspectionStatus)
                : 'unknown',
              inspectorId: item.inspector_id || null,
              address: item.address || 'N/A',
              updated_at: item.updated_at || '',
              rejection_reason: item.rejection_reason
                ? Array.isArray(item.rejection_reason)
                  ? item.rejection_reason
                  : typeof item.rejection_reason === 'string'
                  ? item.rejection_reason.startsWith('[')
                    ? JSON.parse(item.rejection_reason)
                    : [item.rejection_reason]
                  : typeof item.rejection_reason === 'object'
                  ? Object.values(item.rejection_reason)
                  : []
                : [],
              certificate_url: item.certificate_url || null,
              inspector: item.inspector || 'N/A',
              establishmentType: establishmentMap[item.establishment_id]?.type || 'N/A',
              dti_number: establishmentMap[item.establishment_id]?.dti_number || 'N/A',
            };
          });
          console.log('Formatted Inspections:', formattedInspections);
          setInspections(formattedInspections);
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setErrorMessage(err.message || 'Failed to fetch inspections');
        toast({
          title: "Error",
          description: err.message || "Failed to fetch inspections",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerInspections();
  }, [toast]);

  const handleReinspectRequest = async () => {
    if (!reinspectInspectionId) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('inspections')
        .update({ status: 'pending' })
        .eq('id', reinspectInspectionId);

      if (error) throw new Error(`Error requesting reinspection: ${error.message}`);

      setInspections(prev =>
        prev.map(inspection =>
          inspection.id === reinspectInspectionId
            ? { ...inspection, status: 'pending' as InspectionStatus }
            : inspection
        )
      );

      toast({
        title: "Reinspection Requested",
        description: "The inspection has been moved to pending status.",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to request reinspection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsReinspectDialogOpen(false);
      setReinspectInspectionId(null);
    }
  };

  const getFilteredAndSortedInspections = (inspections: Inspection[]) => {
    let filtered = [...inspections];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.establishment_name.toLowerCase().includes(searchLower) ||
        i.address.toLowerCase().includes(searchLower) ||
        i.type.toLowerCase().includes(searchLower) ||
        i.inspector.toLowerCase().includes(searchLower)
      );
    }

    if (filterEstablishment !== 'all') {
      filtered = filtered.filter(i => i.establishment_name === filterEstablishment);
    }

    if (filterEstType !== 'all') {
      filtered = filtered.filter(i => i.establishmentType === filterEstType);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(i => i.type === filterType);
    }

    filtered = filtered.filter(i => {
      if (!i.scheduledDate) return true;
      const scheduledDate = new Date(i.scheduledDate);
      const matchesStart = !startDate || scheduledDate >= new Date(startDate);
      const matchesEnd = !endDate || scheduledDate <= new Date(endDate);
      return matchesStart && matchesEnd;
    });

    filtered.sort((a, b) => {
      if (sortOrder === 'newest' || sortOrder === 'oldest') {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
        const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      } else {
        const nameA = a.establishment_name.toLowerCase();
        const nameB = b.establishment_name.toLowerCase();
        return sortOrder === 'a-z' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
    });

    return filtered;
  };

  const scheduledInspections = inspections.filter(i => i.status === 'scheduled');
  const pendingInspections = inspections.filter(i => i.status === 'pending');
  const inspectedInspections = inspections.filter(i => i.status === 'inspected');
  const approvedInspections = inspections.filter(i => i.status === 'approved');
  const rejectedInspections = inspections.filter(i => i.status === 'rejected');
  const cancelledInspections = inspections.filter(i => i.status === 'cancelled');

  const filteredScheduledInspections = getFilteredAndSortedInspections(scheduledInspections);
  const filteredPendingInspections = getFilteredAndSortedInspections(pendingInspections);
  const filteredInspectedInspections = getFilteredAndSortedInspections(inspectedInspections);
  const filteredApprovedInspections = getFilteredAndSortedInspections(approvedInspections);
  const filteredRejectedInspections = getFilteredAndSortedInspections(rejectedInspections);
  const filteredCancelledInspections = getFilteredAndSortedInspections(cancelledInspections);

  console.log('Filtered Rejected Inspections:', filteredRejectedInspections); // Debug

  const handleViewDetails = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailsDialogOpen(true);
  };

  const handleViewCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const uniqueEstablishments = Array.from(new Set(inspections.map(i => i.establishment_name)));
  const uniqueTypes = Array.from(new Set(inspections.map(i => i.type)));

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;
  const handleStartDateChange = (date: Date | null) => setStartDate(date ? date.toISOString().split('T')[0] : '');
  const handleEndDateChange = (date: Date | null) => setEndDate(date ? date.toISOString().split('T')[0] : '');

  const fieldStyles = 'w-full border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500';

  return (
    <DashboardLayoutWrapper title="My Inspections" userRole="owner">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            My Inspections
          </h1>
          <p className="text-muted-foreground">
            View your establishment inspection details. You can filter, search, and sort your inspections based on various criteria.
          </p>
        </div>

        <FadeInSection delay={200}>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Select value={filterEstablishment} onValueChange={setFilterEstablishment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Establishments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Establishments</SelectItem>
                    {uniqueEstablishments.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEstType} onValueChange={setFilterEstType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Establishment Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Establishment Types</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Residential">Residential</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Application Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Application Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative col-span-2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, address, type, or inspector..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>

        <FadeInSection delay={300}>
          {loading ? (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg rounded-xl">
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="ml-2 text-gray-600">Loading your inspections...</span>
                </div>
              </CardContent>
            </Card>
          ) : errorMessage ? (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg rounded-xl">
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-muted-foreground">{errorMessage}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger
                  value="pending"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-yellow-500 data-[state=active]:text-white hover:bg-yellow-100 transition-all duration-200"
                >
                  Pending ({filteredPendingInspections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white hover:bg-blue-100 transition-all duration-200"
                >
                  Scheduled ({filteredScheduledInspections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="inspected"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white hover:bg-purple-100 transition-all duration-200"
                >
                  Inspected ({filteredInspectedInspections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white hover:bg-green-100 transition-all duration-200"
                >
                  Approved ({filteredApprovedInspections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white hover:bg-red-100 transition-all duration-200"
                >
                  Rejected ({filteredRejectedInspections.length})
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-gray-500 data-[state=active]:text-white hover:bg-gray-100 transition-all duration-200"
                >
                  Cancelled ({filteredCancelledInspections.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                <InspectionsList
                  inspections={filteredPendingInspections}
                  viewInspectionDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                />
              </TabsContent>

              <TabsContent value="scheduled">
                <InspectionsList
                  inspections={filteredScheduledInspections}
                  viewInspectionDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                />
              </TabsContent>

              <TabsContent value="inspected">
                <InspectionsList
                  inspections={filteredInspectedInspections}
                  viewInspectionDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                />
              </TabsContent>

              <TabsContent value="approved">
                <InspectionsList
                  inspections={filteredApprovedInspections}
                  viewInspectionDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                />
              </TabsContent>

              <TabsContent value="rejected">
                <InspectionsList
                  inspections={filteredRejectedInspections}
                  viewInspectionDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                  onReinspect={(inspectionId) => {
                    setReinspectInspectionId(inspectionId);
                    setIsReinspectDialogOpen(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="cancelled">
                <InspectionsList
                  inspections={filteredCancelledInspections}
                  viewInspectionDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                />
              </TabsContent>
            </Tabs>
          )}
        </FadeInSection>

        {selectedInspection && (
          <InspectionDetailsDialog
            inspection={selectedInspection}
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          />
        )}

        <Dialog open={isReinspectDialogOpen} onOpenChange={setIsReinspectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Reinspection</DialogTitle>
              <DialogDescription>
                Are you sure you want to request a reinspection? This will move the inspection to pending status.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReinspectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReinspectRequest}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayoutWrapper>
  );
};

interface InspectionsListProps {
  inspections: Inspection[];
  viewInspectionDetails: (inspection: Inspection) => void;
  handleViewCertificate: (certificateUrl: string) => void;
  onReinspect?: (inspectionId: string) => void;
}

const InspectionsList = ({
  inspections,
  viewInspectionDetails,
  handleViewCertificate,
  onReinspect,
}: InspectionsListProps) => {
  const isMobile = useIsMobile();

  const getStatusBadge = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Scheduled</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'inspected':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Inspected</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardContent className="p-6">
        {inspections.length > 0 ? (
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'} gap-4 pb-16 md:pb-0`}>
            {inspections.map((inspection) => (
              <div key={inspection.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">{inspection.establishment_name}</h3>
                    <p className="text-sm text-muted-foreground">{inspection.type}</p>
                  </div>
                  {getStatusBadge(inspection.status as InspectionStatus)}
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="h-3 w-3" />
                    <span>
                      Scheduled: {inspection.scheduledDate
                        ? new Date(inspection.scheduledDate).toLocaleDateString()
                        : 'Not scheduled'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 flex-wrap">
                  {inspection.status === 'rejected' && onReinspect && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => onReinspect(inspection.id)}
                    >
                      <span>Reinspect</span>
                    </Button>
                  )}
                  {inspection.status === 'approved' && inspection.certificate_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => handleViewCertificate(inspection.certificate_url!)}
                    >
                      <Download className="h-3 w-3" />
                      <span>View Certificate</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => viewInspectionDetails(inspection)}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Details</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No inspections found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OwnerInspections;
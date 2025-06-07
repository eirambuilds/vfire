import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, AlertCircle, Download, Loader2, Edit, SearchIcon, Calendar, RefreshCw, Plus, XCircle } from 'lucide-react';
import { Application, ApplicationType } from '@/types/application';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { ApplicationDetailsDialog } from '@/components/shared/applications/ApplicationDetailsDialog';
import { InspectionDetailsDialog } from '@/components/shared/inspections/InspectionDetailsDialog';
import { CertificationModal } from '@/components/owner/CertificationModal';
import { Input } from '@/components/ui/input';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const OwnerApplications = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEstablishment, setFilterEstablishment] = useState<string>('all');
  const [filterEstType, setFilterEstType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInspectionDetailsOpen, setIsInspectionDetailsOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [applicationToCancel, setApplicationToCancel] = useState<Application | null>(null);
  const [initialModalData, setInitialModalData] = useState<{
    establishment_id: string;
    applicationType: ApplicationType;
    applicationData: Application | null;
  }>({ establishment_id: '', applicationType: '' as ApplicationType, applicationData: null });
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get('tab') || 'pending';

  useEffect(() => {
    if (location.state?.openApplyModal && location.state?.initialData) {
      setInitialModalData({ ...location.state.initialData, applicationData: null });
      setIsCertificationModalOpen(true);
      navigate(location.pathname, { replace: true });
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            submitted_at,
            updated_at,
            type,
            status,
            establishment_id,
            owner_id,
            certificate_url,
            rejection_reasons,
            rejection_notes,
            dti_number,
            establishment_name,
            establishment_type,
            occupancy,
            storeys,
            floor_area,
            occupants,
            owner_first_name,
            owner_last_name,
            owner_middle_name,
            owner_suffix,
            owner_email,
            owner_mobile,
            owner_landline,
            rep_first_name,
            rep_last_name,
            rep_middle_name,
            rep_suffix,
            rep_email,
            rep_mobile,
            rep_landline,
            street,
            barangay,
            city,
            province,
            region,
            latitude,
            longitude,
            contractor_name,
            fsec_number,
            occupancy_permit_no,
            business_status,
            establishments (
              id,
              name,
              type,
              address,
              dti_number
            )
          `)
          .eq('owner_id', user.id);

        if (error) throw error;

        const formattedData: Application[] = data.map((app: any) => ({
          id: app.id,
          submitted_at: app.submitted_at,
          updated_at: app.updated_at || app.submitted_at,
          type: app.type as ApplicationType,
          status: app.status,
          establishment_id: app.establishment_id,
          owner_id: app.owner_id,
          certificate_url: app.certificate_url || null,
          rejection_reasons: app.rejection_reasons || [],
          rejection_notes: app.rejection_notes || '',
          dti_number: app.dti_number || 'N/A',
          establishment_name: app.establishment_name || 'N/A',
          establishment_type: app.establishment_type || 'N/A',
          occupancy: app.occupancy || 'N/A',
          storeys: app.storeys || 'N/A',
          floor_area: app.floor_area || 'N/A',
          occupants: app.occupants || 'N/A',
          owner_first_name: app.owner_first_name || 'N/A',
          owner_last_name: app.owner_last_name || 'N/A',
          owner_middle_name: app.owner_middle_name || 'N/A',
          owner_suffix: app.owner_suffix || 'N/A',
          owner_email: app.owner_email || 'N/A',
          owner_mobile: app.owner_mobile || 'N/A',
          owner_landline: app.owner_landline || 'N/A',
          rep_first_name: app.rep_first_name || 'N/A',
          rep_last_name: app.rep_last_name || 'N/A',
          rep_middle_name: app.rep_middle_name || 'N/A',
          rep_suffix: app.rep_suffix || 'N/A',
          rep_email: app.rep_email || 'N/A',
          rep_mobile: app.rep_mobile || 'N/A',
          rep_landline: app.rep_landline || 'N/A',
          street: app.street || 'N/A',
          barangay: app.barangay || 'N/A',
          city: app.city || 'N/A',
          province: app.province || 'N/A',
          region: app.region || 'N/A',
          latitude: app.latitude || null,
          longitude: app.longitude || null,
          contractor_name: app.contractor_name || '',
          fsec_number: app.fsec_number || '',
          occupancy_permit_no: app.occupancy_permit_no || '',
          business_status: app.business_status || null,
          establishments: {
            id: app.establishments.id,
            name: app.establishments.name || 'Unnamed Establishment',
            type: app.establishments.type || 'N/A',
            address: app.establishments.address || 'N/A',
            dti_number: app.establishments.dti_number || 'N/A',
          },
          profiles: null,
          ownerName: user ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : 'N/A',
        }));

        setApplications(formattedData);
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load your applications.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [toast, location, navigate]);

  const getFilteredAndSortedApplications = (apps: Application[]) => {
    let filtered = [...apps];

    if (filterType !== 'all') {
      filtered = filtered.filter(app => app.type === filterType);
    }

    if (filterEstablishment !== 'all') {
      filtered = filtered.filter(app => app.establishments.name === filterEstablishment);
    }

    if (filterEstType !== 'all') {
      filtered = filtered.filter(app => app.establishments.type === filterEstType);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.establishments.name.toLowerCase().includes(searchLower) ||
        app.establishments.address.toLowerCase().includes(searchLower) ||
        app.establishments.dti_number?.toLowerCase().includes(searchLower) ||
        app.ownerName.toLowerCase().includes(searchLower)
      );
    }

    filtered = filtered.filter(app => {
      const submittedDate = new Date(app.submitted_at);
      const matchesStart = !startDate || submittedDate >= new Date(startDate);
      const matchesEnd = !endDate || submittedDate <= new Date(endDate);
      return matchesStart && matchesEnd;
    });

    filtered.sort((a, b) => {
      if (sortOrder === 'newest' || sortOrder === 'oldest') {
        const dateA = new Date(a.submitted_at).getTime();
        const dateB = new Date(b.submitted_at).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      } else {
        const nameA = a.establishments.name.toLowerCase();
        const nameB = b.establishments.name.toLowerCase();
        return sortOrder === 'a-z' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
    });

    return filtered;
  };

  const handleEdit = (application: Application) => {
    setInitialModalData({
      establishment_id: application.establishment_id,
      applicationType: application.type,
      applicationData: application,
    });
    setIsCertificationModalOpen(true);
  };

  const handleReapply = (application: Application) => {
    setInitialModalData({
      establishment_id: application.establishment_id,
      applicationType: application.type,
      applicationData: { ...application, status: 'pending' },
    });
    setIsCertificationModalOpen(true);
  };

  const handleApplyForApplication = () => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      setInitialModalData({ establishment_id: '', applicationType: '' as ApplicationType, applicationData: null });
      setIsCertificationModalOpen(true);
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  const handleCancelApplication = (application: Application) => {
    setApplicationToCancel(application);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelApplication = async () => {
    if (!applicationToCancel) return;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationToCancel.id);

      if (error) throw error;

      setApplications(prev => prev.filter(app => app.id !== applicationToCancel.id));
      toast({
        title: 'Success',
        description: 'Application cancelled successfully.',
        variant: 'default',
      });
    } catch (err: any) {
      console.error('Error cancelling application:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelDialogOpen(false);
      setApplicationToCancel(null);
    }
  };

  const handleApplicationSubmitted = (newApplication: any) => {
    setApplications(prev => {
      const exists = prev.some(app => app.id === newApplication.id);
      if (exists) {
        return prev.map(app =>
          app.id === newApplication.id
            ? {
                ...app,
                ...{
                  id: newApplication.id,
                  submitted_at: newApplication.submitted_at,
                  updated_at: newApplication.updated_at || newApplication.submitted_at,
                  type: newApplication.type as ApplicationType,
                  status: newApplication.status || 'pending',
                  establishment_id: newApplication.establishment_id,
                  owner_id: newApplication.owner_id,
                  certificate_url: newApplication.certificate_url || null,
                  rejection_reasons: newApplication.rejection_reasons || [],
                  rejection_notes: newApplication.rejection_notes || '',
                  dti_number: newApplication.dti_number || 'N/A',
                  establishment_name: newApplication.establishment_name || 'N/A',
                  establishment_type: newApplication.establishment_type || 'N/A',
                  occupancy: newApplication.occupancy || 'N/A',
                  storeys: newApplication.storeys || 'N/A',
                  floor_area: newApplication.floor_area || 'N/A',
                  occupants: newApplication.occupants || 'N/A',
                  owner_first_name: newApplication.owner_first_name || 'N/A',
                  owner_last_name: newApplication.owner_last_name || 'N/A',
                  owner_middle_name: newApplication.owner_middle_name || 'N/A',
                  owner_suffix: newApplication.owner_suffix || 'N/A',
                  owner_email: newApplication.owner_email || 'N/A',
                  owner_mobile: newApplication.owner_mobile || 'N/A',
                  owner_landline: newApplication.owner_landline || 'N/A',
                  rep_first_name: newApplication.rep_first_name || 'N/A',
                  rep_last_name: newApplication.rep_last_name || 'N/A',
                  rep_middle_name: newApplication.rep_middle_name || 'N/A',
                  rep_suffix: newApplication.rep_suffix || 'N/A',
                  rep_email: newApplication.rep_email || 'N/A',
                  rep_mobile: newApplication.rep_mobile || 'N/A',
                  rep_landline: newApplication.rep_landline || 'N/A',
                  street: newApplication.street || 'N/A',
                  barangay: newApplication.barangay || 'N/A',
                  city: newApplication.city || 'N/A',
                  province: newApplication.province || 'N/A',
                  region: newApplication.region || 'N/A',
                  latitude: newApplication.latitude || null,
                  longitude: newApplication.longitude || null,
                  contractor_name: newApplication.contractor_name || '',
                  fsec_number: newApplication.fsec_number || '',
                  occupancy_permit_no: newApplication.occupancy_permit_no || '',
                  business_status: newApplication.business_status || null,
                  establishments: {
                    id: newApplication.establishment_id,
                    name: newApplication.establishment_name || 'Unnamed Establishment',
                    type: newApplication.establishment_type || 'N/A',
                    address: newApplication.street || 'N/A',
                    dti_number: newApplication.dti_number || 'N/A',
                  },
                  profiles: null,
                  ownerName: newApplication.owner_first_name
                    ? `${newApplication.owner_first_name} ${newApplication.owner_last_name}`
                    : 'N/A',
                },
              }
            : app
        );
      }
      return [
        {
          id: newApplication.id,
          submitted_at: newApplication.submitted_at,
          updated_at: newApplication.updated_at || newApplication.submitted_at,
          type: newApplication.type as ApplicationType,
          status: newApplication.status || 'pending',
          establishment_id: newApplication.establishment_id,
          owner_id: newApplication.owner_id,
          certificate_url: newApplication.certificate_url || null,
          rejection_reasons: newApplication.rejection_reasons || [],
          rejection_notes: newApplication.rejection_notes || '',
          dti_number: newApplication.dti_number || 'N/A',
          establishment_name: newApplication.establishment_name || 'N/A',
          establishment_type: newApplication.establishment_type || 'N/A',
          occupancy: newApplication.occupancy || 'N/A',
          storeys: newApplication.storeys || 'N/A',
          floor_area: newApplication.floor_area || 'N/A',
          occupants: newApplication.occupants || 'N/A',
          owner_first_name: newApplication.owner_first_name || 'N/A',
          owner_last_name: newApplication.owner_last_name || 'N/A',
          owner_middle_name: newApplication.owner_middle_name || 'N/A',
          owner_suffix: newApplication.owner_suffix || 'N/A',
          owner_email: newApplication.owner_email || 'N/A',
          owner_mobile: newApplication.owner_mobile || 'N/A',
          owner_landline: newApplication.owner_landline || 'N/A',
          rep_first_name: newApplication.rep_first_name || 'N/A',
          rep_last_name: newApplication.rep_last_name || 'N/A',
          rep_middle_name: newApplication.rep_middle_name || 'N/A',
          rep_suffix: newApplication.rep_suffix || 'N/A',
          rep_email: newApplication.rep_email || 'N/A',
          rep_mobile: newApplication.rep_mobile || 'N/A',
          rep_landline: newApplication.rep_landline || 'N/A',
          street: newApplication.street || 'N/A',
          barangay: newApplication.barangay || 'N/A',
          city: newApplication.city || 'N/A',
          province: newApplication.province || 'N/A',
          region: newApplication.region || 'N/A',
          latitude: newApplication.latitude || null,
          longitude: newApplication.longitude || null,
          contractor_name: newApplication.contractor_name || '',
          fsec_number: newApplication.fsec_number || '',
          occupancy_permit_no: newApplication.occupancy_permit_no || '',
          business_status: newApplication.business_status || null,
          establishments: {
            id: newApplication.establishment_id,
            name: newApplication.establishment_name || 'Unnamed Establishment',
            type: newApplication.establishment_type || 'N/A',
            address: newApplication.street || 'N/A',
            dti_number: newApplication.dti_number || 'N/A',
          },
          profiles: null,
          ownerName: newApplication.owner_first_name
            ? `${newApplication.owner_first_name} ${newApplication.owner_last_name}`
            : 'N/A',
        },
        ...prev,
      ];
    });
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const approvedApplications = applications.filter(app => app.status === 'approved');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

  const filteredPendingApplications = getFilteredAndSortedApplications(pendingApplications);
  const filteredApprovedApplications = getFilteredAndSortedApplications(approvedApplications);
  const filteredRejectedApplications = getFilteredAndSortedApplications(rejectedApplications);

  const getApplicationTypeName = (type: ApplicationType) => {
    switch (type) {
      case 'FSEC': return 'Fire Safety Evaluation Clearance';
      case 'FSIC-Occupancy': return 'Fire Safety Inspection Certificate (Occupancy)';
      case 'FSIC-Business': return 'Fire Safety Inspection Certificate (Business)';
      default: return type;
    }
  };

  const uniqueEstablishments = Array.from(new Set(applications.map(app => app.establishments.name)));
  const uniqueEstTypes = Array.from(new Set(applications.map(app => app.establishments.type)));

  const handleViewDetails = (app: Application) => {
    setSelectedApplication(app);
    setIsDetailsOpen(true);
  };

  const handleViewInspection = (app: Application) => {
    setSelectedApplication(app);
    setIsInspectionDetailsOpen(true);
  };

  const handleViewCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank');
  };

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date ? date.toISOString().split('T')[0] : '');
  };
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date ? date.toISOString().split('T')[0] : '');
  };

  const fieldStyles = 'w-full border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500';

  return (
    <DashboardLayout title="Applications" userRole="owner">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Applications
          </h1>
          <p className="text-muted-foreground">
            View and manage your applications for fire safety evaluation clearance, fire safety inspection certificate (occupancy), and fire safety inspection certificate (business).
          </p>
        </div>

        <FadeInSection delay={200}>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                    {uniqueEstTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Application Types</SelectItem>
                    <SelectItem value="FSEC">Fire Safety Evaluation Clearance</SelectItem>
                    <SelectItem value="FSIC-Occupancy">FSIC (Occupancy)</SelectItem>
                    <SelectItem value="FSIC-Business">FSIC (Business)</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative col-span-2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by Establishment name, address, or DTI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button
                  onClick={handleApplyForApplication}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  Apply for Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>

        <FadeInSection delay={300}>
          {isLoading ? (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg rounded-xl">
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="ml-2 text-gray-600">Loading your applications...</span>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg rounded-xl">
              <CardContent className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-muted-foreground">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={defaultTab} className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger
                  value="pending"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-yellow-500 data-[state=active]:text-white hover:bg-yellow-100 transition-all duration-200"
                >
                  Pending ({filteredPendingApplications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white hover:bg-green-100 transition-all duration-200"
                >
                  Approved ({filteredApprovedApplications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="flex-1 py-3 text-gray-700 font-medium rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white hover:bg-red-100 transition-all duration-200"
                >
                  Rejected ({filteredRejectedApplications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <ApplicationsList
                  applications={filteredPendingApplications}
                  getApplicationTypeName={getApplicationTypeName}
                  viewApplicationDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                  setApplications={setApplications}
                  onEdit={handleEdit}
                  onCancel={handleCancelApplication}
                />
              </TabsContent>

              <TabsContent value="approved">
                <ApplicationsList
                  applications={filteredApprovedApplications}
                  getApplicationTypeName={getApplicationTypeName}
                  viewApplicationDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                  handleViewInspection={handleViewInspection}
                  setApplications={setApplications}
                />
              </TabsContent>

              <TabsContent value="rejected">
                <ApplicationsList
                  applications={filteredRejectedApplications}
                  getApplicationTypeName={getApplicationTypeName}
                  viewApplicationDetails={handleViewDetails}
                  handleViewCertificate={handleViewCertificate}
                  setApplications={setApplications}
                  onReapply={handleReapply}
                  onCancel={handleCancelApplication}
                />
              </TabsContent>
            </Tabs>
          )}
        </FadeInSection>

        <ApplicationDetailsDialog
          application={selectedApplication}
          open={isDetailsOpen}
          onOpenChange={(open) => {
            setIsDetailsOpen(open);
            if (!open) setSelectedApplication(null);
          }}
        />

        <InspectionDetailsDialog
          inspection={selectedApplication}
          open={isInspectionDetailsOpen}
          onOpenChange={(open) => {
            setIsInspectionDetailsOpen(open);
            if (!open) setSelectedApplication(null);
          }}
        />

        <CertificationModal
          open={isCertificationModalOpen}
          onOpenChange={setIsCertificationModalOpen}
          initialData={initialModalData}
          onApplicationSubmitted={handleApplicationSubmitted}
        />

        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                Cancel Application
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Are you sure you want to cancel the {applicationToCancel?.type || 'application'} for{" "}
                <span className="font-semibold text-orange-600">{applicationToCancel?.establishments?.name}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Keep Application
              </Button>
              <Button variant="destructive" onClick={confirmCancelApplication}>
                Cancel Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

interface ApplicationsListProps {
  applications: Application[];
  getApplicationTypeName: (type: ApplicationType) => string;
  viewApplicationDetails: (application: Application) => void;
  handleViewCertificate: (certificateUrl: string) => void;
  handleViewInspection?: (application: Application) => void;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  onReapply?: (application: Application) => void;
  onEdit?: (application: Application) => void;
  onCancel?: (application: Application) => void;
}

const ApplicationsList = ({
  applications,
  getApplicationTypeName,
  viewApplicationDetails,
  handleViewCertificate,
  handleViewInspection,
  setApplications,
  onReapply,
  onEdit,
  onCancel,
}: ApplicationsListProps) => {
  const isMobile = useIsMobile();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
          >
            Pending
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
          >
            Scheduled
          </Badge>
        );
      case 'inspected':
        return (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-purple-100 text-purple-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
          >
            Inspected
          </Badge>
        );
      case 'approved':
        return (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
          >
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-red-100 text-red-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
          >
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 bg-gray-100 text-gray-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
          >
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardContent className="p-6">
        {applications.length > 0 ? (
          <div
            className={`grid grid-cols-1 ${
              isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
            } gap-4 pb-16 md:pb-0`}
          >
            {applications.map((application) => (
              <Card key={application.id} className="relative overflow-hidden p-4">
                {getStatusBadge(application.status)}
                <CardHeader className="pb-4 mt-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    {application.establishments.name}
                  </CardTitle>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">DTI Number:</span> {application.establishments.dti_number}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Application Type:</span> {getApplicationTypeName(application.type)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Submitted:</span> {new Date(application.submitted_at).toLocaleDateString()}
                  </p>
                  <div className="mt-4 space-y-2">
                    {application.status === 'pending' ? (
                      <>
                        {onEdit && (
                          <Button
                            variant="default"
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={() => onEdit(application)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </Button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-2">
                            {application.certificate_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                                onClick={() => handleViewCertificate(application.certificate_url!)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                <span>View Certificate</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                              onClick={() => viewApplicationDetails(application)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              <span>Details</span>
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : application.status === 'rejected' ? (
                      <>
                        {onReapply && (
                          <Button
                            variant="default"
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={() => onReapply(application)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            <span>Reapply</span>
                          </Button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-2">
                            {application.certificate_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                                onClick={() => handleViewCertificate(application.certificate_url!)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                <span>View Certificate</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                              onClick={() => viewApplicationDetails(application)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              <span>Details</span>
                            </Button>
                          </div>
                          {onCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                              onClick={() => onCancel(application)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              <span>Cancel</span>
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between gap-2 flex-wrap">
                        <div className="space-y-2 flex-1">
                          {application.certificate_url && (
                            <Button
                              variant="default"
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => handleViewCertificate(application.certificate_url!)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              <span>View Certificate</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-600"
                            onClick={() => viewApplicationDetails(application)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            <span>Details</span>
                          </Button>
                          {(application.type === 'FSIC-Occupancy' || application.type === 'FSIC-Business') && handleViewInspection && (
                            <Button
                              className="w-full"
                              onClick={() => handleViewInspection(application)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              <span>View Inspection</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No applications found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OwnerApplications;
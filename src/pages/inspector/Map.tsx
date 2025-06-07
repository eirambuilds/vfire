import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FadeInSection } from "@/components/ui/animations/FadeInSection";
import EstablishmentsMap from "@/components/ui/map/EstablishmentsMap";
import { useToast } from "@/hooks/use-toast";
import { MapDetailsDialog } from "@/components/shared/map/MapDetailsDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, MapPin, Building } from "lucide-react";
import { Establishment } from '@/types/inspection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from 'uuid';

const InspectorMap = () => {
  const { toast } = useToast();
  const [registeredEstablishments, setRegisteredEstablishments] = useState<Establishment[]>([]);
  const [userData, setUserData] = useState<{ id: string } | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certificationType, setCertificationType] = useState('fsic_business');

  const statusColors = useMemo(() => ({
    pending: '#FACC15',
    scheduled: '#3B82F6',
    inspected: '#8B5CF6',
    approved: '#22C55E',
    rejected: '#EF4444',
    cancelled: '#9CA3AF',
  }), []);

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);

      // Step 1: Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Step 2: Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error(`Failed to fetch user profile: ${profileError?.message || 'Profile not found'}`);
      }

      setUserData(profileData);
      const inspectorId = user.id;

      // Step 3: Fetch data concurrently
      const [{ data: inspectionsData, error: inspectionsError }, 
             { data: applicationsData, error: applicationsError }, 
             { data: establishmentsData, error: establishmentsError }] = await Promise.all([
        supabase.from('inspections')
          .select('id, establishment_id, type, status, scheduled_date, application_id')
          .eq('inspector_id', inspectorId),
        supabase.from('applications')
          .select('id, establishment_id, type, status')
          .in('type', ['FSIC-Occupancy', 'FSIC-Business'])
          .in('status', ['approved', 'pending', 'rejected']),
        supabase.from('establishments')
          .select('id, name, latitude, longitude, address, type, dti_number, date_registered')
      ]);

      if (inspectionsError) throw inspectionsError;
      if (applicationsError) throw applicationsError;
      if (establishmentsError) throw establishmentsError;

      // Filter applications by certification type and inspector's inspections
      const inspectionApplicationIds = inspectionsData
        .map(ins => ins.application_id)
        .filter(id => id !== null && id !== undefined);
      const filteredApplications = applicationsData
        .filter(app => inspectionApplicationIds.includes(app.id) && 
                      app.type.toLowerCase().replace('-', '_') === certificationType);

      let inspectionData = filteredApplications.map(app => {
        const existingInspection = inspectionsData.find(ins => ins.application_id === app.id);
        return existingInspection || {
          id: uuidv4(),
          establishment_id: app.establishment_id,
          type: app.type,
          status: 'pending',
          scheduled_date: null,
          application_id: app.id,
        };
      });

      const updatedInspectionData = inspectionData.map(inspection => {
        if (inspection.scheduled_date && new Date(inspection.scheduled_date) < new Date(new Date().setHours(0, 0, 0, 0))) {
          return { ...inspection, status: 'cancelled' };
        }
        return inspection;
      });

      const statusData = updatedInspectionData;
      const establishmentIdsWithStatus = statusData
        .map(data => data.establishment_id)
        .filter(id => id !== null && id !== undefined);

      const mappedData = (establishmentsData || [])
        .filter(establishment => establishmentIdsWithStatus.includes(establishment.id))
        .map(establishment => {
          const matchingStatusData = statusData.find(data => data.establishment_id === establishment.id);
          if (!matchingStatusData) return null;
          if (establishment.latitude == null || establishment.longitude == null || 
              isNaN(establishment.latitude) || isNaN(establishment.longitude)) {
            return null;
          }

          return {
            id: establishment.id,
            name: establishment.name || 'Unknown',
            latitude: Number(establishment.latitude),
            longitude: Number(establishment.longitude),
            status: matchingStatusData.status,
            address: establishment.address || '',
            type: establishment.type || '',
            dti_number: establishment.dti_number || '',
            date_registered: establishment.date_registered || null,
          };
        }).filter((item): item is Establishment => item !== null);

      setRegisteredEstablishments(mappedData);
    } catch (err: any) {
      console.error('Error fetching inspections:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to load inspections.",
        variant: "destructive",
      });
      setRegisteredEstablishments([]);
    } finally {
      setLoading(false);
    }
  }, [toast, certificationType]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleMarkerClick = useCallback((establishment: Establishment) => {
    setSelectedEstablishment(establishment);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedEstablishment(null);
    setDetailsDialogOpen(false);
  }, []);

  const handleViewDetails = useCallback(() => {
    setDetailsDialogOpen(true);
  }, []);

  const mapVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const detailsVariants = {
    hidden: { opacity: 0, width: 0 },
    visible: { opacity: 1, width: 'auto', transition: { duration: 0.3 } },
  };

  return (
    <DashboardLayout title="Map" userRole="inspector">
      <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">Assigned Establishments Map</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            View your assigned FSIC inspections. Click a marker for details.
          </p>
        </div>

        <FadeInSection delay={100}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-gray-700">FSIC Type:</span>
              <Select
                value={certificationType}
                onValueChange={setCertificationType}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select FSIC Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fsic_business">FSIC (Business)</SelectItem>
                  <SelectItem value="fsic_occupancy">FSIC (Occupancy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection delay={150}>
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="flex-1 flex flex-col md:flex-row gap-4 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center flex-1">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  Loading inspections...
                </motion.div>
              </div>
            ) : registeredEstablishments.length === 0 ? (
              <div className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  No inspections to display on the map.
                </motion.div>
              </div>
            ) : (
              <>
                <motion.div
                  variants={mapVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex-1 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]"
                >
                  <EstablishmentsMap
                    establishments={registeredEstablishments}
                    onMarkerClick={handleMarkerClick}
                    selectedEstablishment={selectedEstablishment}
                    statusColors={statusColors}
                  />
                </motion.div>

                <AnimatePresence>
                  {selectedEstablishment && (
                    <motion.div
                      variants={detailsVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="w-full md:w-80 lg:w-96 p-4"
                    >
                      <Card className="p-4 bg-gradient-to-br from-white to-gray-100 shadow-xl rounded-lg border-l-4 border-red-400">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-gray-800 truncate">
                            {selectedEstablishment.name}
                          </h2>
                          <button
                            onClick={handleCloseDetails}
                            className="p-1 rounded-full hover:bg-red-100 transition-colors"
                            aria-label="Close details"
                          >
                            <XCircle className="h-5 w-5 text-red-500" />
                          </button>
                        </div>
                        <div className="space-x-2 my-3">
                          <Badge
                            className="text-white"
                            style={{ backgroundColor: statusColors[selectedEstablishment.status] }}
                          >
                            {selectedEstablishment.status.replace('-', ' ')}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800">
                            {selectedEstablishment.type || 'N/A'}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="font-medium">Address:</span> 
                            <span className="truncate">{selectedEstablishment.address || 'N/A'}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-red-500" />
                            <span className="font-medium">DTI Number:</span> 
                            {selectedEstablishment.dti_number || 'N/A'}
                          </p>
                        </div>
                        <div className="mt-4">
                          <Button
                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                            size="sm"
                            onClick={handleViewDetails}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </FadeInSection>

        {selectedEstablishment && (
          <MapDetailsDialog
            establishment={selectedEstablishment}
            open={detailsDialogOpen}
            onOpenChange={handleCloseDetails}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default InspectorMap;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Eye, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CertificationModal } from '@/components/owner/CertificationModal';
import { EstablishmentDetailsDialog } from '@/components/shared/establishments/EstablishmentDetailsDialog';
import { Establishment } from '@/types/inspection';

interface RegisteredEstablishmentsProps {
  getOwnerName: (owner_id: string) => string;
}

interface EnhancedEstablishment extends Establishment {
  applicationStatus: 'none' | 'pending' | 'rejected';
}

export function RegisteredEstablishments({ getOwnerName }: RegisteredEstablishmentsProps) {
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [viewEstablishment, setViewEstablishment] = useState<Establishment | null>(null);
  const [establishments, setEstablishments] = useState<EnhancedEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEstablishments() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error(authError?.message || 'User not authenticated');
        }

        const userId = user.id;
        // Fetch establishments
        const { data: establishmentsData, error: establishmentsError } = await supabase
          .from('establishments')
          .select('*')
          .eq('status', 'registered')
          .eq('owner_id', userId);

        if (establishmentsError) throw establishmentsError;

        // Fetch applications for all establishments
        const establishmentIds = establishmentsData?.map((est: any) => est.id) || [];
        let applications: any[] = [];
        if (establishmentIds.length > 0) {
          const { data: applicationsData, error: applicationsError } = await supabase
            .from('applications')
            .select('establishment_id, status')
            .in('establishment_id', establishmentIds)
            .in('status', ['pending', 'rejected'])
            .eq('owner_id', userId);
          if (applicationsError) throw applicationsError;
          applications = applicationsData || [];
        }

        // Map establishments with applicationStatus
        setEstablishments(
          (establishmentsData || []).map((est: any) => {
            const application = applications.find((app: any) => app.establishment_id === est.id);
            return {
              ...est,
              dti_number: est.dti_number,
              date_registered: est.date_registered,
              owner_id: est.owner_id,
              applicationStatus: application ? application.status : 'none',
            };
          })
        );
      } catch (err: any) {
        console.error('Error fetching establishments:', err);
        setError('Failed to load your registered establishments. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEstablishments();
  }, []);

  const handleOpenCertificationModal = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
  };

  const handleApplicationSubmitted = (newApplication: any) => {
    console.log('Application submitted:', newApplication);
    // Update the establishments list to reflect the new pending application
    setEstablishments((prev) =>
      prev.map((est) =>
        est.id === newApplication.establishment_id
          ? { ...est, applicationStatus: 'pending' }
          : est
      )
    );
    setSelectedEstablishment(null);
  };

  const handleCloseCertificationModal = () => {
    setSelectedEstablishment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading your registered establishments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {establishments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No registered establishments</h3>
          <p className="text-gray-500 mt-1">You currently have no establishments in registered status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {establishments.map((establishment) => (
            <Card key={establishment.id} className="relative overflow-hidden p-4">
              <Badge
                variant="outline"
                className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
              >
                Registered
              </Badge>

              <CardHeader className="pb-4 mt-2">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  {establishment.name}
                </CardTitle>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">DTI Number:</span> {establishment.dti_number}
                </p>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Establishment Type:</span> {establishment.type || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Address: </span> {establishment.address || 'N/A'}
                </p>

                <div className="mt-4 space-y-2">
                  <Button
                    variant="default"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleOpenCertificationModal(establishment)}
                    disabled={establishment.applicationStatus !== 'none'}
                  >
                    Apply for Certification
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 hover:text-orange-600"
                    onClick={() => setViewEstablishment(establishment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedEstablishment && (
        <CertificationModal
          open={!!selectedEstablishment}
          onOpenChange={handleCloseCertificationModal}
          initialData={{
            establishment_id: selectedEstablishment.id,
            applicationType: 'FSEC' as const,
            applicationData: null,
          }}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      <EstablishmentDetailsDialog
        establishment={viewEstablishment}
        open={!!viewEstablishment}
        onOpenChange={(open) => {
          if (!open) setViewEstablishment(null);
        }}
        getOwnerName={getOwnerName}
      />
    </div>
  );
}
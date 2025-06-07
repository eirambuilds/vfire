import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Building2Icon, Plus } from 'lucide-react';
import { RegistrationModal } from '@/components/owner/RegistrationModal'; // Import RegistrationModal
import { UnregisteredEstablishments } from '@/components/owner/UnregisteredEstablishments';
import { PreRegisteredEstablishments } from '@/components/owner/PreRegisteredEstablishments';
import { RegisteredEstablishments } from '@/components/owner/RegisteredEstablishments';
import { CertificationModal } from '@/components/owner/CertificationModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

const OwnerEstablishments = () => {
  const { toast } = useToast();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false); // Updated state for RegistrationModal
  const [refreshKey, setRefreshKey] = useState(0);
  const [ownerName, setOwnerName] = useState<string>('N/A');
  const [owner_id, setOwnerId] = useState<string | null>(null);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [initialCertificationData, setInitialCertificationData] = useState<any>(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch the current user's name and ID from Supabase auth
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
          setOwnerId(user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          const name = profile ? `${profile.first_name} ${profile.last_name}` : 'N/A';
          setOwnerName(name);
        }
      } catch (err: any) {
        console.error('Error fetching owner data:', err);
        toast({
          title: "Error",
          description: "Failed to load owner information.",
          variant: "destructive",
        });
        setOwnerName('N/A');
      }
    };

    fetchOwnerData();

    // Handle navigation state from applications page
    if (location.state?.openApplyModal && location.state?.initialData) {
      setInitialCertificationData(location.state.initialData);
      setIsCertificationModalOpen(true);
      navigate('/owner/establishments', { replace: true, state: {} });
    }
  }, [toast, location, navigate]);

  const getOwnerName = (owner_idParam: string) => {
    return owner_id && owner_id === owner_idParam ? ownerName : 'N/A';
  };

  const handleEstablishmentAdded = () => {
    setRefreshKey(prev => prev + 1); // Refresh tabs to show new pre-registered establishment
    setShowRegistrationModal(false); // Close modal
  };

  const handleApplicationSubmitted = (newApplication: any) => {
    toast({
      title: "Application Submitted",
      description: "Your reapplication has been submitted successfully.",
      variant: "default",
    });
    setIsCertificationModalOpen(false);
    setInitialCertificationData(null);
  };

  return (
    <DashboardLayout title="My Establishments" userRole="owner">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2Icon className="h-5 w-5 text-primary" />
            My Establishments
          </h1>
          <p className="text-muted-foreground">
            You can register new establishments, view pre-registered establishments, and apply for certifications for registered establishments.
          </p>
        </div>

        <FadeInSection delay={200}>
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue="unregistered" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger
                      value="unregistered"
                      className="data-[state=active]:bg-gray-500 data-[state=active]:text-white"
                    >
                      Unregistered
                    </TabsTrigger>
                    
                    <TabsTrigger
                      value="pre-registered"
                      className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white"
                    >
                      Pre-registered
                    </TabsTrigger>
                    
                    <TabsTrigger
                      value="registered"
                      className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                    >
                      Registered
                    </TabsTrigger>
                  </TabsList>

                  
                  <Button 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => setShowRegistrationModal(true)} // Open RegistrationModal
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register New Establishment
                  </Button>
                </div>

                <div className="mt-4">
                  <TabsContent value="unregistered">
                    <UnregisteredEstablishments 
                      refreshKey={refreshKey}
                      getOwnerName={getOwnerName}
                    />
                  </TabsContent>

                  <TabsContent value="pre-registered">
                    <PreRegisteredEstablishments getOwnerName={getOwnerName} />
                  </TabsContent>

                  <TabsContent value="registered">
                    <RegisteredEstablishments getOwnerName={getOwnerName} />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </FadeInSection>
      </div>
      
      <RegistrationModal 
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onRegistrationSuccess={handleEstablishmentAdded}
      />

      {isCertificationModalOpen && initialCertificationData && (
        <CertificationModal
          open={isCertificationModalOpen}
          onOpenChange={(open) => {
            setIsCertificationModalOpen(open);
            if (!open) setInitialCertificationData(null);
          }}
          initialData={initialCertificationData}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}
    </DashboardLayout>
  );
};

export default OwnerEstablishments;
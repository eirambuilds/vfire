import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, AlertCircle, Eye, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RegistrationModal } from './RegistrationModal';
import { EstablishmentDetailsDialog } from '../shared/establishments/EstablishmentDetailsDialog';
import { Establishment } from '@/types/inspection';
import { useToast } from '@/hooks/use-toast';
import { CancelConfirmationDialog } from '@/components/ui/dialogs/CancelConfirmationDialog';
import { supabase } from "@/integrations/supabase/client";

interface UnregisteredEstablishmentsProps {
  refreshKey?: number;
  onAddEstablishment?: (newEstablishment: Establishment) => void;
  getOwnerName: (owner_id: string) => string;
}

export function UnregisteredEstablishments({ 
  refreshKey, 
  onAddEstablishment, 
  getOwnerName 
}: UnregisteredEstablishmentsProps) {
  const { toast } = useToast();
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [viewDetailsEstablishment, setViewDetailsEstablishment] = useState<Establishment | null>(null);
  const [establishmentToDelete, setEstablishmentToDelete] = useState<Establishment | null>(null);
  const [unregisteredEstablishments, setUnregisteredEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('User not authenticated. Please log in.');
        }
        const userId = user.id;

        const { data, error } = await supabase
          .from('establishments')
          .select(`
            id,
            name,
            dti_number,
            date_registered,
            owner_id,
            type,
            address,
            barangay,
            city,
            province,
            region,
            latitude,
            longitude,
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
            rep_landline
          `)
          .eq('status', 'unregistered')
          .eq('owner_id', userId);

        if (error) throw error;

        const mappedData = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          dti_number: item.dti_number,
          date_registered: item.date_registered,
          owner_id: item.owner_id,
          type: item.type,
          address: item.address,
          barangay: item.barangay,
          city: item.city,
          province: item.province,
          region: item.region,
          latitude: item.latitude,
          longitude: item.longitude,
          occupancy: item.occupancy,
          storeys: item.storeys,
          floor_area: item.floor_area,
          occupants: item.occupants,
          owner_first_name: item.owner_first_name,
          owner_last_name: item.owner_last_name,
          owner_middle_name: item.owner_middle_name,
          owner_suffix: item.owner_suffix,
          owner_email: item.owner_email,
          owner_mobile: item.owner_mobile,
          owner_landline: item.owner_landline,
          rep_first_name: item.rep_first_name,
          rep_last_name: item.rep_last_name,
          rep_middle_name: item.rep_middle_name,
          rep_suffix: item.rep_suffix,
          rep_email: item.rep_email,
          rep_mobile: item.rep_mobile,
          rep_landline: item.rep_landline,
        }));

        setUnregisteredEstablishments(mappedData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch establishments');
        toast({
          title: "Error",
          description: "Failed to load your establishments. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishments();
  }, [refreshKey, toast]);

  const handleAddEstablishment = (newEstablishment: Establishment) => {
    setUnregisteredEstablishments(prev => [...prev, newEstablishment]);
    if (onAddEstablishment) onAddEstablishment(newEstablishment);
  };

  const handleRegistrationSuccess = async (establishment: Establishment) => {
    try {
      // Remove from unregistered list since status is now 'registered'
      setUnregisteredEstablishments(prev => 
        prev.filter(e => e.id !== establishment.id)
      );
      
      toast({
        title: "Registration Successful",
        description: "The establishment is now pre-registered.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update UI.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEstablishment = (establishment: Establishment) => {
    setEstablishmentToDelete(establishment);
  };

  const confirmDeleteEstablishment = async () => {
    if (!establishmentToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .delete()
        .eq('id', establishmentToDelete.id);
        
      if (error) throw error;

      setUnregisteredEstablishments(prev => 
        prev.filter(e => e.id !== establishmentToDelete.id)
      );
      
      toast({
        title: "Establishment Deleted",
        description: "The establishment has been successfully deleted.",
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete establishment.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setEstablishmentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-gray-600">Loading your unregistered establishments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-500 font-medium">Error loading establishments</p>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-amber-100 border border-amber-300 rounded-lg w-fit">
        <AlertCircle className="h-6 w-6 text-amber-600" />
        <span className="text-base font-medium text-amber-800">
          Establishments must register before applying for certifications.
        </span>
      </div>

      {unregisteredEstablishments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No unregistered establishments</h3>
          <p className="text-gray-500 mt-1">You currently have no establishments in unregistered status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {unregisteredEstablishments.map((establishment) => (
            <Card key={establishment.id} className="relative overflow-hidden p-4">
              <Badge 
                variant="outline" 
                className="absolute top-4 right-4 bg-amber-100 text-amber-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
              >
                Unregistered
              </Badge>

              <CardHeader className="pb-4 mt-1">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  {establishment.name}
                </CardTitle>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">DTI Number:</span> {establishment.dti_number}
                </p>
              </CardHeader>

              <CardContent>
                <div className="mt-3 space-y-3">
                  <Button 
                    variant="default" 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setSelectedEstablishment(establishment)}
                  >
                    Register Establishment
                  </Button>

                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDeleteEstablishment(establishment)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedEstablishment && (
        <RegistrationModal
          isOpen={!!selectedEstablishment}
          onClose={() => setSelectedEstablishment(null)}
          establishment={selectedEstablishment}
          onRegistrationSuccess={() => handleRegistrationSuccess(selectedEstablishment)}
        />
      )}

      
      {viewDetailsEstablishment && (
        <EstablishmentDetailsDialog
          establishment={viewDetailsEstablishment}
          open={!!viewDetailsEstablishment}
          onOpenChange={(open) => {
            if (!open) setViewDetailsEstablishment(null);
          }}
          getOwnerName={getOwnerName}
        />
      )}
      
      <CancelConfirmationDialog
        open={!!establishmentToDelete}
        onOpenChange={(open) => {
          if (!open) setEstablishmentToDelete(null);
        }}
        onConfirm={confirmDeleteEstablishment}
        title="Delete Establishment"
        description="Are you sure you want to delete this establishment? This action cannot be undone."
        cancelText="No, keep it"
        confirmText={isDeleting ? "Deleting..." : "Yes, delete establishment"}
        confirmButtonProps={{ disabled: isDeleting }}
      />
    </div>
  );
}
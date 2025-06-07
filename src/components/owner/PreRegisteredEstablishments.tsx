import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Eye, Trash2, Loader2, AlertCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Establishment } from '@/types/inspection';
import { EstablishmentDetailsDialog } from '../shared/establishments/EstablishmentDetailsDialog';
import { supabase } from "@/integrations/supabase/client";
import { RegistrationModal } from './RegistrationModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PreRegisteredEstablishmentsProps {
  getOwnerName: (owner_id: string) => string;
}

export function PreRegisteredEstablishments({ getOwnerName }: PreRegisteredEstablishmentsProps) {
  const { toast } = useToast();
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [establishmentToDelete, setEstablishmentToDelete] = useState<Establishment | null>(null);
  const [establishmentToEdit, setEstablishmentToEdit] = useState<Establishment | null>(null);
  const [preRegisteredEstablishments, setPreRegisteredEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error(authError?.message || 'User not authenticated');
        }

        const userId = user.id;
        const { data, error } = await supabase
          .from('establishments')
          .select('*')
          .eq('status', 'pre_registered')
          .eq('owner_id', userId);

        if (error) throw error;

        setPreRegisteredEstablishments(
          (data || []).map((establishment: any) => ({
            ...establishment,
            dti_number: establishment.dti_number,
            date_registered: establishment.date_registered,
            owner_id: establishment.owner_id,
            floor_area: establishment.floor_area?.toString(),
            storeys: establishment.storeys?.toString(),
            occupants: establishment.occupants?.toString(),
            owner_first_name: establishment.owner_first_name,
            owner_last_name: establishment.owner_last_name,
            owner_middle_name: establishment.owner_middle_name,
            owner_suffix: establishment.owner_suffix,
            owner_email: establishment.owner_email,
            owner_mobile: establishment.owner_mobile,
            owner_landline: establishment.owner_landline,
            rep_first_name: establishment.rep_first_name,
            rep_last_name: establishment.rep_last_name,
            rep_middle_name: establishment.rep_middle_name,
            rep_suffix: establishment.rep_suffix,
            rep_email: establishment.rep_email,
            rep_mobile: establishment.rep_mobile,
            rep_landline: establishment.rep_landline,
          }))
        );
      } catch (err: any) {
        setError(err.message || 'Failed to fetch pre-registered establishments');
        toast({
          title: "Error",
          description: "Failed to load pre-registered establishments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishments();
  }, [toast]);

  const handleDeleteRegistration = (establishment: Establishment) => {
    setEstablishmentToDelete(establishment);
  };

  const confirmDeleteRegistration = async () => {
    if (!establishmentToDelete) return;

    try {
      const { error } = await supabase
        .from('establishments')
        .delete()
        .eq('id', establishmentToDelete.id);

      if (error) throw error;

      setPreRegisteredEstablishments(prev =>
        prev.filter(e => e.id !== establishmentToDelete.id)
      );

      toast({
        title: "Registration Deleted",
        description: "The establishment registration has been permanently deleted.",
      });
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete registration.",
        variant: "destructive",
      });
    } finally {
      setEstablishmentToDelete(null);
    }
  };

  const handleViewDetails = (establishment: Establishment) => {
    setSelectedEstablishment(establishment);
  };

  const handleEditEstablishment = (establishment: Establishment) => {
    setEstablishmentToEdit(establishment);
  };

  const handleRegistrationSuccess = (updatedEstablishment?: Establishment) => {
    if (updatedEstablishment) {
      setPreRegisteredEstablishments(prev =>
        prev.map(e =>
          e.id === updatedEstablishment.id
            ? {
                ...e,
                ...updatedEstablishment,
                dti_number: updatedEstablishment.dti_number,
                date_registered: updatedEstablishment.date_registered,
                owner_id: updatedEstablishment.owner_id,
                floor_area: updatedEstablishment.floor_area?.toString(),
                storeys: updatedEstablishment.storeys?.toString(),
                occupants: updatedEstablishment.occupants?.toString(),
                owner_first_name: updatedEstablishment.owner_first_name,
                owner_last_name: updatedEstablishment.owner_last_name,
                owner_middle_name: updatedEstablishment.owner_middle_name,
                owner_suffix: updatedEstablishment.owner_suffix,
                owner_email: updatedEstablishment.owner_email,
                owner_mobile: updatedEstablishment.owner_mobile,
                owner_landline: updatedEstablishment.owner_landline,
                rep_first_name: updatedEstablishment.rep_first_name,
                rep_last_name: updatedEstablishment.rep_last_name,
                rep_middle_name: updatedEstablishment.rep_middle_name,
                rep_suffix: updatedEstablishment.rep_suffix,
                rep_email: updatedEstablishment.rep_email,
                rep_mobile: updatedEstablishment.rep_mobile,
                rep_landline: updatedEstablishment.rep_landline,
              }
            : e
        )
      );
    }
    setEstablishmentToEdit(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-gray-600">Loading your pre-registered establishments...</span>
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

  if (preRegisteredEstablishments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No pre-registered establishments</h3>
        <p className="text-gray-500 mt-1">You currently have no establishments in pre-registered status.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-amber-100 border border-amber-300 rounded-lg w-fit">
        <AlertCircle className="h-6 w-6 text-amber-600" />
        <span className="text-base font-medium text-amber-800">
          All pre-registered establishments must wait for administrator approval.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {preRegisteredEstablishments.map((establishment) => (
          <Card key={establishment.id} className="relative overflow-hidden p-4">
            <Badge
              variant="outline"
              className="absolute top-4 right-4 bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium rounded-md shadow-sm"
            >
              Pre-registered
            </Badge>

            <CardHeader className="pb-4 mt-2">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
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
              <p className="text-sm text-gray-700">
                <span className="font-medium">Address: </span> {establishment.address || 'N/A'}
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  variant="default"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleEditEstablishment(establishment)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                    onClick={() => handleViewDetails(establishment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDeleteRegistration(establishment)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <EstablishmentDetailsDialog
          establishment={selectedEstablishment}
          open={!!selectedEstablishment}
          onOpenChange={(open) => {
            if (!open) setSelectedEstablishment(null);
          }}
          getOwnerName={getOwnerName}
        />

        <Dialog
          open={!!establishmentToDelete}
          onOpenChange={(open) => {
            if (!open) setEstablishmentToDelete(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Registration</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this registration? This action cannot be undone, and the establishment will be permanently removed from the system.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEstablishmentToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRegistration}
              >
                Yes, delete registration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <RegistrationModal
          isOpen={!!establishmentToEdit}
          onClose={() => setEstablishmentToEdit(null)}
          establishment={establishmentToEdit ? {
            ...establishmentToEdit,
            storeys: parseInt(establishmentToEdit.storeys || '0'),
            floor_area: parseFloat(establishmentToEdit.floor_area || '0'),
            occupants: parseInt(establishmentToEdit.occupants || '0'),
          } : undefined}
          onRegistrationSuccess={() => handleRegistrationSuccess(establishmentToEdit)}
        />
      </div>
    </div>
  );
}

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, ClipboardList, Phone, Mail, Info } from 'lucide-react';

interface Establishment {
  id: string;
  name: string;
  address: string;
  type: string;
  status: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  phone?: string;
  email?: string;
  lastInspection?: string;
  dti_number?: string;
  date_registered?: string;
}

interface EstablishmentDetailsDialogProps {
  establishment: Establishment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstablishmentDetailsDialog({ 
  establishment, 
  open, 
  onOpenChange 
}: EstablishmentDetailsDialogProps) {
  if (!establishment) return null;

  // Helper function for status badge
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      registered: "bg-green-100 text-green-800",
      pre_registered: "bg-orange-100 text-orange-800",
      unregistered: "bg-gray-100 text-gray-800",
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    } as Record<string, string>;

    return (
      <Badge variant="outline" className={statusClasses[status] || "bg-gray-100 text-gray-800"}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            {establishment.name}
          </DialogTitle>
          <DialogDescription>
            Map details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge(establishment.status)}
          </div>

          {/* Type */}
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Type</p>
              <p className="text-sm text-gray-600">{establishment.type}</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-gray-600">{establishment.address}</p>
            </div>
          </div>

          {/* Coordinates */}
          {establishment.latitude !== undefined && establishment.longitude !== undefined && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Coordinates</p>
                <p className="text-sm text-gray-600">
                  {establishment.latitude.toFixed(6)}, {establishment.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* DTI Number */}
          {establishment.dti_number && (
            <div className="flex items-start gap-3">
              <ClipboardList className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">DTI Number</p>
                <p className="text-sm text-gray-600">{establishment.dti_number}</p>
              </div>
            </div>
          )}

          {/* Date Registered */}
          {establishment.date_registered && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date Registered</p>
                <p className="text-sm text-gray-600">
                  {new Date(establishment.date_registered).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {establishment.contactPerson && (
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Contact Person</p>
                <p className="text-sm text-gray-600">{establishment.contactPerson}</p>
              </div>
            </div>
          )}

          {establishment.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-gray-600">{establishment.phone}</p>
              </div>
            </div>
          )}

          {establishment.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{establishment.email}</p>
              </div>
            </div>
          )}

          {/* Last Inspection */}
          {establishment.lastInspection && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Last Inspection</p>
                <p className="text-sm text-gray-600">{establishment.lastInspection}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
import { Application } from '@/types/inspection';
import { FileText, Calendar, Building2, Hash, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApplicationDetailsDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailsDialog({ 
  application, 
  open, 
  onOpenChange 
}: ApplicationDetailsDialogProps) {
  if (!application) return null;

  // Helper function for status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
      case 'inspected':
        return <Badge className="bg-purple-500 text-white">Inspected</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Format the application type
  const getApplicationTypeName = (type: string) => {
    switch (type) {
      case 'FSEC':
        return 'Fire Safety Evaluation Clearance';
      case 'FSIC-Occupancy':
        return 'Fire Safety Inspection Certificate (Occupancy)';
      case 'FSIC-Business':
        return 'Fire Safety Inspection Certificate (Business)';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
      </DialogContent>
    </Dialog>
  );
}

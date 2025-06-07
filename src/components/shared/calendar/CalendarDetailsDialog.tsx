import React from 'react';
import { InspectionDetailsDialog } from '@/components/shared/inspections/InspectionDetailsDialog';
import { Inspection } from '@/types/inspection';

interface InspectionEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  establishment_name: string;
  inspector: string | null;
  status: string;
}

interface CalendarDetailsDialogProps {
  event: InspectionEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CalendarDetailsDialog: React.FC<CalendarDetailsDialogProps> = ({
  event,
  open,
  onOpenChange,
}) => {
  // Convert InspectionEvent to Inspection type
  const inspection: Inspection | null = event ? {
    id: event.id,
    type: event.type,
    status: event.status,
    establishment_name: event.establishment_name,
    establishmentType: null, // Not provided in InspectionEvent; will be fetched by InspectionDetailsDialog
    address: null, // Will be fetched by InspectionDetailsDialog
    inspector: event.inspector,
    inspectorId: null, // Not provided; will be fetched if needed
    updated_at: null, // Not provided; will be fetched if needed
    rejection_reasons: [], // Default to empty; will be fetched if needed
    establishment_id: null, // Not provided; will be fetched if needed
  } : null;

  return (
    <InspectionDetailsDialog
      inspection={inspection}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
};
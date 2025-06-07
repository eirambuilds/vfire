import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Inspection } from '@/types/inspection';
import { X, Loader2, Plus, Trash2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RejectInspectionDialogProps {
  inspection: Inspection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (inspectionId: string, reason: string) => void;
  contentClassName?: string;
}

const REJECTION_REASONS = [
  "Presence of major fire hazards within the premises",
  "Improper storage of flammable or hazardous materials",
  "Non-functional fire suppression or alarm systems",
  "Blocked or inaccessible fire exits and escape routes",
  "Lack of proper fire extinguishers or outdated equipment",
  "Absence of trained fire safety personnel",
  "Poor electrical system maintenance",
  "Structural hazards compromising fire safety",
  "No posted fire safety signage or emergency instructions",
  "Obstruction of firefighting access (e.g., blocked hydrants or entrances)",
  "Others",
];

export function RejectInspectionDialog({
  inspection,
  open,
  onOpenChange,
  onReject,
  contentClassName,
}: RejectInspectionDialogProps) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReason, setNewReason] = useState<string>("");

  const handleAddReason = () => {
    if (!newReason) {
      toast({
        title: "Error",
        description: "Please select a reason to add",
        variant: "destructive",
      });
      return;
    }
    if (reasons.includes(newReason)) {
      toast({
        title: "Error",
        description: "This reason has already been added",
        variant: "destructive",
      });
      return;
    }
    setReasons([...reasons, newReason]);
    setNewReason("");
  };

  const handleRemoveReason = (reasonToRemove: string) => {
    setReasons(reasons.filter((r) => r !== reasonToRemove));
  };

  const handleSubmit = async () => {
    if (reasons.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one rejection reason",
        variant: "destructive",
      });
      return;
    }
    if (!inspection) return;

    setIsSubmitting(true);

    try {
      const fullReason = reasons.join("; ") + (additionalNotes ? ` - Additional Notes: ${additionalNotes}` : "");
      const currentTimestamp = new Date().toISOString(); // Current time in ISO format

      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'rejected', // Changed to 'rejected' instead of 'pending'
          rejection_reason: fullReason,
          rejection_notes: additionalNotes || null,
          updated_at: currentTimestamp, // Explicitly set the rejection time
        })
        .eq('id', inspection.id);

      if (error) throw error;

      onReject(inspection.id, fullReason);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to reject inspection.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReasons([]);
    setAdditionalNotes("");
    setNewReason("");
  };

  if (!inspection) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className={`sm:max-w-[500px] md:max-w-[600px] ${contentClassName || ''}`}>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Inspection
          </DialogTitle>
          <DialogDescription>
            Provide details about the rejection for {inspection.establishment_name || 'this establishment'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reasons</label>
            <div className="flex items-center gap-2">
              <Select value={newReason} onValueChange={setNewReason} disabled={isSubmitting}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reasonOption) => (
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddReason}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {reasons.length > 0 && (
              <div className="mt-2 space-y-2">
                {reasons.map((selectedReason) => (
                  <div key={selectedReason} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                    <span className="text-sm">{selectedReason}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveReason(selectedReason)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes</label>
            <Textarea
              placeholder="Provide more details about the rejection..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              These notes will be sent to the establishment owner.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reasons.length === 0 || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Reject Inspection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// src/components/admin/applications/RejectApplicationDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Application } from '@/types/application';

interface RejectApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onReject: (applicationId: string, reasons: string[], notes: string) => void;
  contentClassName?: string;
}

const REJECTION_REASONS = [
  "Incomplete establishment information",
  "Inaccurate establishment information",
  "Failure to meet minimum fire safety requirements",
  "Absence of fire safety plan or emergency evacuation procedure",
  "Incomplete or missing supporting documents",
  "Outstanding penalties or unresolved violations",
  "Falsified or tampered documentation",
  "Ownership details do not match submitted documentation",
  "Multiple applications detected",
  "Others",
];

export const RejectApplicationDialog: React.FC<RejectApplicationDialogProps> = ({
  open,
  onOpenChange,
  application,
  onReject,
  contentClassName,
}) => {
  const [reasons, setReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDialogTitle = (type: string | undefined) => {
    switch (type) {
      case 'FSEC':
        return 'Reject FSEC Application';
      case 'FSIC-Occupancy':
        return 'Reject FSIC Application';
      case 'FSIC-Business':
        return 'Reject FSIC Application';
      default:
        return 'Reject Application';
    }
  };

  const handleAddReason = () => {
    if (newReason && !reasons.includes(newReason)) {
      setReasons([...reasons, newReason]);
      setNewReason('');
    }
  };

  const handleRemoveReason = (reasonToRemove: string) => {
    setReasons(reasons.filter((reason) => reason !== reasonToRemove));
  };

  const handleSubmit = async () => {
    if (application) {
      setIsSubmitting(true);
      try {
        await onReject(application.id, reasons, additionalNotes);
        onOpenChange(false);
        setReasons([]);
        setAdditionalNotes('');
      } catch (error) {
        console.error('Application rejection failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] md:max-w-[600px]", contentClassName)}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-orange-600" />
              {getDialogTitle(application?.type)}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Reject the {application?.type || 'application'} for{" "}
              <span className="font-semibold text-orange-600">{application?.establishments?.name}</span>.
              Please provide rejection reasons and additional notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-700">Rejection Reasons</Label>
              <div className="flex items-center gap-2">
                <Select value={newReason} onValueChange={setNewReason} disabled={isSubmitting}>
                  <SelectTrigger className="flex-1 border-orange-300 focus:ring-orange-500">
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
                  disabled={isSubmitting || !newReason}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {reasons.length > 0 && (
                <div className="mt-2 space-y-2">
                  {reasons.map((selectedReason) => (
                    <div 
                      key={selectedReason}
                      className="flex items-center justify-between bg-orange-50 p-2 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{selectedReason}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReason(selectedReason)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Additional Notes</Label>
              <Textarea
                id="notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Enter additional details about the rejection..."
                className="mt-1 border-orange-300 focus:ring-orange-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reasons.length || isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
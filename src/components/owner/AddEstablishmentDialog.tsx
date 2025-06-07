import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddEstablishmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEstablishmentAdded?: () => void;
}

export function AddEstablishmentDialog({ 
  open, 
  onOpenChange, 
  onEstablishmentAdded 
}: AddEstablishmentDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [dti_number, setDtiNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; dti_number?: string }>({});

  const validateInputs = async () => {
    const newErrors: { name?: string; dti_number?: string } = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Establishment name is required';
    } else {
      const { data: existingNames, error: nameError } = await supabase
        .from('establishments')
        .select('name')
        .eq('name', name.trim())
        .limit(1);

      if (nameError) {
        throw new Error('Failed to validate establishment name');
      }
      if (existingNames?.length > 0) {
        newErrors.name = 'This establishment name already exists';
      }
    }

    // Validate DTI number
    if (!dti_number) {
      newErrors.dti_number = 'DTI number is required';
    } else if (!/^\d{6}$/.test(dti_number)) {
      newErrors.dti_number = 'DTI number must be exactly 6 digits';
    } else {
      const { data: existingDti, error: dtiError } = await supabase
        .from('establishments')
        .select('dti_number')
        .eq('dti_number', dti_number)
        .limit(1);

      if (dtiError) {
        throw new Error('Failed to validate DTI number');
      }
      if (existingDti?.length > 0) {
        newErrors.dti_number = 'This DTI number is already registered';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate inputs
      const isValid = await validateInputs();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please correct the errors in the form.",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add an establishment');
      }

      // Insert the new establishment
      const { data, error } = await supabase
        .from('establishments')
        .insert({
          name: name.trim(),
          dti_number: dti_number,
          status: 'unregistered',
          owner_id: user.id,
          address: '', // Provide a default or user-inputted address
          type: '', // Provide a default or user-inputted type
        })
        .select();

      if (error) throw error;

      toast({
        title: "Establishment Added",
        description: "The establishment has been added successfully.",
      });

      // Reset form
      setName('');
      setDtiNumber('');
      setErrors({});

      // Close dialog
      onOpenChange(false);

      // Trigger callback if provided
      if (onEstablishmentAdded) {
        onEstablishmentAdded();
      }
    } catch (error: any) {
      console.error('Error adding establishment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add establishment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Establishment</DialogTitle>
          <DialogDescription>
            Enter the details of your new establishment. Only the name and DTI number are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Building/Facility/Structure/Business/Establishment Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              required
              disabled={isSubmitting}
              placeholder="e.g., ABC Enterprises"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dti_number">DTI Certificate No <span className="text-red-500">*</span></Label>
            <Input
              id="dti_number"
              value={dti_number}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setDtiNumber(value);
                setErrors(prev => ({ ...prev, dti_number: undefined }));
              }}
              required
              disabled={isSubmitting}
              maxLength={6}
              inputMode="numeric"
              placeholder="123456"
            />
            {errors.dti_number && (
              <p className="text-red-500 text-sm">{errors.dti_number}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Establishment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
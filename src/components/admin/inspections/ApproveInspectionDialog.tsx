import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Inspection } from '@/types/inspection';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';

interface ApproveInspectionDialogProps {
  inspection: Inspection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (inspectionId: string, certificateUrl: string) => void;
  contentClassName?: string;
}

export function ApproveInspectionDialog({
  inspection,
  open,
  onOpenChange,
  onApprove,
  contentClassName,
}: ApproveInspectionDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const sanitizeFileName = (id: string) => id.replace(/[^a-zA-Z0-9-_]/g, '');

  const loadImage = async (url: string, fallbackUrl: string): Promise<HTMLImageElement> => {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.src = url;
        image.crossOrigin = 'Anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      });
      return img;
    } catch {
      const fallbackImg = new Image();
      fallbackImg.src = fallbackUrl;
      return new Promise((resolve, reject) => {
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => reject(new Error(`Failed to load fallback image: ${fallbackUrl}`));
      });
    }
  };

  const generateCertificatePDF = async (): Promise<string> => {
  if (!inspection || !inspection.id) {
    console.error('Invalid inspection data:', inspection);
    throw new Error('No inspection provided');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load the certificate background image
  const certificateImageUrl = '/public/certificates/FSIC.png'; // Adjust if in Supabase

  try {
    const img = await loadImage(certificateImageUrl, certificateImageUrl);
    doc.addImage(img, 'PNG', 0, 0, 210, 297); // A4 dimensions: 210mm x 297mm
  } catch (error) {
    console.error('Error loading certificate image:', error);
    throw new Error('Failed to load certificate background image');
  }

  // Fetch chief and fire marshal names from Supabase (or use placeholders)
  let chiefFSES = 'Juan Dela Cruz';
  let cityFireMarshal = 'Maria Santos';
  try {
    const { data: chiefData, error: chiefError } = await (supabase as any)
      .from('personnel')
      .select('name')
      .eq('role', 'chief_fses')
      .single();
    const { data: marshalData, error: marshalError } = await (supabase as any)
      .from('personnel')
      .select('name')
      .eq('role', 'city_fire_marshal')
      .single();
    if (!chiefError && chiefData && typeof chiefData.name === 'string') {
      chiefFSES = chiefData.name;
    } else {
      chiefFSES = 'Juan Dela Cruz';
    }
    if (!marshalError && marshalData && typeof marshalData.name === 'string') {
      cityFireMarshal = marshalData.name;
    } else {
      cityFireMarshal = 'Maria Santos';
    }
  } catch (error) {
    console.error('Error fetching personnel:', error);
  }

  // Define certificate data
  const certificateNumber = `FSIC-${sanitizeFileName(inspection.id)}`;
  const issueDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const establishmentName = inspection.establishment_name || 'N/A';
  const address = inspection.address || 'N/A';
  const ownerName = inspection.owner_name || 'N/A';

  // Set font styles
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Place text at exact coordinates
  const wrappedEstName = doc.splitTextToSize(establishmentName, 150); // Wrap to fit blank
  const wrappedAddress = doc.splitTextToSize(address, 150); // Wrap to fit blank
  doc.text(certificateNumber, 60, 74); // FSIC Number
  doc.text(issueDate, 155, 74); // Date
  
    doc.text('O', 60.6, 98); // Checkmark for fsic-occupancy
    doc.text('O', 60.6, 103); // Checkmark for fsic-occupancy


  doc.text(wrappedEstName, 30, 135); // Establishment Name
  doc.text(ownerName, 65, 144); // Owner/Representative Name
  doc.text(wrappedAddress, 30, 153); // Address
  doc.text(chiefFSES, 135, 219); // Chief, FSES
  doc.text(cityFireMarshal, 135, 243); // City/Municipal Fire Marshal

  // Generate and upload PDF
  const pdfBlob = doc.output('blob');
  const fileName = `FSIC-${sanitizeFileName(inspection.id)}-${Date.now()}.pdf`;
  const filePath = `inspections/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('certifications')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('certifications')
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    console.error('Failed to generate public URL');
    throw new Error('Failed to generate public URL');
  }

  return urlData.publicUrl;
};

  const handleSubmit = async () => {
    if (!inspection) {
      toast({
        title: "Error",
        description: "No inspection selected",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const certificateUrl = await generateCertificatePDF();
      onApprove(inspection.id, certificateUrl);

      toast({
        title: "Success",
        description: "Inspection approved and certification generated",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate certification",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!inspection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="dialog-title" aria-describedby="dialog-description">
      <DialogContent 
        className={cn(`sm:max-w-[425px] md:max-w-[425px] ${contentClassName} fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`)}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Issue FSIC Certification
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Issue an FSIC (Fire Safety Inspection Certificate) for <span className="font-semibold text-orange-600">{inspection.establishment_name || 'Unnamed Establishment'}</span>. A certificate will be automatically generated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Certificate Details</h4>
            <div className="text-sm text-gray-600">
              <p>Certificate Type: Fire Safety Inspection Certificate</p>
              <p>Establishment Name: {inspection.establishment_name || 'N/A'}</p>
              <p>DTI Number: {inspection.dti_number || 'N/A'}</p>
              <p>Owner: {inspection.owner_name || 'N/A'}</p>
              <p>Issue Date: {new Date().toLocaleDateString()}</p>
              <p>Certificate Number: FSIC-{inspection.id}</p>
              <p>Address: {inspection.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Issue Certificate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
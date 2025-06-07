import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Application } from '@/types/application';
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface ApproveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onApprove: (applicationId: string, certificateUrl?: string) => void;
  contentClassName?: string;
}

export const ApproveApplicationDialog: React.FC<ApproveApplicationDialogProps> = ({
  open,
  onOpenChange,
  application,
  onApprove,
  contentClassName,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getDialogTitle = (type: string | undefined) => {
    switch (type) {
      case 'FSEC':
        return 'Issue FSEC Certification';
      case 'FSIC-Occupancy':
        return 'Approve FSIC Application';
      case 'FSIC-Business':
        return 'Approve FSIC Application';
      default:
        return 'Approve Application';
    }
  };

  const isFSEC = application?.type === 'FSEC';

  const generateCertificatePDF = async (): Promise<string> => {
    if (!application) throw new Error('No application provided');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font to Helvetica for consistency
    doc.setFont('Helvetica');

    // Add thick border (2mm thick) around main content
    doc.setLineWidth(2);
    doc.rect(10, 10, 190, 277, 'S'); // Border: 10mm from edges, 190mm wide, 277mm tall

    // Add logos (on a lower layer before text)
    const logoLeftUrl = '/public/logo-left.png';
    const logoRightUrl = '/public/logo-right.png';

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      });
    };

    try {
      // Load and add left logo
      const logoLeft = await loadImage(logoLeftUrl);
      doc.addImage(logoLeft, 'PNG', 15, 20, 30, 30); // Left logo: 15mm from left, 15mm from top, 30mm x 30mm

      // Load and add right logo
      const logoRight = await loadImage(logoRightUrl);
      doc.addImage(logoRight, 'PNG', 165, 20, 30, 30); // Right logo: 165mm from left, 15mm from top, 30mm x 30mm
    } catch (error) {
      console.error('Error loading logos:', error);
      // Proceed without logos if they fail to load
    }

    // Header Section
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text('Republic of the Philippines', 105, 20, { align: 'center' });
    doc.setFont('Helvetica', 'bold');
    doc.text('Department of the Interior and Local Government', 105, 26, { align: 'center' });
    doc.text('BUREAU OF FIRE PROTECTION', 105, 32, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.text('National Capital Region', 105, 38, { align: 'center' });
    doc.text('FIRE DISTRICT II', 105, 44, { align: 'center' });
    doc.text('Valenzuela City Fire Station', 105, 50, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Valenzuela City Central Fire Station Alert Center Cmpd., McArthur Highway, Malinta', 105, 60, { align: 'center' });
    doc.text('Valenzuela City', 105, 65, { align: 'center' });
    doc.text('8292-3519 / 8292-5705 / fes_vcfs@yahoo.com', 105, 70, { align: 'center' });

    // Reset color for subsequent text
    doc.setTextColor(0, 0, 0); // Black

    // Certificate Number and Date
    const certificateNumber = `FSEC-${application.id}`;
    const issueDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0); // Red
    doc.setFont('Helvetica', 'bold');
    doc.text(`FSEC NO. ${certificateNumber}`, 20, 85);
    doc.setTextColor(0, 0, 0); // Red
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${issueDate}`, 160, 85);
    
    // Certificate Title (Dark Blue)
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 139); // Dark Blue
    doc.text('FIRE SAFETY EVALUATION CLEARANCE', 105, 95, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('TO WHOM IT MAY CONCERN:', 20, 105, { align: 'left' });

    // Main Body
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    const bodyText = [
      '         By virtue of the provisions of RA 9514 otherwise known as the Fire Code of the Philippines of 2008, the application for FIRE SAFETY EVALUATION CLEARANCE of',
      `${application.establishments.name}`,
      `to be constructed / renovated / altered / modified / change of occupancy located at`,
      `${application.establishments.address}`,
      `owned by ${application.ownerName} is hereby GRANTED after`,
      'the building plans and other documents conform to the fire safety and life safety requirements of the Fire Code of the Philippines of 2008 and its Revised Implementing Rules and Regulations and that the recommendations in the Fire Safety Checklist (FSC) will be adopted.',
      '',
      '         Violation of Fire Code provisions shall cause this certificate null and void after appropriate proceeding and shall hold the owner liable to the penalties provided for by the said Fire Code.',
    ];
    doc.text(bodyText, 20, 110, { maxWidth: 170, align: 'justify' });

    // Fire Code Fees
    doc.setFont('Helvetica', 'bold');
    doc.text('Fire Code Fees:', 20, 165);
    doc.setFont('Helvetica', 'normal'); // Reset font to normal
    doc.text('Amount Paid: ', 20, 170);
    doc.text('O.R. Number: ', 20, 175);
    doc.text('Date: ', 20, 180);

    // Signatures
    doc.setFont('Helvetica', 'bold');
    doc.text('RECOMMEND APPROVAL:', 20, 190);
    doc.setFont('Helvetica', 'normal'); // Reset font to normal
    doc.text('___________________________', 20, 200);
    doc.text('CHIEF, FSES', 20, 205);

    doc.setFont('Helvetica', 'bold'); // Set font to bold for APPROVED
    doc.text('APPROVED:', 120, 190);
    doc.setFont('Helvetica', 'normal'); // Reset font to normal
    doc.text('___________________________', 120, 200);
    doc.text('CITY/MUNICIPAL FIRE MARSHAL', 120, 205);

    // Note Section (Bold Black)
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black
    doc.text('NOTE: "This Clearance is accompanied by Fire Safety Checklist on Building Plans and does not take the place of any license required by law and is not transferable. Any change or alteration in the design and specification during construction shall require a new clearance"', 20, 220, { maxWidth: 170, align: 'justify' });

    // Warning in Filipino (Bold Red)
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255, 0, 0); // Red
    doc.text('PAALALA: "MAHIGPIT NA IPINAGBABAWAL NG PAMUNUAN NG BUREAU OF FIRE PROTECTION SA MGA KAWANI NITO ANG MAGBENTA O MAGREKOMENDA NG ANUMANG BRAND NG FIRE EXTINGUISHER"', 20, 240, { maxWidth: 170, align: 'justify' });

    // Footer (Bold Dark Blue)
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 139); // Dark Blue
    doc.text('"FIRE SAFETY IS OUR MAIN CONCERN"', 105, 255, { align: 'center' });

    // BFP Code (Outside Border, Left-Bottom)
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Reset to Black
    doc.text('BFP-QSF-FSED-003 Rev. 03 (03.06.20)', 10, 292, { align: 'left' });

    // Generate PDF and upload to Supabase
    const pdfBlob = doc.output('blob');
    const fileName = `FSEC-${application.id}-${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('certifications')
      .upload(`fsec/${fileName}`, pdfBlob, {
        contentType: 'application/pdf',
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('certifications')
      .getPublicUrl(`fsec/${fileName}`);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!application) return;

    try {
      setIsGenerating(true);
      let certificateUrl: string | undefined;

      if (isFSEC) {
        certificateUrl = await generateCertificatePDF();
      }

      onApprove(application.id, certificateUrl);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] md:max-w-[600px]", contentClassName)}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              {getDialogTitle(application?.type)}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {isFSEC ? (
                <>Issue an FSEC (Fire Safety Evaluation Clearance) for </>
              ) : (
                <>Approve the {application?.type || 'application'} for </>
              )}
              <span className="font-semibold text-orange-600">{application?.establishments?.name}</span>.
              {isFSEC && " A certificate will be automatically generated."}
            </DialogDescription>
          </DialogHeader>

          {isFSEC && (
            <div className="space-y-2">
              <Label className="text-gray-700">Certificate Details</Label>
              <div className="text-sm text-gray-600">
                <p>Certificate Type: Fire Safety Evaluation Clearance</p>
                <p>Establishment Name: {application?.establishments.name}</p>
                <p>DTI Number: {application?.establishments.dti_number || 'N/A'}</p>
                <p>Owner: {application?.ownerName}</p>
                <p>Issue Date: {new Date().toLocaleDateString()}</p>
                <p>Certificate Number: FSEC-{application?.id}</p>
                <p>Address: {application?.establishments.address}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                isFSEC ? 'Issue Certificate' : 'Approve'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
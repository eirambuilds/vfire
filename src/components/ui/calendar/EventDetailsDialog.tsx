
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
import { Calendar, Clock, MapPin, Building2, User, FileText, AlertCircle, Check, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { EventStatus } from '@/types/inspection';

interface EventDetailsDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ 
  event, 
  open, 
  onOpenChange 
}: EventDetailsDialogProps) {
  if (!event) return null;

  
  // Helper function for status badge
  const getEventTypeBadge = (type: string, status?: EventStatus) => {
    if (type === 'inspection') {
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Inspection</Badge>;
    }
  };

  const getStatusIcon = (type: string, status?: EventStatus) => {
    if (type === 'inspection') {
      switch (status) {
        case 'pending':
          return <Clock className="h-5 w-5 text-amber-500" />;
        case 'scheduled':
          return <Clock className="h-5 w-5 text-blue-500" />;
        case 'inspected':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'approved':
          return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'rejected':
          return <XCircle className="h-5 w-5 text-red-500" />;
        default:
          return <FileText className="h-5 w-5 text-gray-500" />;
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getStatusIcon(event.type, event.status)}
            {event.title}
          </DialogTitle>
          <DialogDescription>
            Event details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Type Badge */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Event Type:</span>
            {getEventTypeBadge(event.type, event.status)}
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Time</p>
              <p className="text-sm text-gray-600">
                {new Date(event.start).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
                {' '} - {' '}
                {new Date(event.end).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-gray-600">
                {new Date(event.start).toLocaleDateString([], { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            </div>
          )}

          {/* Location Info (for inspections) */}
          {event.type === 'inspection' && (
            <>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Establishment</p>
                  <p className="text-sm text-gray-600">{
                    event.title.includes(':') ? 
                    event.title.split(':')[1].trim() : 
                    'Not specified'
                  }</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-gray-600">Valenzuela City (Address details available in the inspection record)</p>
                </div>
              </div>
            </>
          )}

          {/* Status-specific sections */}
          {event.type === 'inspection' && event.status === 'scheduled' && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Preparation Required</h4>
              <p className="text-sm text-amber-700">
                Please ensure all necessary documentation is ready for the inspection 
                and that a representative is available at the establishment during the scheduled time.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="sm:order-first w-full sm:w-auto"
          >
            Close
          </Button>
          {event.type === 'inspection' && (
            <Button 
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
            >
              View Full Inspection Details
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

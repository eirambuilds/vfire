
import React from 'react';
import { Building2, MapPin, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EstablishmentCardProps {
  establishment: {
    id: string;
    name: string;
    address: string;
    status: string;
    type: string;
    latitude?: number;
    longitude?: number;
    contactPerson?: string;
    phone?: string;
    email?: string;
    lastInspection?: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  onZoomClick?: () => void;
  onViewDetailsClick?: () => void;
}

// Badge styling with hover effect
const statusStyles: Record<string, string> = {
  registered:
    'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 hover:opacity-80',
  pre_registered:
    'bg-orange-100 text-orange-800 dark:bg-orange-200 dark:text-orange-900 hover:opacity-80',
  unregistered:
    'bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900 hover:opacity-80',
};

export function EstablishmentCard({ 
  establishment, 
  isSelected = false, 
  onClick,
  onZoomClick,
  onViewDetailsClick
}: EstablishmentCardProps) {
  return (
    <Card 
      className={`mb-4 transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg cursor-pointer hover:text-blue-600 transition-colors">
            {establishment.name}
          </CardTitle>
          <Badge
            variant="outline"
            className={`${statusStyles[establishment.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900'} ${
              isSelected ? 'border-blue-500' : ''
            }`}
          >
            {establishment.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{establishment.type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{establishment.address}</span>
          </div>
          {establishment.latitude !== undefined && establishment.longitude !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                Coordinates: {establishment.latitude.toFixed(6)}, {establishment.longitude.toFixed(6)}
              </span>
            </div>
          )}
          {establishment.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{establishment.phone}</span>
            </div>
          )}
          {establishment.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{establishment.email}</span>
            </div>
          )}
          {establishment.lastInspection && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Last Inspection: {establishment.lastInspection}</span>
            </div>
          )}
          <div className="pt-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetailsClick?.();
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            {isSelected && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card onClick from firing
                  onZoomClick?.(); // Call the onZoomClick handler if provided
                }}
              >
                Zoom to Location
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

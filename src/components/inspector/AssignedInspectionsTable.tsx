
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Inspection {
  id: string;
  establishment_name: string;
  type: 'fsic_occupancy' | 'fsic_business';
  scheduled_date: string | null;
  status: 'scheduled' | 'inspected' | 'approved' | 'rejected' | 'cancelled';
}

interface AssignedInspectionsTableProps {
  inspections: Inspection[];
  onViewDetails?: (inspection: Inspection) => void;
}

export const AssignedInspectionsTable: React.FC<AssignedInspectionsTableProps> = ({ 
  inspections,
  onViewDetails 
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'inspected': return <Badge variant="outline" className="bg-purple-100 text-purple-800">Inspected</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
          Recently Assigned Inspections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Establishment Name</TableHead>
                <TableHead>Application Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{inspection.establishment_name}</TableCell>
                  <TableCell>{inspection.type === 'fsic_occupancy' ? 'FSIC Occupancy' : 'FSIC Business'}</TableCell>
                  <TableCell>
                    {inspection.scheduled_date ? new Date(inspection.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                  </TableCell>
                  <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                  <TableCell>
                    {onViewDetails && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-muted transition-colors duration-200"
                        onClick={() => onViewDetails(inspection)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {inspections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No assigned inspections
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
 
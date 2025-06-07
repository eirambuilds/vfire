import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchIcon, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';

interface ApplicationsFiltersProps {
  searchTerm: string;
  filterStatus: string;
  filterApplicationType: string;
  filterEstablishmentType: string;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string;   // Format: YYYY-MM-DD
  sortOrder: "latest" | "oldest";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onEstablishmentTypeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSortChange: (value: "latest" | "oldest") => void;
}

export const ApplicationsFilters: React.FC<ApplicationsFiltersProps> = ({
  searchTerm,
  filterStatus,
  filterApplicationType,
  filterEstablishmentType,
  startDate,
  endDate,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onEstablishmentTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSortChange,
}) => {
  // Convert string dates to Date objects for DatePicker
  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  // Handle DatePicker changes (convert Date to YYYY-MM-DD string)
  const handleStartDateChange = (date: Date | null) => {
    onStartDateChange(date ? date.toISOString().split('T')[0] : '');
  };

  const handleEndDateChange = (date: Date | null) => {
    onEndDateChange(date ? date.toISOString().split('T')[0] : '');
  };

  // Field styles to match your example
  const fieldStyles = 'w-full border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Status Filter */}
      <Select value={filterStatus} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Application Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {/* Application Type Filter */}
      <Select value={filterApplicationType} onValueChange={onTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Application Types</SelectItem>
          <SelectItem value="FSEC">Fire Safety Evaluation Clearance</SelectItem>
          <SelectItem value="FSIC-Occupancy">FSIC (Occupancy)</SelectItem>
          <SelectItem value="FSIC-Business">FSIC (Business)</SelectItem>
        </SelectContent>
      </Select>

      {/* Establishment Type Filter */}
      <Select value={filterEstablishmentType} onValueChange={onEstablishmentTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by establishment type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Establishment Types</SelectItem>
          {['Commercial' , 'Industrial' , 'Residential'].map((type) => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search Input */}
      <div className="relative col-span-2">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, address, DTI, or owner..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};
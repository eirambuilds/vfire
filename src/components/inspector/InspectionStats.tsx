
import React from 'react';
import { StatCard } from '@/components/ui/cards/StatCard';
import { CalendarIcon, CheckCircle2, Clipboard } from 'lucide-react';

interface InspectionStatsProps {
  stats: {
    scheduledInspections: number;
    inspectedInspections: number;
    totalInspections: number;
  };
}

export const InspectionStats: React.FC<InspectionStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Pending Inspections"
        value={stats.scheduledInspections}
        icon={<CalendarIcon className="h-5 w-5 text-blue-500" />}
        className="hover:shadow-md transition-shadow duration-300"
      />
      <StatCard
        title="Inspected - For review"
        value={stats.inspectedInspections}
        icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
        className="hover:shadow-md transition-shadow duration-300"
      />
      <StatCard
        title="Total Assigned Inspections"
        value={stats.totalInspections}
        icon={<Clipboard className="h-5 w-5 text-primary" />}
        className="hover:shadow-md transition-shadow duration-300"
      />
    </div>
  );
};

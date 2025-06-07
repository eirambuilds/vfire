
import React from 'react';
import { PieChart } from '@/components/ui/charts/PieChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

interface InspectionStatusChartProps {
  data: ChartData[];
}

export const InspectionStatusChart: React.FC<InspectionStatusChartProps> = ({ data }) => {
  return (
    <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Inspection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PieChart data={data} height={280} innerRadius={50} outerRadius={70} />
      </CardContent>
    </Card>
  );
};

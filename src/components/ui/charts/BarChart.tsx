import React, { useState } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
  Legend,
  TooltipProps,
} from 'recharts';
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: any[];
  keys?: string[];
  colors?: string[];
  xAxisDataKey?: string;
  xAxisKey?: string; // Added for backwards compatibility
  yAxisKey?: string | string[]; // Added for backwards compatibility
  barKey?: string | string[]; // Added for backwards compatibility
  stacked?: boolean;
  showGrid?: boolean;
  height?: number;
  className?: string;
  tooltip?: React.FC<TooltipProps<any, any>>;
  barSize?: number;
  showYAxis?: boolean;
  showXAxis?: boolean;
  showLegend?: boolean;
  layout?: 'vertical' | 'horizontal';
  tickFormatter?: (value: number) => string | number; // For integer formatting
  tooltipFormatter?: (value: number) => string | number; // For integer formatting
}

// Custom active bar shape with rounded corners
const RoundedBar = (props) => {
  const { x, y, width, height, radius = 4, ...rest } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g>
      <Rectangle
        {...rest}
        x={x}
        y={y}
        width={width}
        height={height}
        radius={radius}
        className={cn(
          "transition-all duration-200",
          isHovered ? "opacity-80 cursor-pointer" : "opacity-100"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </g>
  );
};

export function BarChart({
  data,
  keys = [],
  colors = ['#9b87f5', '#7E69AB', '#0ea5e9', '#22c55e', '#f97316'],
  xAxisDataKey,
  xAxisKey, // New prop for backward compatibility
  yAxisKey, // New prop for backward compatibility
  barKey, // New prop for backward compatibility
  stacked = false,
  showGrid = true,
  height = 300,
  className,
  tooltip,
  barSize,
  showYAxis = true,
  showXAxis = true,
  showLegend = false,
  layout = 'horizontal',
  tickFormatter, // For integer formatting
  tooltipFormatter, // For integer formatting
}: BarChartProps) {
  // Handle backward compatibility by using either the new or old prop names
  const actualXAxisDataKey = xAxisDataKey || xAxisKey || 'name';
  const actualKeys = keys.length > 0 ? keys : 
    Array.isArray(barKey) ? barKey : 
    barKey ? [barKey] : 
    yAxisKey ? (Array.isArray(yAxisKey) ? yAxisKey : [yAxisKey]) : 
    ['value'];

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: showLegend ? 20 : 5,
          }}
          barCategoryGap={10}
          className="[&_.recharts-cartesian-grid-horizontal_line]:stroke-muted/30 [&_.recharts-cartesian-grid-vertical_line]:stroke-muted/30"
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />}
          {showXAxis && <XAxis 
            dataKey={actualXAxisDataKey} 
            stroke="rgba(0,0,0,0.4)" 
            fontSize={12} 
            tickLine={false}
            axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
            dy={10}
            tickMargin={5}
          />}
          {showYAxis && <YAxis 
            stroke="rgba(0,0,0,0.4)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={tickFormatter || ((value) => value.toString().length > 5 ? `${value.toString().slice(0, 3)}...` : value.toString())}
            dx={-10}
            tickMargin={5}
            domain={[0, (dataMax) => Math.max(dataMax, 1)]} // Ensure minimum range of [0, 1]
            tickCount={4} // Limit to ~4 ticks
            allowDecimals={false} // Prevent decimal ticks
          />}
          {tooltip ? <Tooltip content={tooltip} /> : <Tooltip 
            contentStyle={{
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '8px 12px',
            }}
            formatter={tooltipFormatter}
          />}
          
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}
              formatter={(value) => <span className="text-xs font-medium">{value}</span>}
              iconSize={10}
              iconType="circle"
            />
          )}
          
          {actualKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              stackId={stacked ? "stack" : undefined}
              barSize={barSize}
              animationDuration={1500}
              animationEasing="ease-out"
              shape={<RoundedBar radius={4} />}
              className="transition-opacity hover:opacity-80"
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { cn } from "@/lib/utils";

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  colors?: string[];
  height?: number;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  activeIndex?: number;
  setActiveIndex?: (index: number) => void;
  showTotal?: boolean;
}

export function PieChart({
  data,
  colors = ['#9b87f5', '#7E69AB', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#d946ef', '#f97316', '#0ea5e9'],
  height = 300,
  className,
  innerRadius = 60,
  outerRadius = 80,
  showLegend = true,
  legendPosition = 'bottom',
  activeIndex = -1,
  setActiveIndex,
  showTotal = false,
}: PieChartProps) {
  // Calculate the total value
  const total = React.useMemo(() => data.reduce((acc, entry) => acc + entry.value, 0), [data]);

  const handleMouseEnter = (_, index) => {
    if (setActiveIndex) setActiveIndex(index);
  };
  
  const handleMouseLeave = () => {
    if (setActiveIndex) setActiveIndex(-1);
  };

  // Render the active shape with hover effect
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          {showTotal && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-lg font-medium fill-current"
            >
              {total}
            </text>
          )}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1000}
            animationEasing="ease-out"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
                className="transition-opacity hover:opacity-80"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}`, '']}
            labelFormatter={(name) => `${name}`}
            contentStyle={{
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '8px 12px',
            }}
            itemStyle={{
              padding: 0,
              margin: 0,
              fontSize: '12px',
            }}
          />
          {showLegend && (
            <Legend 
              layout={legendPosition === 'left' || legendPosition === 'right' ? 'vertical' : 'horizontal'}
              verticalAlign={legendPosition === 'top' ? 'top' : legendPosition === 'bottom' ? 'bottom' : 'middle'}
              align={legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center'}
              wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}
              formatter={(value) => <span className="text-xs font-medium">{value}</span>}
              iconSize={10}
              iconType="circle"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

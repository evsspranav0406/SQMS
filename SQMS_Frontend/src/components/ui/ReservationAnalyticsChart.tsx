import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from './chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

type ReservationAnalyticsChartProps = {
  data: { date: string; total: number; cancelled: number; completed: number }[];
};

const ReservationAnalyticsChart: React.FC<ReservationAnalyticsChartProps> = ({ data }) => {
  const config = {
    total: { label: 'Reservations', color: '#3b82f6' }, // blue color
    cancelled: { label: 'Cancelled', color: '#ef4444' }, // red color
    completed: { label: 'Completed', color: '#22c55e' }, // green color
  };

  return (
    <ChartContainer config={config} className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot />
          <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot />
          <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default ReservationAnalyticsChart;

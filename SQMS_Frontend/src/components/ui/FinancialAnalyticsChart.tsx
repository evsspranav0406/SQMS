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

type FinancialAnalyticsChartProps = {
  data: { date: string; totalAmount: number }[];
};

const FinancialAnalyticsChart: React.FC<FinancialAnalyticsChartProps> = ({ data }) => {
  const config = {
    totalAmount: { label: 'Revenue', color: '#10b981' }, // emerald green color
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
          <Line type="monotone" dataKey="totalAmount" stroke="#10b981" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default FinancialAnalyticsChart;

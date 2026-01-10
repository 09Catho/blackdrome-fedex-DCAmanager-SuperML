'use client';

import { AgeingBucket, DCAScorecard } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

interface AgeingChartProps {
  buckets: AgeingBucket[];
}

export function AgeingChart({ buckets }: AgeingChartProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Ageing Analysis</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={buckets}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
          <Legend />
          <Bar dataKey="total_amount" fill="#4D148C" name="Amount (₹)" />
          <Bar dataKey="case_count" fill="#FF6600" name="Case Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DCAPerformanceChartProps {
  dcas: DCAScorecard[];
}

export function DCAPerformanceChart({ dcas }: DCAPerformanceChartProps) {
  const topDCAs = dcas.slice(0, 5);
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Top DCAs by Recovery</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topDCAs} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="dca_name" type="category" width={150} />
          <Tooltip formatter={(value: any) => formatCurrency(value as number)} />
          <Bar dataKey="recovered_amount" fill="#10B981" name="Recovered (₹)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StatusDistributionProps {
  distribution: Record<string, number>;
}

export function StatusDistributionChart({ distribution }: StatusDistributionProps) {
  const data = Object.entries(distribution).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Cases by Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

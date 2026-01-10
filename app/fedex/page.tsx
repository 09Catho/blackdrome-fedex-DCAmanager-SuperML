'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { AgeingChart, StatusDistributionChart } from '@/components/Charts';
import { AgeingBucket } from '@/lib/types';

export default function FedExDashboard() {
  const [openCases, setOpenCases] = useState(0);
  const [openAmount, setOpenAmount] = useState(0);
  const [recoveredAmount, setRecoveredAmount] = useState(0);
  const [slaBreaches, setSlaBreaches] = useState(0);
  const [ageingBuckets, setAgeingBuckets] = useState<AgeingBucket[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();

    // Fetch all cases (FedEx admin sees all)
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*');

    if (cases) {
      // Calculate KPIs
      const open = cases.filter(c => 
        ['NEW', 'VALIDATED', 'ASSIGNED', 'IN_PROGRESS', 'PTP', 'DISPUTE'].includes(c.status)
      );
      const recovered = cases.filter(c => c.status === 'RECOVERED');
      
      setOpenCases(open.length);
      setOpenAmount(open.reduce((sum, c) => sum + (c.amount || 0), 0));
      setRecoveredAmount(recovered.reduce((sum, c) => sum + (c.amount || 0), 0));
      
      // Count SLA breaches
      const breaches = cases.filter(c => {
        if (!c.sla_due_at) return false;
        return new Date(c.sla_due_at) < new Date() && 
               !['RECOVERED', 'CLOSED'].includes(c.status);
      });
      setSlaBreaches(breaches.length);

      // Calculate ageing buckets
      const buckets = [
        { bucket: '0-30 days', case_count: 0, total_amount: 0, avg_priority_score: 0 },
        { bucket: '31-60 days', case_count: 0, total_amount: 0, avg_priority_score: 0 },
        { bucket: '61-90 days', case_count: 0, total_amount: 0, avg_priority_score: 0 },
        { bucket: '90+ days', case_count: 0, total_amount: 0, avg_priority_score: 0 }
      ];

      cases.forEach(c => {
        let bucketIndex;
        if (c.ageing_days <= 30) bucketIndex = 0;
        else if (c.ageing_days <= 60) bucketIndex = 1;
        else if (c.ageing_days <= 90) bucketIndex = 2;
        else bucketIndex = 3;

        buckets[bucketIndex].case_count++;
        buckets[bucketIndex].total_amount += c.amount || 0;
      });

      setAgeingBuckets(buckets);

      // Calculate status distribution
      const distribution: Record<string, number> = {};
      cases.forEach(c => {
        distribution[c.status] = (distribution[c.status] || 0) + 1;
      });
      setStatusDistribution(distribution);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of all collections activity</p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Open Cases */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-sm font-medium text-blue-800 uppercase tracking-wide mb-2">
              Open Cases
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-1">
              {openCases}
            </div>
            <div className="text-sm text-blue-700">
              Active cases
            </div>
          </div>

          {/* Open Amount */}
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="text-sm font-medium text-orange-800 uppercase tracking-wide mb-2">
              Open Amount
            </div>
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {formatCurrency(openAmount)}
            </div>
            <div className="text-sm text-orange-700">
              Total outstanding
            </div>
          </div>

          {/* Recovered Amount */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-sm font-medium text-green-800 uppercase tracking-wide mb-2">
              Recovered Amount
            </div>
            <div className="text-3xl font-bold text-green-900 mb-1">
              {formatCurrency(recoveredAmount)}
            </div>
            <div className="text-sm text-green-700">
              Total recovered
            </div>
          </div>

          {/* SLA Breaches */}
          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="text-sm font-medium text-red-800 uppercase tracking-wide mb-2">
              SLA Breaches
            </div>
            <div className="text-4xl font-bold text-red-900 mb-1">
              {slaBreaches}
            </div>
            <div className="text-sm text-red-700">
              {slaBreaches === 0 ? '0 escalated' : `${slaBreaches} breached`}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!loading && ageingBuckets.length > 0 && (
          <>
            <AgeingChart buckets={ageingBuckets} />
            <StatusDistributionChart distribution={statusDistribution} />
          </>
        )}
      </div>
    </div>
  );
}

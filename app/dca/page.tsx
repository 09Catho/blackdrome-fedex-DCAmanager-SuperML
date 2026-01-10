'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function DCADashboard() {
  const [openCases, setOpenCases] = useState(0);
  const [openAmount, setOpenAmount] = useState(0);
  const [recoveredAmount, setRecoveredAmount] = useState(0);
  const [slaBreaches, setSlaBreaches] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();

    // Fetch all cases for this DCA (RLS automatically filters)
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*');

    if (cases) {
      // Calculate KPIs from cases
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
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your assigned cases</p>
      </div>

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

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dca/cases"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="text-lg font-semibold text-gray-900 mb-1">View All Cases</div>
            <div className="text-sm text-gray-600">Manage your assigned cases</div>
          </a>
          <a
            href="/dca/cases?status=IN_PROGRESS"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="text-lg font-semibold text-gray-900 mb-1">In Progress</div>
            <div className="text-sm text-gray-600">Cases currently being worked on</div>
          </a>
          <a
            href="/dca/cases?sla_breach=true"
            className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
          >
            <div className="text-lg font-semibold text-gray-900 mb-1">SLA Breaches</div>
            <div className="text-sm text-gray-600">Urgent cases requiring attention</div>
          </a>
        </div>
      </div>
    </div>
  );
}

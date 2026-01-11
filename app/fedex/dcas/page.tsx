'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Building2, Users, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

interface DCA {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  assigned_cases_count: number;
  recovered_cases_count: number;
  recovery_rate: number;
  avg_resolution_days: number;
  sla_compliance_rate: number;
  created_at: string;
}

export default function DCAsPage() {
  const [dcas, setDcas] = useState<DCA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDCAs();
  }, []);

  async function fetchDCAs() {
    try {
      const supabase = createClient();

      // Fetch all DCAs
      const { data: dcaList, error: dcaError } = await supabase
        .from('dca')
        .select('*')
        .order('name');

      if (dcaError) throw dcaError;

      // Fetch stats for each DCA
      const dcasWithStats = await Promise.all(
        (dcaList || []).map(async (dca) => {
          // Total assigned cases
          const { count: totalCases } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_dca_id', dca.id);

          // Recovered cases
          const { count: recoveredCases } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_dca_id', dca.id)
            .eq('status', 'RECOVERED');

          // SLA compliant cases
          const { count: slaCompliant } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_dca_id', dca.id)
            .eq('sla_breached', false);

          const recoveryRate = totalCases ? ((recoveredCases || 0) / totalCases) * 100 : 0;
          const slaComplianceRate = totalCases ? ((slaCompliant || 0) / totalCases) * 100 : 0;

          return {
            ...dca,
            assigned_cases_count: totalCases || 0,
            recovered_cases_count: recoveredCases || 0,
            recovery_rate: recoveryRate,
            avg_resolution_days: 12, // Placeholder
            sla_compliance_rate: slaComplianceRate,
          };
        })
      );

      setDcas(dcasWithStats);
    } catch (err: any) {
      console.error('Error fetching DCAs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DCAs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">Error loading DCAs</p>
          <p className="text-gray-600 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalAssigned = dcas.reduce((sum, dca) => sum + dca.assigned_cases_count, 0);
  const totalRecovered = dcas.reduce((sum, dca) => sum + dca.recovered_cases_count, 0);
  const avgRecoveryRate = dcas.length > 0 ? dcas.reduce((sum, dca) => sum + dca.recovery_rate, 0) / dcas.length : 0;
  const avgSLACompliance = dcas.length > 0 ? dcas.reduce((sum, dca) => sum + dca.sla_compliance_rate, 0) / dcas.length : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          DCA Management
        </h1>
        <p className="text-gray-600 mt-2">Monitor and manage all debt collection agencies</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Active DCAs</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{dcas.length}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Cases</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{totalAssigned}</p>
            </div>
            <Users className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Avg Recovery Rate</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{avgRecoveryRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Avg SLA Compliance</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{avgSLACompliance.toFixed(1)}%</p>
            </div>
            <Award className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* DCA List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All DCAs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DCA Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Cases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recovered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recovery Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dcas.map((dca) => (
                <tr key={dca.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{dca.name}</div>
                        <div className="text-sm text-gray-500">ID: {dca.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dca.contact_email}</div>
                    <div className="text-sm text-gray-500">{dca.contact_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{dca.assigned_cases_count}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">{dca.recovered_cases_count}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {dca.recovery_rate >= 70 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-semibold ${dca.recovery_rate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {dca.recovery_rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-semibold ${dca.sla_compliance_rate >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                        {dca.sla_compliance_rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dcas.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No DCAs found</p>
            <p className="text-gray-400 text-sm mt-1">DCAs will appear here once they are added to the system</p>
          </div>
        )}
      </div>
    </div>
  );
}

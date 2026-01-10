'use client';

import { CaseSummary } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/sop';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatProbability, formatPriorityScore, getPriorityLabel } from '@/lib/scoring';
import { SLABadge } from '@/components/SLABadge';
import Link from 'next/link';

interface CaseTableProps {
  cases: CaseSummary[];
  basePath: string;
  loading?: boolean;
}

export function CaseTable({ cases, basePath, loading }: CaseTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="card text-center text-gray-500">
        <p>No cases found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Case ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ageing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DCA
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recovery Prob
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cases.map((caseItem) => {
            const priorityInfo = getPriorityLabel(caseItem.priority_score);
            return (
              <tr key={caseItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {caseItem.external_ref || caseItem.id.slice(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {caseItem.customer_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(caseItem.amount, caseItem.currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`${caseItem.ageing_days > 90 ? 'text-red-600 font-semibold' : ''}`}>
                    {caseItem.ageing_days} days
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`badge ${STATUS_COLORS[caseItem.status]}`}>
                      {caseItem.status}
                    </span>
                    <SLABadge 
                      slaBreached={caseItem.sla_breached || false} 
                      slaDueAt={caseItem.sla_due_at} 
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {caseItem.assigned_dca_name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className={priorityInfo.color}>
                    {priorityInfo.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPriorityScore(caseItem.priority_score)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatProbability(caseItem.recovery_prob_30d)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`${basePath}/${caseItem.id}`}
                    className="text-fedex-purple hover:text-purple-800"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { CaseActivity, CaseAudit } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Clock, User, FileText, AlertTriangle } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'activity' | 'audit';
  timestamp: string;
  actor: string;
  action: string;
  details: any;
}

interface CaseTimelineProps {
  activities: CaseActivity[];
  audits?: CaseAudit[];
  loading?: boolean;
}

export function CaseTimeline({ activities, audits = [], loading }: CaseTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Combine and sort events
  const events: TimelineEvent[] = [
    ...activities.map((a) => ({
      id: a.id,
      type: 'activity' as const,
      timestamp: a.created_at,
      actor: a.actor_role,
      action: a.activity_type,
      details: a.payload,
    })),
    ...audits.map((a) => ({
      id: a.id,
      type: 'audit' as const,
      timestamp: a.created_at,
      actor: a.actor_user_id || 'System',
      action: a.action,
      details: a.after || a.before,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              event.type === 'activity' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {event.type === 'activity' ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <FileText className="w-4 h-4 text-gray-600" />
              )}
            </div>
            {idx < events.length - 1 && (
              <div className="ml-4 mt-2 h-full border-l-2 border-gray-200"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatActivityTitle(event.action, event.details)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  by {event.actor} • {formatDateTime(event.timestamp)}
                </p>
              </div>
            </div>

            {/* Details */}
            {event.details && Object.keys(event.details).length > 0 && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3">
                {formatActivityDetails(event.action, event.details)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatActivityTitle(action: string, details: any): string {
  switch (action) {
    case 'CONTACT_ATTEMPT':
      return `Contact Attempt via ${details.contact_method || 'unknown'}`;
    case 'PTP_CREATED':
      return 'Payment Promise Created';
    case 'DISPUTE_RAISED':
      return 'Dispute Raised';
    case 'PAYMENT_LOGGED':
      return 'Payment Logged';
    case 'EVIDENCE_UPLOADED':
      return 'Evidence Uploaded';
    case 'STATUS_UPDATE':
      return `Status Changed to ${details.status || 'unknown'}`;
    case 'CASE_CREATED':
      return 'Case Created';
    case 'CASE_ASSIGNED':
      return 'Case Assigned';
    case 'SLA_BREACHED':
      return 'SLA Breached';
    default:
      return action.replace(/_/g, ' ');
  }
}

function formatActivityDetails(action: string, details: any) {
  const items: [string, any][] = Object.entries(details).filter(
    ([key]) => !['status'].includes(key)
  );

  return (
    <dl className="space-y-1 text-sm">
      {items.map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <dt className="font-medium text-gray-600">{formatKey(key)}:</dt>
          <dd className="text-gray-900">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

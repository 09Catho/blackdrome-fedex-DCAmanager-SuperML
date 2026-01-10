// SOP (Standard Operating Procedure) workflow rules

export type CaseStatus = 'NEW' | 'VALIDATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'PTP' | 'DISPUTE' | 'ESCALATED' | 'RECOVERED' | 'CLOSED';
export type ClosureReason = 'RECOVERED' | 'WRITE_OFF' | 'INVALID' | 'DUPLICATE' | 'OTHER';
export type ActivityType = 'CONTACT_ATTEMPT' | 'PTP_CREATED' | 'DISPUTE_RAISED' | 'NOTE' | 'STATUS_UPDATE' | 'PAYMENT_LOGGED' | 'EVIDENCE_UPLOADED';

export const STATUS_COLORS: Record<CaseStatus, string> = {
  NEW: 'bg-gray-100 text-gray-800',
  VALIDATED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  PTP: 'bg-purple-100 text-purple-800',
  DISPUTE: 'bg-orange-100 text-orange-800',
  ESCALATED: 'bg-red-100 text-red-800',
  RECOVERED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  NEW: ['VALIDATED'],
  VALIDATED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['PTP', 'DISPUTE', 'ESCALATED'],
  PTP: ['RECOVERED', 'IN_PROGRESS'],
  DISPUTE: ['IN_PROGRESS', 'ESCALATED'],
  ESCALATED: ['CLOSED', 'IN_PROGRESS'],
  RECOVERED: ['CLOSED'],
  CLOSED: [],
};

export function isTransitionAllowed(currentStatus: CaseStatus, newStatus: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export function getNextStatuses(currentStatus: CaseStatus): CaseStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export interface TransitionMetadata {
  ptp_date?: string;
  ptp_amount?: number;
  payment_date?: string;
  payment_amount?: number;
  closure_reason?: ClosureReason;
  notes?: string;
  [key: string]: any;
}

export function validateTransitionMetadata(
  newStatus: CaseStatus,
  metadata: TransitionMetadata
): string | null {
  if (newStatus === 'PTP') {
    if (!metadata.ptp_date || !metadata.ptp_amount) {
      return 'PTP requires ptp_date and ptp_amount';
    }
  }

  if (newStatus === 'RECOVERED') {
    if (!metadata.payment_date || !metadata.payment_amount) {
      return 'RECOVERED requires payment_date and payment_amount';
    }
  }

  if (newStatus === 'CLOSED') {
    if (!metadata.closure_reason) {
      return 'CLOSED requires closure_reason';
    }
  }

  return null;
}

export const AGEING_BUCKETS = [
  { label: '0-30 days', min: 0, max: 30, color: 'bg-green-500' },
  { label: '31-60 days', min: 31, max: 60, color: 'bg-yellow-500' },
  { label: '61-90 days', min: 61, max: 90, color: 'bg-orange-500' },
  { label: '90+ days', min: 91, max: Infinity, color: 'bg-red-500' },
];

export function getAgeingBucket(days: number) {
  return AGEING_BUCKETS.find(b => days >= b.min && days <= b.max) || AGEING_BUCKETS[AGEING_BUCKETS.length - 1];
}

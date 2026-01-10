'use client';

import { useState } from 'react';
import { CaseStatus, getNextStatuses } from '@/lib/sop';
import { AlertCircle } from 'lucide-react';

interface CaseActionsProps {
  caseId: string;
  currentStatus: CaseStatus;
  canTransition: boolean;
  onTransition: (newStatus: CaseStatus, metadata: any) => Promise<void>;
}

export function CaseActions({ caseId, currentStatus, canTransition, onTransition }: CaseActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('');
  const [metadata, setMetadata] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = getNextStatuses(currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setLoading(true);
    setError(null);

    try {
      await onTransition(selectedStatus as CaseStatus, metadata);
      setSelectedStatus('');
      setMetadata({});
    } catch (err: any) {
      setError(err.message || 'Failed to transition case');
    } finally {
      setLoading(false);
    }
  };

  if (!canTransition || nextStatuses.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Change Status</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as CaseStatus);
              setMetadata({});
            }}
            className="input"
            required
          >
            <option value="">Select status...</option>
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional fields based on selected status */}
        {selectedStatus === 'PTP' && (
          <>
            <div>
              <label className="label">PTP Date</label>
              <input
                type="date"
                value={metadata.ptp_date || ''}
                onChange={(e) => setMetadata({ ...metadata, ptp_date: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">PTP Amount</label>
              <input
                type="number"
                value={metadata.ptp_amount || ''}
                onChange={(e) => setMetadata({ ...metadata, ptp_amount: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>
          </>
        )}

        {selectedStatus === 'RECOVERED' && (
          <>
            <div>
              <label className="label">Payment Date</label>
              <input
                type="date"
                value={metadata.payment_date || ''}
                onChange={(e) => setMetadata({ ...metadata, payment_date: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Payment Amount</label>
              <input
                type="number"
                value={metadata.payment_amount || ''}
                onChange={(e) => setMetadata({ ...metadata, payment_amount: parseFloat(e.target.value) })}
                className="input"
                required
              />
            </div>
          </>
        )}

        {selectedStatus === 'CLOSED' && (
          <div>
            <label className="label">Closure Reason</label>
            <select
              value={metadata.closure_reason || ''}
              onChange={(e) => setMetadata({ ...metadata, closure_reason: e.target.value })}
              className="input"
              required
            >
              <option value="">Select reason...</option>
              <option value="RECOVERED">Recovered</option>
              <option value="WRITE_OFF">Write Off</option>
              <option value="INVALID">Invalid</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        )}

        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            value={metadata.notes || ''}
            onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Add any additional notes..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedStatus}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Update Status'}
        </button>
      </form>
    </div>
  );
}

interface ContactFormProps {
  caseId: string;
  onSubmit: (data: any) => Promise<void>;
}

export function ContactAttemptForm({ caseId, onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState({
    contact_method: 'phone',
    outcome: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        contact_date: new Date().toISOString().split('T')[0],
      });
      setFormData({ contact_method: 'phone', outcome: '', notes: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Log Contact Attempt</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Contact Method</label>
          <select
            value={formData.contact_method}
            onChange={(e) => setFormData({ ...formData, contact_method: e.target.value })}
            className="input"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="visit">Field Visit</option>
          </select>
        </div>

        <div>
          <label className="label">Outcome</label>
          <select
            value={formData.outcome}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
            className="input"
            required
          >
            <option value="">Select outcome...</option>
            <option value="spoke_to_customer">Spoke to Customer</option>
            <option value="no_answer">No Answer</option>
            <option value="wrong_number">Wrong Number</option>
            <option value="promised_payment">Promised Payment</option>
            <option value="dispute">Dispute</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            required
            placeholder="Describe the conversation..."
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Submitting...' : 'Log Contact'}
        </button>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface EscalationModalProps {
  caseId: string;
  caseName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EscalationModal({ caseId, caseName, isOpen, onClose, onSuccess }: EscalationModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const escalationReasons = [
    'SLA Breach',
    'High Value Case',
    'Customer Dispute',
    'Multiple Failed Attempts',
    'Legal Action Required',
    'Other'
  ];

  const handleEscalate = async () => {
    if (!reason) {
      setError('Please select an escalation reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Update case with escalation
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'ESCALATED',
          escalation_reason: reason,
          escalated_at: new Date().toISOString(),
          escalated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (updateError) throw updateError;

      // Create audit record
      await supabase
        .from('case_audit')
        .insert({
          case_id: caseId,
          action: 'CASE_ESCALATED',
          after: { reason },
          user_id: user?.id
        });

      // Update SLA record
      await supabase
        .from('case_sla')
        .update({
          escalation_triggered: true
        })
        .eq('case_id', caseId);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Escalation error:', err);
      setError(err.message || 'Failed to escalate case');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Escalate Case</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Case: <span className="font-semibold">{caseName}</span></p>
            <p className="text-sm text-gray-600">
              Escalating this case will mark it as high priority and notify administrators.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {escalationReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Provide additional context..."
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleEscalate}
            disabled={loading || !reason}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Escalating...' : 'Escalate Case'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { ALLOWED_TRANSITIONS, CaseStatus } from '@/lib/sop';

interface StatusChangeModalProps {
  caseId: string;
  currentStatus: string;
  caseName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StatusChangeModal({ 
  caseId, 
  currentStatus, 
  caseName, 
  isOpen, 
  onClose, 
  onSuccess 
}: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [ptpDate, setPtpDate] = useState('');
  const [ptpAmount, setPtpAmount] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get valid transitions for current status
  const validNextStatuses = ALLOWED_TRANSITIONS[currentStatus as CaseStatus] || [];

  const requiresPTP = newStatus === 'PTP';
  const requiresDispute = newStatus === 'DISPUTE';
  const requiresRecovered = newStatus === 'RECOVERED';

  const validateForm = () => {
    if (!newStatus) {
      setError('Please select a new status');
      return false;
    }

    if (requiresPTP && (!ptpDate || !ptpAmount)) {
      setError('PTP requires date and amount');
      return false;
    }

    if (requiresDispute && !disputeReason) {
      setError('Dispute requires a reason');
      return false;
    }

    if (requiresRecovered && !ptpAmount) {
      setError('Recovered status requires recovered amount');
      return false;
    }

    return true;
  };

  const handleStatusChange = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Build update object
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add status-specific fields
      if (requiresPTP) {
        updateData.ptp_date = new Date(ptpDate).toISOString();
        updateData.ptp_amount = parseFloat(ptpAmount);
      }

      if (requiresRecovered) {
        updateData.closure_reason = 'RECOVERED';
        updateData.closed_at = new Date().toISOString();
      }

      // Update case
      const { error: updateError } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseId);

      if (updateError) throw updateError;

      // Create audit record
      await supabase
        .from('case_audit')
        .insert({
          case_id: caseId,
          action: 'STATUS_CHANGED',
          before: { status: currentStatus },
          after: { status: newStatus, notes },
          user_id: user?.id
        });

      // Create activity record
      const activityPayload: any = {
        old_status: currentStatus,
        new_status: newStatus,
        notes: notes
      };

      if (requiresPTP) {
        activityPayload.ptp_date = ptpDate;
        activityPayload.ptp_amount = ptpAmount;
      }

      if (requiresDispute) {
        activityPayload.dispute_reason = disputeReason;
      }

      await supabase
        .from('case_activity')
        .insert({
          case_id: caseId,
          actor_user_id: user?.id,
          activity_type: 'STATUS_CHANGE',
          payload: activityPayload
        });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Status change error:', err);
      setError(err.message || 'Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Change Status</h2>
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
            <p className="text-sm text-gray-600 mb-2">
              Case: <span className="font-semibold">{caseName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Current Status: <span className="px-2 py-1 bg-gray-100 rounded font-medium">{currentStatus}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => {
                setNewStatus(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select new status...</option>
              {validNextStatuses.map((status: CaseStatus) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {validNextStatuses.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No valid transitions from current status</p>
            )}
          </div>

          {/* PTP Fields */}
          {requiresPTP && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promise to Pay Date *
                </label>
                <input
                  type="date"
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promise to Pay Amount (₹) *
                </label>
                <input
                  type="number"
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(e.target.value)}
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Dispute Reason */}
          {requiresDispute && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dispute Reason *
              </label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select reason...</option>
                <option value="Service Quality Issue">Service Quality Issue</option>
                <option value="Billing Error">Billing Error</option>
                <option value="Product Not Received">Product Not Received</option>
                <option value="Damaged Goods">Damaged Goods</option>
                <option value="Unauthorized Charge">Unauthorized Charge</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Recovered Amount */}
          {requiresRecovered && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovered Amount (₹) *
              </label>
              <input
                type="number"
                value={ptpAmount}
                onChange={(e) => setPtpAmount(e.target.value)}
                placeholder="Full or partial amount"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Add any relevant notes about this status change..."
            />
          </div>

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
            onClick={handleStatusChange}
            disabled={loading || !newStatus}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Change Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

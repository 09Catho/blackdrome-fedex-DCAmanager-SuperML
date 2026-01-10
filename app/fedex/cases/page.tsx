'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { CaseTable } from '@/components/CaseTable';
import { CaseSummary } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function FedExCasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('v_case_summary')
      .select('*')
      .order('priority_score', { ascending: false, nullsFirst: false });

    setCases(data || []);
    setLoading(false);
  };

  const handleCreateCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const response = await fetch('/api/cases/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_ref: formData.get('external_ref'),
        customer_name: formData.get('customer_name'),
        amount: parseFloat(formData.get('amount') as string),
        ageing_days: parseInt(formData.get('ageing_days') as string),
      }),
    });

    if (response.ok) {
      setShowCreateForm(false);
      fetchCases();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-2">Manage all collection cases</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Case
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Create New Case</h3>
          <form onSubmit={handleCreateCase} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">External Reference</label>
                <input name="external_ref" className="input" placeholder="INV-2024-001" />
              </div>
              <div>
                <label className="label">Customer Name *</label>
                <input name="customer_name" className="input" required />
              </div>
              <div>
                <label className="label">Amount (₹) *</label>
                <input name="amount" type="number" className="input" required />
              </div>
              <div>
                <label className="label">Ageing (Days) *</label>
                <input name="ageing_days" type="number" className="input" required />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">Create Case</button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <CaseTable cases={cases} basePath="/fedex/cases" loading={loading} />
    </div>
  );
}

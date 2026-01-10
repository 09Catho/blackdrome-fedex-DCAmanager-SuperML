'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { CaseTable } from '@/components/CaseTable';
import { CaseSummary } from '@/lib/types';

export default function DCACasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    const supabase = createClient();
    
    // RLS will automatically filter to DCA's assigned cases
    const { data } = await supabase
      .from('v_case_summary')
      .select('*')
      .not('status', 'eq', 'CLOSED')
      .order('priority_score', { ascending: false, nullsFirst: false });

    setCases(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Cases</h1>
        <p className="text-gray-600 mt-2">Cases assigned to your DCA</p>
      </div>

      <CaseTable cases={cases} basePath="/dca/cases" loading={loading} />
    </div>
  );
}

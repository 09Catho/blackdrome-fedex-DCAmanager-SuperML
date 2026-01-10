'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { ArrowLeft, Brain, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle, User, Building, Calendar, AlertOctagon, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatProbability, formatPriorityScore, getPriorityLabel } from '@/lib/scoring';
import { STATUS_COLORS } from '@/lib/sop';
import { SLATimer } from '@/components/SLATimer';
import { SLABadge } from '@/components/SLABadge';
import { EscalationModal } from '@/components/EscalationModal';
import { StatusChangeModal } from '@/components/StatusChangeModal';

interface CaseDetail {
  id: string;
  external_ref: string | null;
  customer_name: string;
  customer_contact: string | null;
  amount: number;
  currency: string;
  ageing_days: number;
  status: string;
  assigned_dca_id: string | null;
  assigned_dca_name: string | null;
  recovery_prob_30d: number | null;
  priority_score: number | null;
  reason_codes: string[] | null;
  created_at: string;
  updated_at: string;
  sla_breached: boolean;
  sla_due_at: string | null;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState('');
  const [calculationDetails, setCalculationDetails] = useState<any>(null);
  const [showCalculations, setShowCalculations] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('v_case_summary')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) {
      console.error('Error fetching case:', error);
      setError('Failed to load case details');
    } else {
      setCaseData(data);
    }
    setLoading(false);
  };

  const handleScoreCase = async () => {
    setScoring(true);
    setError('');

    try {
      const response = await fetch(`https://vgetykvrcjnpzfkonnwf.supabase.co/functions/v1/score_case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ case_id: caseId })
      });

      if (!response.ok) {
        throw new Error('Failed to score case');
      }

      const result = await response.json();
      console.log('Scoring result:', result);

      // Store calculation details for transparency
      if (result.calculation_details) {
        setCalculationDetails(result.calculation_details);
        setShowCalculations(true);
      }

      // Refresh case data
      await fetchCaseDetails();
    } catch (err: any) {
      console.error('Scoring error:', err);
      setError(err.message || 'Failed to score case');
    } finally {
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="card">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="card">
        <div className="text-gray-600">Case not found</div>
      </div>
    );
  }

  const priorityInfo = getPriorityLabel(caseData.priority_score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {caseData.external_ref || `Case ${caseData.id.slice(0, 8)}`}
              </h1>
              <SLABadge slaBreached={caseData.sla_breached} slaDueAt={caseData.sla_due_at} />
            </div>
            <p className="text-gray-600 mt-1">{caseData.customer_name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowStatusModal(true)}
            className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Change Status
          </button>
          <button
            onClick={() => setShowEscalationModal(true)}
            className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          >
            <AlertOctagon className="w-5 h-5" />
            Escalate
          </button>
          <button
            onClick={handleScoreCase}
            disabled={scoring}
            className="btn btn-primary flex items-center gap-2"
          >
            <Brain className="w-5 h-5" />
            {scoring ? 'Scoring...' : 'Score with AI'}
          </button>
        </div>
      </div>

      {/* SLA Timer Alert */}
      {caseData.sla_due_at && (
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">SLA Deadline</h3>
              <p className="text-sm text-gray-600">Monitor case progress to avoid breaches</p>
            </div>
            <SLATimer slaDueAt={caseData.sla_due_at} slaBreached={caseData.sla_breached} />
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Outstanding Amount</div>
              <div className="text-2xl font-bold">
                {formatCurrency(caseData.amount, caseData.currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Ageing</div>
              <div className={`text-2xl font-bold ${caseData.ageing_days > 90 ? 'text-red-600' : 'text-gray-900'}`}>
                {caseData.ageing_days} days
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Recovery Probability</div>
              <div className="text-2xl font-bold">
                {formatProbability(caseData.recovery_prob_30d)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`p-3 ${priorityInfo.bgColor} rounded-lg`}>
              <AlertCircle className={`w-6 h-6 ${priorityInfo.textColor}`} />
            </div>
            <div>
              <div className="text-sm text-gray-600">Priority</div>
              <div className={`text-2xl font-bold ${priorityInfo.textColor}`}>
                {priorityInfo.label}
              </div>
              <div className="text-xs text-gray-500">
                {formatPriorityScore(caseData.priority_score)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Case Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Case ID</div>
                <div className="font-medium">{caseData.id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">External Reference</div>
                <div className="font-medium">{caseData.external_ref || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <span className={`badge ${STATUS_COLORS[caseData.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                  {caseData.status}
                </span>
                {caseData.sla_breached && (
                  <span className="ml-2 badge bg-red-100 text-red-800">SLA Breach</span>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Assigned DCA</div>
                <div className="font-medium flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {caseData.assigned_dca_name || 'Unassigned'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Created</div>
                <div className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(caseData.created_at)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                <div className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDate(caseData.updated_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Customer Name</div>
                <div className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {caseData.customer_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Contact</div>
                <div className="font-medium">{caseData.customer_contact || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI/ML Insights */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Insights
            </h2>
            
            {caseData.recovery_prob_30d !== null ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Recovery Probability (30 days)</div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${(caseData.recovery_prob_30d || 0) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {((caseData.recovery_prob_30d || 0) * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Priority Score</div>
                  <div className={`text-3xl font-bold ${priorityInfo.textColor}`}>
                    {formatPriorityScore(caseData.priority_score)}
                  </div>
                  <div className={`text-sm ${priorityInfo.textColor}`}>
                    {priorityInfo.label}
                  </div>
                </div>

                {caseData.reason_codes && caseData.reason_codes.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Key Factors (Explainable AI)</div>
                    <ul className="space-y-2">
                      {caseData.reason_codes.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">This case hasn't been scored yet</p>
                <button
                  onClick={handleScoreCase}
                  disabled={scoring}
                  className="btn btn-primary"
                >
                  {scoring ? 'Scoring...' : 'Score with AI'}
                </button>
              </div>
            )}
          </div>

          <div className="card bg-purple-50 border-purple-200">
            <h3 className="font-semibold mb-2 text-purple-900">Recommended Actions</h3>
            <ul className="text-sm space-y-2 text-purple-800">
              {caseData.ageing_days > 90 && (
                <li>• Escalate - Case is significantly aged</li>
              )}
              {caseData.recovery_prob_30d && caseData.recovery_prob_30d > 0.7 && (
                <li>• High recovery potential - Prioritize contact</li>
              )}
              {caseData.recovery_prob_30d && caseData.recovery_prob_30d < 0.3 && (
                <li>• Low recovery probability - Consider legal action</li>
              )}
              {!caseData.assigned_dca_id && (
                <li>• Assign to a DCA for collection</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ML Model Calculation Details - TRANSPARENCY */}
      {calculationDetails && (
        <div className="card bg-gray-50 border-2 border-purple-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              ML Model Calculations (Real-Time Transparency)
            </h2>
            <button
              onClick={() => setShowCalculations(!showCalculations)}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              {showCalculations ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showCalculations && (
            <div className="space-y-4">
              {/* Case Input Data */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📥 Input Data</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>{' '}
                    <span className="font-mono">₹{calculationDetails.case_data.amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ageing:</span>{' '}
                    <span className="font-mono">{calculationDetails.case_data.ageing_days} days</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>{' '}
                    <span className="font-mono">{calculationDetails.case_data.status}</span>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📊 Activity Stats (30-day window)</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Contact Attempts:</span>{' '}
                    <span className="font-mono">{calculationDetails.activity_stats.attempts_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Days Since Update:</span>{' '}
                    <span className="font-mono">{calculationDetails.activity_stats.days_since_last_update}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Has Dispute:</span>{' '}
                    <span className="font-mono">{calculationDetails.activity_stats.has_dispute ? 'Yes ❌' : 'No ✅'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">PTP Active:</span>{' '}
                    <span className="font-mono">{calculationDetails.activity_stats.ptp_active ? 'Yes ✅' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Feature Engineering */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🔧 Feature Engineering</h3>
                <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                  <div>ageing = <span className="text-blue-600">{calculationDetails.features.ageing.toFixed(4)}</span></div>
                  <div>log_amount = <span className="text-blue-600">{calculationDetails.features.log_amount.toFixed(4)}</span></div>
                  <div>attempts = <span className="text-blue-600">{calculationDetails.features.attempts.toFixed(4)}</span></div>
                  <div>staleness = <span className="text-blue-600">{calculationDetails.features.staleness.toFixed(4)}</span></div>
                  <div>dispute = <span className="text-blue-600">{calculationDetails.features.dispute}</span></div>
                  <div>ptp_active = <span className="text-blue-600">{calculationDetails.features.ptp_active}</span></div>
                </div>
              </div>

              {/* Model Weights & Contributions */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⚖️ Model Weights × Features = Contributions</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span>Bias:</span>
                    <span className="text-purple-600 font-bold">{calculationDetails.model_calculation.contributions.bias.toFixed(4)}</span>
                  </div>
                  {Object.entries(calculationDetails.model_calculation.contributions).map(([key, value]: [string, any]) => {
                    if (key === 'bias') return null;
                    const isNegative = value < 0;
                    return (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
                          {value.toFixed(4)} {isNegative ? '(reduces)' : '(increases)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linear Combination */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">➕ Linear Combination (z-score)</h3>
                <div className="text-sm">
                  <div className="mb-2 text-gray-600">Formula:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {calculationDetails.model_calculation.formula}
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">z = </span>
                    <span className="font-mono text-lg font-bold text-purple-600">
                      {calculationDetails.model_calculation.z_score.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sigmoid Activation */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📈 Sigmoid Activation Function</h3>
                <div className="text-sm">
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-2">
                    probability = 1 / (1 + e^(-z))
                  </div>
                  <div>
                    <span className="text-gray-600">Before sigmoid: </span>
                    <span className="font-mono">{calculationDetails.model_calculation.recovery_prob_before_sigmoid.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">After sigmoid: </span>
                    <span className="font-mono text-lg font-bold text-green-600">
                      {(calculationDetails.model_calculation.recovery_prob_after_sigmoid * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Priority Score */}
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🎯 Priority Score Calculation</h3>
                <div className="text-sm">
                  <div className="mb-2 text-gray-600">Formula:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                    {calculationDetails.priority_calculation.formula}
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">Result: </span>
                    <span className="font-mono text-lg font-bold text-orange-600">
                      {calculationDetails.priority_calculation.result.toFixed(0)} points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Escalation Modal */}
      <EscalationModal
        caseId={caseId}
        caseName={caseData.external_ref || caseData.customer_name}
        isOpen={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        onSuccess={() => {
          fetchCaseDetails();
          setShowEscalationModal(false);
        }}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        caseId={caseId}
        currentStatus={caseData.status}
        caseName={caseData.external_ref || caseData.customer_name}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSuccess={() => {
          fetchCaseDetails();
          setShowStatusModal(false);
        }}
      />
    </div>
  );
}

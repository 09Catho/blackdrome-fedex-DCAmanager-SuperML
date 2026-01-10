// score_case Edge Function
// Computes AI/ML scores for a case: recovery probability, priority score, and reason codes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import model from '../../../ml/model.json' assert { type: 'json' };

interface CaseData {
  id: string;
  amount: number;
  ageing_days: number;
  status: string;
  assigned_dca_id: string | null;
}

interface ActivityStats {
  attempts_count: number;
  days_since_last_update: number;
  has_dispute: boolean;
  ptp_active: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { case_id } = await req.json();

    if (!case_id) {
      return new Response(
        JSON.stringify({ error: 'case_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch case data
    const { data: caseData, error: caseError } = await supabaseClient
      .from('cases')
      .select('id, amount, ageing_days, status, assigned_dca_id')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found', details: caseError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch activity stats
    const stats = await computeActivityStats(supabaseClient, case_id);

    // Compute features
    const features = computeFeatures(caseData, stats);

    // Compute linear combination (z-score)
    const contributions = {
      bias: model.bias,
      ageing: model.weights.ageing * features.ageing,
      log_amount: model.weights.log_amount * features.log_amount,
      attempts: model.weights.attempts * features.attempts,
      staleness: model.weights.staleness * features.staleness,
      dispute: model.weights.dispute * features.dispute,
      ptp_active: model.weights.ptp_active * features.ptp_active
    };

    const z = model.bias +
      contributions.ageing +
      contributions.log_amount +
      contributions.attempts +
      contributions.staleness +
      contributions.dispute +
      contributions.ptp_active;

    // Apply sigmoid activation
    const recovery_prob = sigmoid(z);

    const priority_score = computePriorityScore(
      caseData.amount,
      recovery_prob,
      caseData.ageing_days,
      stats.days_since_last_update
    );

    const reason_codes = computeReasonCodes(features, model);

    // Build detailed explanation
    const calculation_details = {
      case_data: {
        amount: caseData.amount,
        ageing_days: caseData.ageing_days,
        status: caseData.status
      },
      activity_stats: stats,
      features: features,
      model_calculation: {
        contributions: contributions,
        z_score: z,
        recovery_prob_before_sigmoid: z,
        recovery_prob_after_sigmoid: recovery_prob,
        formula: `sigmoid(${model.bias} + ${contributions.ageing.toFixed(3)} + ${contributions.log_amount.toFixed(3)} + ${contributions.attempts.toFixed(3)} + ${contributions.staleness.toFixed(3)} + ${contributions.dispute.toFixed(3)} + ${contributions.ptp_active.toFixed(3)})`
      },
      priority_calculation: {
        formula: `${caseData.amount} * ${recovery_prob.toFixed(4)} - 0.3 * ${caseData.ageing_days} - 0.2 * ${stats.days_since_last_update}`,
        result: priority_score
      }
    };

    // Update case with scores
    const { error: updateError } = await supabaseClient
      .from('cases')
      .update({
        recovery_prob_30d: recovery_prob,
        priority_score: priority_score,
        reason_codes: reason_codes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', case_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update case', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert audit record
    await supabaseClient.from('case_audit').insert({
      case_id,
      action: 'CASE_SCORED',
      after: {
        recovery_prob_30d: recovery_prob,
        priority_score: priority_score,
        reason_codes: reason_codes,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        case_id,
        recovery_prob_30d: recovery_prob,
        priority_score: priority_score,
        reason_codes: reason_codes,
        calculation_details: calculation_details,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function computeActivityStats(supabase: any, caseId: string): Promise<ActivityStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count contact attempts in last 30 days
  const { count: attemptsCount } = await supabase
    .from('case_activity')
    .select('*', { count: 'exact', head: true })
    .eq('case_id', caseId)
    .eq('activity_type', 'CONTACT_ATTEMPT')
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Get most recent activity
  const { data: lastActivity } = await supabase
    .from('case_activity')
    .select('created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const daysSinceLastUpdate = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Check for active dispute
  const { data: disputes } = await supabase
    .from('case_activity')
    .select('id')
    .eq('case_id', caseId)
    .eq('activity_type', 'DISPUTE_RAISED')
    .limit(1);

  // Check for active PTP
  const { data: ptps } = await supabase
    .from('case_activity')
    .select('id')
    .eq('case_id', caseId)
    .eq('activity_type', 'PTP_CREATED')
    .limit(1);

  return {
    attempts_count: attemptsCount || 0,
    days_since_last_update: daysSinceLastUpdate,
    has_dispute: (disputes?.length || 0) > 0,
    ptp_active: (ptps?.length || 0) > 0,
  };
}

function computeFeatures(caseData: CaseData, stats: ActivityStats) {
  return {
    ageing: Math.min(caseData.ageing_days / 120, 1), // normalized [0,1]
    log_amount: Math.log(1 + caseData.amount) / 10, // log scaled
    attempts: Math.min(stats.attempts_count / 10, 1), // normalized [0,1]
    staleness: Math.min(stats.days_since_last_update / 14, 1), // normalized [0,1]
    dispute: stats.has_dispute ? 1 : 0,
    ptp_active: stats.ptp_active ? 1 : 0,
  };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computePriorityScore(
  amount: number,
  recoveryProb: number,
  ageingDays: number,
  daysSinceUpdate: number
): number {
  // Priority = (amount * recovery_prob) - (0.3 * ageing) - (0.2 * staleness)
  return amount * recoveryProb - 0.3 * ageingDays - 0.2 * daysSinceUpdate;
}

function computeReasonCodes(features: any, model: any): string[] {
  // Compute contributions
  const contributions = [
    { name: 'ageing', value: Math.abs(model.weights.ageing * features.ageing), desc: model.reason_mappings.ageing },
    { name: 'log_amount', value: Math.abs(model.weights.log_amount * features.log_amount), desc: model.reason_mappings.log_amount },
    { name: 'attempts', value: Math.abs(model.weights.attempts * features.attempts), desc: model.reason_mappings.attempts },
    { name: 'staleness', value: Math.abs(model.weights.staleness * features.staleness), desc: model.reason_mappings.staleness },
    { name: 'dispute', value: Math.abs(model.weights.dispute * features.dispute), desc: model.reason_mappings.dispute },
    { name: 'ptp_active', value: Math.abs(model.weights.ptp_active * features.ptp_active), desc: model.reason_mappings.ptp_active },
  ];

  // Sort by contribution and take top 3
  contributions.sort((a, b) => b.value - a.value);
  return contributions.slice(0, 3).map((c) => c.desc);
}

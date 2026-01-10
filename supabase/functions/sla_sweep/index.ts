// sla_sweep Edge Function
// Scheduled function to check SLA breaches and escalate cases

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const now = new Date().toISOString();
    const processedCases: string[] = [];
    const errors: any[] = [];

    // Find cases with breached SLAs
    // Condition 1: sla_due_at is past
    const { data: slaBreach, error: slaError } = await supabaseClient
      .from('cases')
      .select('id, external_ref, sla_due_at')
      .not('status', 'eq', 'CLOSED')
      .not('sla_due_at', 'is', null)
      .lt('sla_due_at', now);

    if (slaError) {
      errors.push({ type: 'sla_due_query', error: slaError });
    }

    // Condition 2: next_action_due_at is past
    const { data: actionBreach, error: actionError } = await supabaseClient
      .from('cases')
      .select('id, external_ref, next_action_due_at')
      .not('status', 'eq', 'CLOSED')
      .not('next_action_due_at', 'is', null)
      .lt('next_action_due_at', now);

    if (actionError) {
      errors.push({ type: 'action_due_query', error: actionError });
    }

    // Combine unique case IDs
    const breachedCaseIds = new Set<string>();
    slaBreach?.forEach((c) => breachedCaseIds.add(c.id));
    actionBreach?.forEach((c) => breachedCaseIds.add(c.id));

    // Process each breached case
    for (const caseId of breachedCaseIds) {
      try {
        // Check if already marked as breached
        const { data: slaRecord } = await supabaseClient
          .from('case_sla')
          .select('breached, escalated')
          .eq('case_id', caseId)
          .single();

        if (!slaRecord) {
          // Create SLA record if missing
          await supabaseClient.from('case_sla').insert({
            case_id: caseId,
            breached: true,
            breached_at: now,
            breach_reason: 'SLA_TIMEOUT',
            escalated: true,
            escalated_at: now,
          });
        } else if (!slaRecord.breached) {
          // Mark as breached and escalated
          await supabaseClient
            .from('case_sla')
            .update({
              breached: true,
              breached_at: now,
              breach_reason: 'SLA_TIMEOUT',
              escalated: true,
              escalated_at: now,
              updated_at: now,
            })
            .eq('case_id', caseId);
        } else if (!slaRecord.escalated) {
          // Already breached, now escalate
          await supabaseClient
            .from('case_sla')
            .update({
              escalated: true,
              escalated_at: now,
              updated_at: now,
            })
            .eq('case_id', caseId);
        }

        // Update case status to ESCALATED (unless already CLOSED or RECOVERED)
        const { data: caseData } = await supabaseClient
          .from('cases')
          .select('status')
          .eq('id', caseId)
          .single();

        if (caseData && !['CLOSED', 'RECOVERED'].includes(caseData.status)) {
          await supabaseClient
            .from('cases')
            .update({
              status: 'ESCALATED',
              updated_at: now,
            })
            .eq('id', caseId);

          // Log activity
          await supabaseClient.from('case_activity').insert({
            case_id: caseId,
            actor_user_id: null,
            actor_role: 'fedex_admin',
            activity_type: 'STATUS_UPDATE',
            payload: {
              status: 'ESCALATED',
              reason: 'SLA_BREACH',
              escalated_at: now,
            },
          });

          // Log audit
          await supabaseClient.from('case_audit').insert({
            case_id: caseId,
            action: 'SLA_BREACHED',
            after: {
              status: 'ESCALATED',
              breach_reason: 'SLA_TIMEOUT',
            },
          });
        }

        processedCases.push(caseId);
      } catch (caseError) {
        errors.push({ case_id: caseId, error: caseError });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: processedCases.length,
        processed_cases: processedCases,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: now,
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

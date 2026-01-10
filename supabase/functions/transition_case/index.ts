// transition_case Edge Function
// Handles case status transitions with SOP validation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

// SOP: Allowed status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['VALIDATED'],
  VALIDATED: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['PTP', 'DISPUTE', 'ESCALATED'],
  PTP: ['RECOVERED', 'IN_PROGRESS'],
  DISPUTE: ['IN_PROGRESS', 'ESCALATED'],
  ESCALATED: ['CLOSED', 'IN_PROGRESS'],
  RECOVERED: ['CLOSED'],
};

interface TransitionPayload {
  case_id: string;
  new_status: string;
  actor_user_id?: string;
  actor_role?: string;
  metadata?: any;
}

Deno.serve(async (req) => {
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

    const payload: TransitionPayload = await req.json();
    const { case_id, new_status, actor_user_id, actor_role, metadata } = payload;

    if (!case_id || !new_status) {
      return new Response(
        JSON.stringify({ error: 'case_id and new_status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current case
    const { data: caseData, error: caseError } = await supabaseClient
      .from('cases')
      .select('*')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found', details: caseError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentStatus = caseData.status;

    // Validate transition
    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(new_status)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid status transition',
          current_status: currentStatus,
          new_status: new_status,
          allowed_transitions: ALLOWED_TRANSITIONS[currentStatus] || [],
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields per transition
    const validationError = validateTransitionRequirements(new_status, metadata, actor_role);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update
    const updateData: any = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    // Handle specific transitions
    if (new_status === 'RECOVERED') {
      updateData.closure_reason = 'RECOVERED';
      updateData.closed_at = new Date().toISOString();
      if (metadata?.payment_amount) {
        // Could track payment amount in metadata
      }
    }

    if (new_status === 'CLOSED') {
      updateData.closure_reason = metadata?.closure_reason || 'OTHER';
      updateData.closed_at = new Date().toISOString();
    }

    if (new_status === 'PTP' || new_status === 'IN_PROGRESS') {
      // Update next action due date
      const nextActionDue = new Date();
      nextActionDue.setDate(nextActionDue.getDate() + 2);
      updateData.next_action_due_at = nextActionDue.toISOString();
    }

    // Update case
    const { error: updateError } = await supabaseClient
      .from('cases')
      .update(updateData)
      .eq('id', case_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update case', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    const activityType = getActivityType(new_status, metadata);
    await supabaseClient.from('case_activity').insert({
      case_id,
      actor_user_id: actor_user_id || null,
      actor_role: actor_role || 'fedex_admin',
      activity_type: activityType,
      payload: {
        status: new_status,
        ...metadata,
      },
    });

    // Log audit
    await supabaseClient.from('case_audit').insert({
      case_id,
      actor_user_id: actor_user_id || null,
      action: 'STATUS_CHANGED',
      before: { status: currentStatus },
      after: { status: new_status, ...updateData },
    });

    return new Response(
      JSON.stringify({
        success: true,
        case_id,
        previous_status: currentStatus,
        new_status: new_status,
        message: 'Case transitioned successfully',
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

function validateTransitionRequirements(
  newStatus: string,
  metadata: any,
  actorRole?: string
): string | null {
  // ASSIGNED requires assigned_dca_id (already handled in allocate)
  
  // PTP requires ptp_date and ptp_amount
  if (newStatus === 'PTP') {
    if (!metadata?.ptp_date || !metadata?.ptp_amount) {
      return 'PTP transition requires ptp_date and ptp_amount in metadata';
    }
  }

  // RECOVERED requires payment info
  if (newStatus === 'RECOVERED') {
    if (!metadata?.payment_amount || !metadata?.payment_date) {
      return 'RECOVERED transition requires payment_amount and payment_date in metadata';
    }
  }

  // CLOSED requires closure_reason
  if (newStatus === 'CLOSED') {
    if (!metadata?.closure_reason) {
      return 'CLOSED transition requires closure_reason in metadata';
    }
    // Only FedEx users can close with WRITE_OFF
    if (metadata.closure_reason === 'WRITE_OFF' && actorRole?.startsWith('dca')) {
      return 'Only FedEx users can close cases with WRITE_OFF reason';
    }
  }

  return null;
}

function getActivityType(newStatus: string, metadata: any): string {
  if (newStatus === 'PTP') return 'PTP_CREATED';
  if (newStatus === 'DISPUTE') return 'DISPUTE_RAISED';
  if (newStatus === 'RECOVERED') return 'PAYMENT_LOGGED';
  return 'STATUS_UPDATE';
}

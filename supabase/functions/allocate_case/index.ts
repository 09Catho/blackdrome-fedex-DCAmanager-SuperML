// allocate_case Edge Function
// Automatically assigns a case to a DCA based on load balancing

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface DCALoad {
  dca_id: string;
  dca_name: string;
  region: string | null;
  active_cases: number;
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

    const { case_id } = await req.json();

    if (!case_id) {
      return new Response(
        JSON.stringify({ error: 'case_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch case
    const { data: caseData, error: caseError } = await supabaseClient
      .from('cases')
      .select('id, assigned_dca_id, status')
      .eq('id', case_id)
      .single();

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found', details: caseError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if already assigned
    if (caseData.assigned_dca_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Case already assigned',
          case_id,
          assigned_dca_id: caseData.assigned_dca_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find DCA with lowest active load
    const { data: dcaLoads, error: loadError } = await supabaseClient.rpc(
      'get_dca_loads'
    );

    if (loadError || !dcaLoads || dcaLoads.length === 0) {
      // Fallback: get all DCAs and compute load
      const { data: dcas } = await supabaseClient.from('dca').select('id, name, region');
      
      if (!dcas || dcas.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No DCAs available for allocation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Count active cases per DCA
      const loads: DCALoad[] = [];
      for (const dca of dcas) {
        const { count } = await supabaseClient
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_dca_id', dca.id)
          .not('status', 'in', '(CLOSED)');

        loads.push({
          dca_id: dca.id,
          dca_name: dca.name,
          region: dca.region,
          active_cases: count || 0,
        });
      }

      // Sort by active cases (lowest first)
      loads.sort((a, b) => a.active_cases - b.active_cases);
      const selectedDCA = loads[0];

      // Assign case to DCA
      const now = new Date().toISOString();
      const slaDueAt = new Date();
      slaDueAt.setDate(slaDueAt.getDate() + 7); // 7 days SLA
      const nextActionDueAt = new Date();
      nextActionDueAt.setDate(nextActionDueAt.getDate() + 2); // 2 days next action

      const { error: updateError } = await supabaseClient
        .from('cases')
        .update({
          assigned_dca_id: selectedDCA.dca_id,
          status: 'ASSIGNED',
          sla_due_at: slaDueAt.toISOString(),
          next_action_due_at: nextActionDueAt.toISOString(),
          updated_at: now,
        })
        .eq('id', case_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to assign case', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log activity
      await supabaseClient.from('case_activity').insert({
        case_id,
        actor_user_id: null,
        actor_role: 'fedex_admin',
        activity_type: 'STATUS_UPDATE',
        payload: {
          status: 'ASSIGNED',
          assigned_dca_id: selectedDCA.dca_id,
          assigned_dca_name: selectedDCA.dca_name,
        },
      });

      // Log audit
      await supabaseClient.from('case_audit').insert({
        case_id,
        action: 'CASE_ASSIGNED',
        after: {
          assigned_dca_id: selectedDCA.dca_id,
          status: 'ASSIGNED',
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          case_id,
          assigned_dca_id: selectedDCA.dca_id,
          assigned_dca_name: selectedDCA.dca_name,
          message: 'Case allocated successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unexpected error in allocation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

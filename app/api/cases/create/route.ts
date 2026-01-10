import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      external_ref,
      customer_name,
      amount,
      currency = 'INR',
      ageing_days,
      created_by,
    } = body;

    // Validate required fields
    if (!customer_name || !amount || ageing_days === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .insert({
        external_ref,
        customer_name,
        amount,
        currency,
        ageing_days,
        status: 'NEW',
        created_by,
      })
      .select()
      .single();

    if (caseError) {
      return NextResponse.json(
        { error: 'Failed to create case', details: caseError },
        { status: 500 }
      );
    }

    // Call score_case Edge Function
    const scoringUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/score_case`;
    await fetch(scoringUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ case_id: caseData.id }),
    });

    // Call allocate_case Edge Function
    const allocationUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/allocate_case`;
    await fetch(allocationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ case_id: caseData.id }),
    });

    return NextResponse.json({
      success: true,
      case: caseData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

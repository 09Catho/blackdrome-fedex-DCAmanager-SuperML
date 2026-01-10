// API route to create user profile (uses service role to bypass RLS)
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { user_id, full_name, role, dca_id } = await request.json();

    if (!user_id || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating profile for user:', user_id);

    // Insert profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user_id,
        full_name: full_name,
        role: role,
        dca_id: dca_id
      })
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('Profile created successfully:', data);

    return NextResponse.json({
      success: true,
      profile: data
    });

  } catch (error: any) {
    console.error('Error in create-profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

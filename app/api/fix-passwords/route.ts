// Fix user passwords using Supabase Admin API
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user IDs
    const { data: users, error: listError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('full_name', ['FedEx Admin', 'DCA Agent']);

    if (listError) throw listError;

    const results = [];

    for (const user of users || []) {
      // Update password using Admin API
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'password123' }
      );

      results.push({
        name: user.full_name,
        id: user.id,
        success: !error,
        error: error?.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Passwords updated',
      results
    });

  } catch (error: any) {
    console.error('Error fixing passwords:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}

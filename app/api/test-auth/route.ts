// Test if service role key is working
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    console.log('Testing service role key...');
    console.log('URL:', supabaseUrl);
    console.log('Key starts with:', supabaseServiceKey?.substring(0, 20) + '...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test 1: Can we query the database?
    const { data: dcaData, error: dcaError } = await supabase
      .from('dca')
      .select('*')
      .limit(1);

    console.log('DCA query result:', dcaData, dcaError);

    // Test 2: Can we list users?
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    console.log('Users list result:', usersData?.users?.length, usersError);

    return NextResponse.json({
      success: true,
      tests: {
        database: { success: !dcaError, error: dcaError?.message },
        auth: { success: !usersError, userCount: usersData?.users?.length, error: usersError?.message }
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}

// FINAL SOLUTION: Create demo users using Supabase Admin API
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('\n=== CREATING DEMO USERS ===\n');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseServiceKey || supabaseServiceKey.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing service role key' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const users = [
      { email: 'admin@fedex.com', password: 'password123', name: 'FedEx Admin', role: 'fedex_admin', dca_id: null },
      { email: 'agent@dca1.com', password: 'password123', name: 'DCA Agent', role: 'dca_agent', dca_id: '11111111-1111-1111-1111-111111111111' }
    ];

    const created = [];

    for (const userData of users) {
      console.log(`\nCreating user: ${userData.email}`);
      
      // Create user with Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { full_name: userData.name }
      });

      if (error) {
        // If user exists, try to get their ID and update profile
        if (error.message.includes('already registered')) {
          console.log(`User ${userData.email} already exists, skipping...`);
          continue;
        }
        console.error(`Error creating ${userData.email}:`, error);
        return NextResponse.json(
          { success: false, error: `Failed to create ${userData.email}: ${error.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ Auth user created: ${data.user.id}`);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: userData.name,
          role: userData.role,
          dca_id: userData.dca_id
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
        return NextResponse.json(
          { success: false, error: `Failed to create profile: ${profileError.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ Profile created for ${userData.email}`);

      created.push({
        email: userData.email,
        id: data.user.id,
        role: userData.role
      });
    }

    console.log('\n=== SUCCESS ===\n');

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} users successfully`,
      users: created,
      credentials: {
        admin: { email: 'admin@fedex.com', password: 'password123' },
        agent: { email: 'agent@dca1.com', password: 'password123' }
      }
    });

  } catch (error: any) {
    console.error('\n=== ERROR ===');
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

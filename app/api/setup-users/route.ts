// FINAL FIX: Create users using Supabase Admin API
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

async function createUsersHandler() {
  console.log('=== Starting user creation ===');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Creating users with Supabase Admin API...');
    
    const usersToCreate = [
      {
        email: 'admin@fedex.com',
        password: 'password123',
        full_name: 'FedEx Admin',
        role: 'fedex_admin',
        dca_id: null
      },
      {
        email: 'agent@dca1.com',
        password: 'password123',
        full_name: 'DCA Agent',
        role: 'dca_agent',
        dca_id: '11111111-1111-1111-1111-111111111111'
      }
    ];
    
    const results = [];

    // Create FedEx Admin
    console.log('Creating FedEx Admin...');
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@fedex.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'FedEx Admin'
      }
    });

    if (adminError) {
      console.error('Error creating admin:', adminError);
      throw adminError;
    }

    console.log('✅ FedEx Admin created:', adminUser.user.id);

    // Create profile for admin
    const { error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUser.user.id,
        full_name: 'FedEx Admin',
        role: 'fedex_admin',
        dca_id: null
      });

    if (adminProfileError) {
      console.error('Error creating admin profile:', adminProfileError);
      throw adminProfileError;
    }

    // Create DCA Agent
    console.log('Creating DCA Agent...');
    const { data: agentUser, error: agentError } = await supabaseAdmin.auth.admin.createUser({
      email: 'agent@dca1.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'DCA Agent 1'
      }
    });

    if (agentError) {
      console.error('Error creating agent:', agentError);
      throw agentError;
    }

    console.log('✅ DCA Agent created:', agentUser.user.id);

    // Create profile for agent
    const { error: agentProfileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: agentUser.user.id,
        full_name: 'DCA Agent 1',
        role: 'dca_agent',
        dca_id: '11111111-1111-1111-1111-111111111111' // Premier Recovery Solutions
      });

    if (agentProfileError) {
      console.error('Error creating agent profile:', agentProfileError);
      throw agentProfileError;
    }

    return NextResponse.json({
      success: true,
      message: 'Users created successfully',
      users: {
        admin: {
          id: adminUser.user.id,
          email: adminUser.user.email
        },
        agent: {
          id: agentUser.user.id,
          email: agentUser.user.email
        }
      }
    });

  } catch (error: any) {
    console.error('Error creating users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error
      },
      { status: 500 }
    );
  }
}

// Export GET handler (for browser access)
export async function GET() {
  return createUsersHandler();
}

// Export POST handler (for API calls)
export async function POST() {
  return createUsersHandler();
}

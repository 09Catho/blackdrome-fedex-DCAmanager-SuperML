// Clean up manually created users before using Admin API
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all existing users with these emails from profiles and auth
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .or('full_name.eq.FedEx Admin,full_name.eq.DCA Agent 1');

    if (profilesError) {
      console.error('Error deleting profiles:', profilesError);
    }

    // Use raw SQL to delete from auth tables
    const { error: authError } = await supabase.rpc('delete_auth_users', {
      emails: ['admin@fedex.com', 'agent@dca1.com']
    });

    if (authError) {
      console.error('Error with RPC:', authError);
      // Try direct approach
      await supabase.auth.admin.listUsers().then(async ({ data }) => {
        if (data?.users) {
          for (const user of data.users) {
            if (user.email === 'admin@fedex.com' || user.email === 'agent@dca1.com') {
              await supabase.auth.admin.deleteUser(user.id);
              console.log(`Deleted user: ${user.email}`);
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup complete'
    });

  } catch (error: any) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}

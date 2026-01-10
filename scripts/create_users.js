// Root Fix: Create users using Supabase Admin API
// This is the PROPER way to create authenticated users

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUsers() {
  console.log('Creating users with Supabase Admin API...\n');

  try {
    // Delete existing users first
    console.log('Cleaning up existing users...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    for (const user of existingUsers.users) {
      if (user.email === 'admin@fedex.com' || user.email === 'agent@dca1.com') {
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`Deleted existing user: ${user.email}`);
      }
    }

    // Create FedEx Admin
    console.log('\nCreating FedEx Admin...');
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
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
    const { error: adminProfileError } = await supabase
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

    console.log('✅ FedEx Admin profile created');

    // Create DCA Agent
    console.log('\nCreating DCA Agent...');
    const { data: agentUser, error: agentError } = await supabase.auth.admin.createUser({
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
    const { error: agentProfileError } = await supabase
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

    console.log('✅ DCA Agent profile created');

    // Verify users
    console.log('\n=== Verification ===');
    const { data: verifyUsers } = await supabase.auth.admin.listUsers();
    
    const admin = verifyUsers.users.find(u => u.email === 'admin@fedex.com');
    const agent = verifyUsers.users.find(u => u.email === 'agent@dca1.com');

    console.log('\nFedEx Admin:');
    console.log('  Email:', admin?.email);
    console.log('  ID:', admin?.id);
    console.log('  Confirmed:', admin?.email_confirmed_at ? '✅' : '❌');

    console.log('\nDCA Agent:');
    console.log('  Email:', agent?.email);
    console.log('  ID:', agent?.id);
    console.log('  Confirmed:', agent?.email_confirmed_at ? '✅' : '❌');

    // Check profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [admin?.id, agent?.id]);

    console.log('\n=== Profiles Created ===');
    profiles?.forEach(p => {
      console.log(`\n${p.full_name}:`);
      console.log('  Role:', p.role);
      console.log('  DCA ID:', p.dca_id || 'None (FedEx)');
    });

    console.log('\n🎉 SUCCESS! Users created with Supabase Admin API');
    console.log('\n📝 Login Credentials:');
    console.log('  Admin: admin@fedex.com / password123');
    console.log('  Agent: agent@dca1.com / password123');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

createUsers();

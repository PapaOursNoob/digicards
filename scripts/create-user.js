import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  const email = process.env.CREATE_USER_EMAIL;
  const password = process.env.CREATE_USER_PASSWORD;

  if (!email || !password) {
    console.error('Missing CREATE_USER_EMAIL or CREATE_USER_PASSWORD in .env');
    process.exit(1);
  }

  console.log(`Creating user: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: process.env.CREATE_USER_FULL_NAME || '' }
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('User already exists. Updating password...');
      // Find user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find(u => u.email === email);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, { password });
        console.log('Password updated successfully.');
      }
    } else {
      console.error('Error creating user:', error.message);
      process.exit(1);
    }
  } else {
    console.log('User created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
  }
}

createUser();

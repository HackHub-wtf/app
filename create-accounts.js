#!/usr/bin/env node

/**
 * Create test accounts using Supabase Auth API
 * This is the proper     console.log('\n🎉 Test accounts setup complete!')
    console.log('\nLogin credentials:')
    console.log('👑 Admin: admin@example.com / password (Master access to everything)')
    console.log('👨‍💼 Manager: manager@example.com / password (Can manage own hackathons)')
    console.log('👤 User: user@example.com / password (Team leader permissions)')
    console.log('\n🔐 Role-based access control implemented!')
    console.log('- Admin: Full system access')
    console.log('- Manager: Own hackathons only')
    console.log('- User: Team management only')
    console.log('\n🚀 Next step: Run "npm run seed-data" to add sample hackathons and teams!')o create accounts that can actually log in
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '.env.local') })

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestAccounts() {
  console.log('🚀 Creating test accounts...\n')

  try {
    // Create admin account
    console.log('Creating admin account...')
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo Admin' }
    })

    if (adminError) {
      console.log('⚠️  Admin account might already exist:', adminError.message)
    } else {
      console.log('✅ Admin account created:', adminData.user.email)
      
      // Update admin role
      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminData.user.id)
    }

    // Create manager account
    console.log('Creating manager account...')
    const { data: managerData, error: managerError } = await supabase.auth.admin.createUser({
      email: 'manager@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo Manager' }
    })

    if (managerError) {
      console.log('⚠️  Manager account might already exist:', managerError.message)
    } else {
      console.log('✅ Manager account created:', managerData.user.email)
      
      // Update manager role
      await supabase
        .from('profiles')
        .update({ role: 'manager' })
        .eq('id', managerData.user.id)
    }

    // Create user account (previously participant)
    console.log('Creating user account...')
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo User' }
    })

    if (userError) {
      console.log('⚠️  User account might already exist:', userError.message)
    } else {
      console.log('✅ User account created:', userData.user.email)
      
      // Update user role (make sure it's set to 'user')
      await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', userData.user.id)
    }

    console.log('\n🎉 Test accounts setup complete!')
    console.log('\nLogin credentials:')
    console.log('👨‍💼 Manager: manager@example.com / password')
    console.log('👤 User: user@example.com / password')
    console.log('\n� Next step: Run "npm run seed-data" to add sample hackathons and teams!')
    
  } catch (error) {
    console.error('❌ Error creating accounts:', error.message)
  }
}

createTestAccounts()

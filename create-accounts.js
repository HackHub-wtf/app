#!/usr/bin/env node

/**
 * Create test accounts using Supabase Auth API
 * This is the proper way to create accounts that can actually log in
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

    // Create participant account
    console.log('Creating participant account...')
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo User' }
    })

    if (userError) {
      console.log('⚠️  User account might already exist:', userError.message)
    } else {
      console.log('✅ Participant account created:', userData.user.email)
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

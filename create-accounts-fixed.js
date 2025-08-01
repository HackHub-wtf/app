#!/usr/bin/env node

/**
 * Create test accounts with organizations using Supabase Auth API
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
  console.log('🚀 Creating test accounts with organizations...\n')

  try {
    // Create admin account using regular signup
    console.log('Creating admin account...')
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'password'
    })

    let adminId = null
    if (adminError) {
      console.log('⚠️  Admin account might already exist:', adminError.message)
      // Get existing admin
      const { data: existingAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'admin@example.com')
        .single()
      if (existingAdmin) {
        adminId = existingAdmin.id
        console.log('✅ Found existing admin account')
      }
    } else if (adminData.user) {
      console.log('✅ Admin account created:', adminData.user.email)
      adminId = adminData.user.id
      
      // Create profile manually if needed
      await supabase
        .from('profiles')
        .upsert({
          id: adminData.user.id,
          email: 'admin@example.com',
          name: 'Demo Admin',
          role: 'admin'
        })
    }

    // Create manager account
    console.log('Creating manager account...')
    const { data: managerData, error: managerError } = await supabase.auth.signUp({
      email: 'manager@example.com',
      password: 'password'
    })

    let acmeOrgId = null
    let managerId = null
    
    if (managerError) {
      console.log('⚠️  Manager account might already exist:', managerError.message)
      // Get existing manager
      const { data: existingManager } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'manager@example.com')
        .single()
      if (existingManager) {
        managerId = existingManager.id
        console.log('✅ Found existing manager account')
      }
    } else if (managerData.user) {
      console.log('✅ Manager account created:', managerData.user.email)
      managerId = managerData.user.id
      
      // Create profile manually if needed
      await supabase
        .from('profiles')
        .upsert({
          id: managerData.user.id,
          email: 'manager@example.com',
          name: 'Demo Manager',
          role: 'manager'
        })
    }

    if (managerId) {
      // Create Acme Corporation (always try to create)
      console.log('Creating Acme Corporation...')
      const { data: acmeOrg, error: acmeOrgError } = await supabase
        .from('organizations')
        .upsert([{ 
          name: 'Acme Corporation',
          slug: 'acme-corp',
          description: 'A technology consulting company'
        }], { onConflict: 'slug' })
        .select()
        .single()

      if (!acmeOrgError && acmeOrg) {
        acmeOrgId = acmeOrg.id
        console.log('✅ Acme Corporation ready')

        // Create organization membership
        await supabase
          .from('organization_members')
          .upsert([{
            organization_id: acmeOrg.id,
            user_id: managerId,
            role: 'owner',
          }], { onConflict: 'organization_id,user_id' })

        // Update manager profile with organization
        await supabase
          .from('profiles')
          .update({ 
            role: 'manager',
            organization_id: acmeOrg.id 
          })
          .eq('id', managerId)
      }
    }

    // Create user account (participant)
    console.log('Creating user account...')
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: 'user@example.com',
      password: 'password'
    })

    let userId = null
    
    if (userError) {
      console.log('⚠️  User account might already exist:', userError.message)
      // Get existing user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'user@example.com')
        .single()
      if (existingUser) {
        userId = existingUser.id
        console.log('✅ Found existing user account')
      }
    } else if (userData.user) {
      console.log('✅ User account created:', userData.user.email)
      userId = userData.user.id
      
      // Create profile manually if needed
      await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: 'user@example.com',
          name: 'Demo User',
          role: 'participant'
        })
    }

    if (userId) {
      // Create TechStart Inc (always try to create)
      console.log('Creating TechStart Inc...')
      const { data: techOrg, error: techOrgError } = await supabase
        .from('organizations')
        .upsert([{ 
          name: 'TechStart Inc',
          slug: 'techstart',
          description: 'An innovative startup accelerator'
        }], { onConflict: 'slug' })
        .select()
        .single()

      if (!techOrgError && techOrg) {
        console.log('✅ TechStart Inc ready')

        // Create organization membership
        await supabase
          .from('organization_members')
          .upsert([{
            organization_id: techOrg.id,
            user_id: userId,
            role: 'owner',
          }], { onConflict: 'organization_id,user_id' })

        // Update user profile with organization
        await supabase
          .from('profiles')
          .update({ 
            role: 'participant',
            organization_id: techOrg.id 
          })
          .eq('id', userId)
      }
    }

    console.log('\n🎉 Test accounts with organizations setup complete!')
    console.log('\nLogin credentials:')
    console.log('👑 Admin: admin@example.com / password (Global access)')
    console.log('👨‍💼 Manager: manager@example.com / password (Acme Corp owner)')
    console.log('👤 Participant: user@example.com / password (TechStart owner)')
    
    console.log('\n🏢 Organizations created:')
    console.log('• Acme Corporation (acme-corp)')
    console.log('• TechStart Inc (techstart)')
    
    console.log('\n🔐 Organization-based access control implemented!')
    console.log('- Admin: Full system access')
    console.log('- Manager: Acme Corp management')
    console.log('- Participant: TechStart owner (can create hackathons)')
    
    console.log('\n🚀 Next step: Run "npm run seed-data" to add sample hackathons!')

  } catch (error) {
    console.error('❌ Error creating accounts:', error)
    process.exit(1)
  }
}

// Run the script
createTestAccounts()

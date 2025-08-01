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
// Use the service role key from the container/status output
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

console.log('🔑 Using service role key for admin operations')
console.log('🌐 Connecting to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestAccounts() {
  console.log('🚀 Creating test accounts with organizations...\n')

  try {
    // Create admin account
    console.log('Creating admin account...')
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo Admin' }
    })

    let adminId = null
    if (adminError) {
      console.log('⚠️  Admin account creation failed:', adminError.message)
      console.log('Full admin error:', adminError)
      // Get existing admin
      const { data: existingAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'admin@example.com')
        .single()
      if (existingAdmin) {
        adminId = existingAdmin.id
        console.log('✅ Found existing admin profile')
      }
    } else {
      console.log('✅ Admin auth user created:', adminData.user.email)
      adminId = adminData.user.id
      
      // Manually create profile since we removed the trigger
      console.log('Creating admin profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: adminData.user.id,
          email: adminData.user.email,
          name: 'Demo Admin',
          role: 'admin'
        }])
      
      if (profileError) {
        console.log('❌ Error creating admin profile:', profileError.message)
      } else {
        console.log('✅ Admin profile created')
      }
    }

    // Create manager account
    console.log('Creating manager account...')
    const { data: managerData, error: managerError } = await supabase.auth.admin.createUser({
      email: 'manager@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo Manager' }
    })

    let acmeOrgId = null
    let managerId = null
    
    if (managerError) {
      console.log('⚠️  Manager account creation failed:', managerError.message)
      console.log('Full manager error:', managerError)
      // Get existing manager
      const { data: existingManager } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'manager@example.com')
        .single()
      if (existingManager) {
        managerId = existingManager.id
        console.log('✅ Found existing manager profile')
      }
    } else {
      console.log('✅ Manager auth user created:', managerData.user.email)
      managerId = managerData.user.id
      
      // Manually create profile since we removed the trigger
      console.log('Creating manager profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: managerData.user.id,
          email: managerData.user.email,
          name: 'Demo Manager',
          role: 'manager'
        }])
      
      if (profileError) {
        console.log('❌ Error creating manager profile:', profileError.message)
        console.log('Full profile error:', profileError)
      } else {
        console.log('✅ Manager profile created')
      }
    }

    if (managerId) {
      // Create Acme Corporation (always try to create)
      console.log('Creating Acme Corporation...')
      const { data: acmeOrg, error: acmeOrgError } = await supabase
        .from('organizations')
        .insert([{ 
          name: 'Acme Corporation',
          slug: 'acme-corp',
          description: 'A leading technology company focused on innovation.',
          created_by: managerId,
        }])
        .select()
        .single()

      if (acmeOrgError) {
        console.log('❌ Error creating Acme Corporation:', acmeOrgError.message)
        console.log('Full error:', acmeOrgError)
      } else if (acmeOrg) {
        acmeOrgId = acmeOrg.id
        console.log('✅ Acme Corporation created')

        // Add manager as organization owner
        await supabase
          .from('organization_members')
          .insert([{ 
            organization_id: acmeOrg.id,
            user_id: managerId,
            role: 'owner',
          }])

        // Update manager profile with organization
        await supabase
          .from('profiles')
          .update({ 
            organization_id: acmeOrg.id 
          })
          .eq('id', managerId)
      }
    }

    // Create user account (participant)
    console.log('Creating user account...')
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: { name: 'Demo User' }
    })

    let userId = null
    
    if (userError) {
      console.log('⚠️  User account creation failed:', userError.message)
      console.log('Full user error:', userError)
      // Get existing user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'user@example.com')
        .single()
      if (existingUser) {
        userId = existingUser.id
        console.log('✅ Found existing user profile')
      }
    } else {
      console.log('✅ User auth user created:', userData.user.email)
      userId = userData.user.id
      
      // Manually create profile since we removed the trigger
      console.log('Creating user profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userData.user.id,
          email: userData.user.email,
          name: 'Demo User',
          role: 'participant'
        }])
      
      if (profileError) {
        console.log('❌ Error creating user profile:', profileError.message)
        console.log('Full profile error:', profileError)
      } else {
        console.log('✅ User profile created')
      }
    }

    if (userId) {
      // Create TechStart Inc (always try to create)
      console.log('Creating TechStart Inc...')
      const { data: techOrg, error: techOrgError } = await supabase
        .from('organizations')
        .insert([{ 
          name: 'TechStart Inc',
          slug: 'techstart',
          description: 'Startup accelerating the future of technology.',
          created_by: userId,
        }])
        .select()
        .single()

      if (techOrgError) {
        console.log('❌ Error creating TechStart Inc:', techOrgError.message)
        console.log('Full error:', techOrgError)
      } else if (techOrg) {
        console.log('✅ TechStart Inc created')

        // Add user as organization owner (they created it)
        await supabase
          .from('organization_members')
          .insert([{ 
            organization_id: techOrg.id,
            user_id: userId,
            role: 'owner',
          }])

        // Update user profile with organization (but keep as participant)
        await supabase
          .from('profiles')
          .update({ 
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
    console.error('❌ Error creating accounts:', error.message)
    console.error(error)
  }
}

createTestAccounts()
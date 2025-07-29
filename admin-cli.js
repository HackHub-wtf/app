#!/usr/bin/env node

/**
 * Hackathon Platform CLI Admin Tool
 * Manage administrators and perform system operations
 * Usage: node admin-cli.js [command] [options]
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import readline from 'readline'
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
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY not found in environment')
  console.error('Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// CLI Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

class AdminCLI {
  async main() {
    console.log('🚀 Hackathon Platform - Admin CLI Tool')
    console.log('=====================================\n')

    while (true) {
      console.log('Available commands:')
      console.log('1. 👥 List all users')
      console.log('2. 🔑 Promote user to admin/manager')
      console.log('3. ⬇️  Demote user to participant')
      console.log('4. ➕ Create admin user')
      console.log('5. 📊 Show platform statistics')
      console.log('6. 🗑️  Delete user (careful!)')
      console.log('7. 🔄 Reset user password')
      console.log('8. 📧 Send system notification')
      console.log('9. 🧹 Cleanup old data')
      console.log('0. ❌ Exit\n')

      const choice = await question('Enter your choice (0-9): ')

      try {
        switch (choice) {
          case '1':
            await this.listUsers()
            break
          case '2':
            await this.promoteUser()
            break
          case '3':
            await this.demoteUser()
            break
          case '4':
            await this.createAdmin()
            break
          case '5':
            await this.showStats()
            break
          case '6':
            await this.deleteUser()
            break
          case '7':
            await this.resetPassword()
            break
          case '8':
            await this.sendNotification()
            break
          case '9':
            await this.cleanupData()
            break
          case '0':
            console.log('👋 Goodbye!')
            rl.close()
            return
          default:
            console.log('❌ Invalid choice. Please try again.\n')
        }
      } catch (error) {
        console.error('❌ Error:', error.message)
      }

      console.log('\n' + '='.repeat(50) + '\n')
    }
  }

  async listUsers() {
    console.log('📋 Fetching all users...\n')
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    if (profiles.length === 0) {
      console.log('No users found.')
      return
    }

    console.log('Current users:')
    console.log('──────────────────────────────────────────────────────────────')
    profiles.forEach((profile, index) => {
      const roleEmoji = {
        'admin': '👑',
        'manager': '👨‍💼',
        'participant': '👤'
      }[profile.role] || '❓'

      console.log(`${index + 1}. ${roleEmoji} ${profile.name || 'No name'} (${profile.email})`)
      console.log(`   Role: ${profile.role.toUpperCase()}`)
      console.log(`   ID: ${profile.id}`)
      console.log(`   Created: ${new Date(profile.created_at).toLocaleDateString()}`)
      console.log('')
    })
  }

  async promoteUser() {
    const email = await question('Enter user email to promote: ')
    if (!email) {
      console.log('❌ Email is required')
      return
    }

    console.log('Available roles:')
    console.log('1. 👑 admin - Full system access')
    console.log('2. 👨‍💼 manager - Can create/manage hackathons')
    
    const roleChoice = await question('Choose role (1-2): ')
    const role = roleChoice === '1' ? 'admin' : roleChoice === '2' ? 'manager' : null

    if (!role) {
      console.log('❌ Invalid role choice')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('email', email)
      .select()

    if (error) {
      throw new Error(`Failed to promote user: ${error.message}`)
    }

    if (data.length === 0) {
      console.log('❌ User not found')
      return
    }

    console.log(`✅ Successfully promoted ${email} to ${role}`)
  }

  async demoteUser() {
    const email = await question('Enter user email to demote to participant: ')
    if (!email) {
      console.log('❌ Email is required')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'participant' })
      .eq('email', email)
      .select()

    if (error) {
      throw new Error(`Failed to demote user: ${error.message}`)
    }

    if (data.length === 0) {
      console.log('❌ User not found')
      return
    }

    console.log(`✅ Successfully demoted ${email} to participant`)
  }

  async createAdmin() {
    console.log('🔑 Creating new admin user...\n')
    
    const email = await question('Enter admin email: ')
    const password = await question('Enter admin password: ')
    const name = await question('Enter admin name: ')

    if (!email || !password || !name) {
      console.log('❌ All fields are required')
      return
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    // Update profile to admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        name: name
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.warn(`⚠️  User created but failed to set admin role: ${profileError.message}`)
      console.log('You may need to manually promote this user.')
    } else {
      console.log(`✅ Successfully created admin user: ${email}`)
    }
  }

  async showStats() {
    console.log('📊 Platform Statistics\n')

    // Get user counts by role
    const { data: userStats } = await supabase
      .from('profiles')
      .select('role')

    const roleCounts = userStats?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {}) || {}

    // Get hackathon counts by status
    const { data: hackathonStats } = await supabase
      .from('hackathons')
      .select('status')

    const hackathonCounts = hackathonStats?.reduce((acc, hackathon) => {
      acc[hackathon.status] = (acc[hackathon.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get other counts
    const { count: teamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    const { count: ideasCount } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })

    console.log('👥 Users by Role:')
    console.log(`   👑 Admins: ${roleCounts.admin || 0}`)
    console.log(`   👨‍💼 Managers: ${roleCounts.manager || 0}`)
    console.log(`   👤 Participants: ${roleCounts.participant || 0}`)
    console.log(`   📊 Total Users: ${userStats?.length || 0}\n`)

    console.log('🏆 Hackathons by Status:')
    console.log(`   📝 Draft: ${hackathonCounts.draft || 0}`)
    console.log(`   🟢 Open: ${hackathonCounts.open || 0}`)
    console.log(`   🏃 Running: ${hackathonCounts.running || 0}`)
    console.log(`   ✅ Completed: ${hackathonCounts.completed || 0}`)
    console.log(`   📊 Total Hackathons: ${hackathonStats?.length || 0}\n`)

    console.log('📈 Other Metrics:')
    console.log(`   👥 Total Teams: ${teamsCount || 0}`)
    console.log(`   💡 Total Ideas: ${ideasCount || 0}`)
  }

  async deleteUser() {
    console.log('⚠️  WARNING: This will permanently delete the user and all their data!')
    const email = await question('Enter user email to delete: ')
    if (!email) {
      console.log('❌ Email is required')
      return
    }

    const confirm = await question('Type "DELETE" to confirm: ')
    if (confirm !== 'DELETE') {
      console.log('❌ Operation cancelled')
      return
    }

    // Get user ID first
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      console.log('❌ User not found')
      return
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(profile.id)

    if (authError) {
      throw new Error(`Failed to delete user: ${authError.message}`)
    }

    console.log(`✅ Successfully deleted user: ${email}`)
  }

  async resetPassword() {
    const email = await question('Enter user email to reset password: ')
    if (!email) {
      console.log('❌ Email is required')
      return
    }

    const newPassword = await question('Enter new password: ')
    if (!newPassword) {
      console.log('❌ Password is required')
      return
    }

    // Get user ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!profile) {
      console.log('❌ User not found')
      return
    }

    const { error } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword
    })

    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`)
    }

    console.log(`✅ Successfully reset password for: ${email}`)
  }

  async sendNotification() {
    console.log('📧 Send System Notification\n')
    
    const type = await question('Send to (1) specific user or (2) all users? ')
    let userIds = []

    if (type === '1') {
      const email = await question('Enter user email: ')
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (!profile) {
        console.log('❌ User not found')
        return
      }
      userIds = [profile.id]
    } else if (type === '2') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')

      userIds = profiles?.map(p => p.id) || []
    } else {
      console.log('❌ Invalid choice')
      return
    }

    const title = await question('Enter notification title: ')
    const message = await question('Enter notification message: ')
    const notificationType = await question('Enter type (info/success/warning/error): ') || 'info'

    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: notificationType,
      read: false
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      throw new Error(`Failed to send notifications: ${error.message}`)
    }

    console.log(`✅ Successfully sent notification to ${userIds.length} user(s)`)
  }

  async cleanupData() {
    console.log('🧹 Data Cleanup Options:\n')
    console.log('1. Delete old notifications (older than 30 days)')
    console.log('2. Delete completed hackathons (older than 90 days)')
    console.log('3. Clear all read notifications')
    
    const choice = await question('Choose cleanup option (1-3): ')

    switch (choice) {
      case '1':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { error: notifError } = await supabase
          .from('notifications')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())

        if (notifError) throw new Error(notifError.message)
        console.log('✅ Deleted old notifications')
        break

      case '2':
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        
        const { error: hackError } = await supabase
          .from('hackathons')
          .delete()
          .eq('status', 'completed')
          .lt('created_at', ninetyDaysAgo.toISOString())

        if (hackError) throw new Error(hackError.message)
        console.log('✅ Deleted old completed hackathons')
        break

      case '3':
        const { error: readError } = await supabase
          .from('notifications')
          .delete()
          .eq('read', true)

        if (readError) throw new Error(readError.message)
        console.log('✅ Deleted all read notifications')
        break

      default:
        console.log('❌ Invalid choice')
    }
  }
}

// Run the CLI
const cli = new AdminCLI()
cli.main().catch(console.error)

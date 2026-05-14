import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function resetDatabase() {
  console.log('🗑️  Resetting database...')
  
  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting team_chat_messages...')
    await supabase.from('team_chat_messages').delete().neq('id', 'null')
    
    console.log('Deleting idea_votes...')
    await supabase.from('idea_votes').delete().neq('id', 'null')
    
    console.log('Deleting ideas...')
    await supabase.from('ideas').delete().neq('id', 'null')
    
    console.log('Deleting team_members...')
    await supabase.from('team_members').delete().neq('id', 'null')
    
    console.log('Deleting teams...')
    await supabase.from('teams').delete().neq('id', 'null')
    
    console.log('Deleting hackathon_participants...')
    await supabase.from('hackathon_participants').delete().neq('id', 'null')
    
    console.log('Deleting hackathons...')
    await supabase.from('hackathons').delete().neq('id', 'null')
    
    console.log('Deleting profiles (keeping auth users)...')
    await supabase.from('profiles').delete().neq('id', 'null')
    
    console.log('✅ Database reset complete!')
    console.log('📝 Note: You may need to re-run create-accounts.js to recreate user profiles')
    
  } catch (error) {
    console.error('❌ Error resetting database:', error)
  }
}

resetDatabase()

#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables. Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function applyRLSPolicies() {
  console.log('Applying RLS policies for user management...')
  
  const sqlCommands = [
    // Drop existing restrictive policies first
    `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;`,
    
    // Allow admins to insert new profiles
    `CREATE POLICY "Admins can create profiles" ON public.profiles FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );`,
    
    // Allow managers to insert new profiles (but not admin roles)
    `CREATE POLICY "Managers can create non-admin profiles" ON public.profiles FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
      AND NEW.role != 'admin'
    );`,
    
    // Allow users to update their own profile
    `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);`,
    
    // Allow admins to update any profile
    `CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );`,
    
    // Allow managers to update profiles of users in their hackathons
    `CREATE POLICY "Managers can update team member profiles" ON public.profiles FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
      AND (
        -- Allow updating own profile
        id = (SELECT auth.uid())
        OR
        -- Allow updating profiles of users in manager's hackathons
        EXISTS (
          SELECT 1 FROM public.team_members tm
          JOIN public.teams t ON tm.team_id = t.id
          JOIN public.hackathons h ON t.hackathon_id = h.id
          WHERE tm.user_id = profiles.id 
          AND h.created_by = (SELECT auth.uid())
        )
      )
    );`,
    
    // Allow admins to delete any profile (except their own)
    `CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
      AND id != (SELECT auth.uid())
    );`
  ]
  
  for (const sql of sqlCommands) {
    try {
      console.log('Executing:', sql.substring(0, 50) + '...')
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.error('Error:', error.message)
      } else {
        console.log('✅ Success')
      }
    } catch (err) {
      console.error('Failed to execute SQL:', err.message)
    }
  }
  
  console.log('RLS policies application completed!')
}

applyRLSPolicies().catch(console.error)

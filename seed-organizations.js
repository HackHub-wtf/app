// Seed data for the organization-based system
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // 1. Create demo users first
    console.log('👤 Creating demo users...')
    
    // Admin user
    const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password',
      email_confirm: true,
    })
    
    if (adminError) {
      console.error('Error creating admin user:', adminError)
      throw adminError
    }

    // Insert admin profile
    await supabase.from('profiles').insert([{
      id: adminAuth.user.id,
      email: 'admin@example.com',
      name: 'System Admin',
      role: 'admin',
    }])

    // Manager user
    const { data: managerAuth, error: managerError } = await supabase.auth.admin.createUser({
      email: 'manager@example.com',
      password: 'password',
      email_confirm: true,
    })
    
    if (managerError) {
      console.error('Error creating manager user:', managerError)
      throw managerError
    }

    // Regular user
    const { data: userAuth, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@example.com',
      password: 'password',
      email_confirm: true,
    })
    
    if (userError) {
      console.error('Error creating regular user:', userError)
      throw userError
    }

    // 2. Create organizations
    console.log('🏢 Creating organizations...')
    
    const { data: acmeOrg, error: acmeOrgError } = await supabase
      .from('organizations')
      .insert([{
        name: 'Acme Corporation',
        slug: 'acme-corp',
        description: 'A leading technology company focused on innovation and growth.',
        created_by: managerAuth.user.id,
      }])
      .select()
      .single()

    if (acmeOrgError) {
      console.error('Error creating Acme organization:', acmeOrgError)
      throw acmeOrgError
    }

    const { data: techOrg, error: techOrgError } = await supabase
      .from('organizations')
      .insert([{
        name: 'TechStart Inc',
        slug: 'techstart',
        description: 'Startup accelerating the future of technology.',
        created_by: userAuth.user.id,
      }])
      .select()
      .single()

    if (techOrgError) {
      console.error('Error creating TechStart organization:', techOrgError)
      throw techOrgError
    }

    // 3. Create organization memberships
    console.log('👥 Creating organization memberships...')
    
    await supabase.from('organization_members').insert([
      {
        organization_id: acmeOrg.id,
        user_id: managerAuth.user.id,
        role: 'owner',
      },
      {
        organization_id: techOrg.id,
        user_id: userAuth.user.id,
        role: 'owner',
      },
    ])

    // 4. Update user profiles with organization references
    console.log('🔗 Updating user profiles...')
    
    await supabase.from('profiles').insert([
      {
        id: managerAuth.user.id,
        email: 'manager@example.com',
        name: 'John Manager',
        role: 'manager',
        organization_id: acmeOrg.id,
      },
      {
        id: userAuth.user.id,
        email: 'user@example.com',
        name: 'Jane Participant',
        role: 'participant',
        organization_id: techOrg.id,
      },
    ])

    // 5. Create sample hackathons
    console.log('🚀 Creating sample hackathons...')
    
    const { data: hackathon1, error: hack1Error } = await supabase
      .from('hackathons')
      .insert([{
        title: 'Acme Innovation Challenge 2025',
        description: 'Build the next big innovation for our customers. Focus on AI, sustainability, and user experience.',
        start_date: '2025-09-01T09:00:00Z',
        end_date: '2025-09-03T18:00:00Z',
        registration_key: 'ACME2025',
        status: 'open',
        max_team_size: 5,
        allowed_participants: 100,
        current_participants: 0,
        created_by: managerAuth.user.id,
        organization_id: acmeOrg.id,
        prizes: ['$10,000 Grand Prize', '$5,000 Second Place', '$2,500 Third Place'],
        tags: ['AI', 'Sustainability', 'UX'],
      }])
      .select()
      .single()

    if (hack1Error) {
      console.error('Error creating hackathon 1:', hack1Error)
      throw hack1Error
    }

    const { data: hackathon2, error: hack2Error } = await supabase
      .from('hackathons')
      .insert([{
        title: 'TechStart Future Builders',
        description: 'Create revolutionary solutions for tomorrow\'s problems. Open to all innovative minds.',
        start_date: '2025-10-15T10:00:00Z',
        end_date: '2025-10-17T20:00:00Z',
        registration_key: 'TECHSTART2025',
        status: 'draft',
        max_team_size: 4,
        allowed_participants: 50,
        current_participants: 0,
        created_by: userAuth.user.id,
        organization_id: techOrg.id,
        prizes: ['$5,000 Grand Prize', '$2,500 Innovation Award'],
        tags: ['Innovation', 'Future Tech', 'Startup'],
      }])
      .select()
      .single()

    if (hack2Error) {
      console.error('Error creating hackathon 2:', hack2Error)
      throw hack2Error
    }

    // 6. Create sample teams
    console.log('👨‍👩‍👧‍👦 Creating sample teams...')
    
    const { data: team1, error: team1Error } = await supabase
      .from('teams')
      .insert([{
        name: 'AI Innovators',
        description: 'Leveraging artificial intelligence for sustainable solutions.',
        hackathon_id: hackathon1.id,
        created_by: managerAuth.user.id,
        skills: ['AI/ML', 'Python', 'React'],
      }])
      .select()
      .single()

    if (team1Error) {
      console.error('Error creating team 1:', team1Error)
      throw team1Error
    }

    // Add team members
    await supabase.from('team_members').insert([
      {
        team_id: team1.id,
        user_id: managerAuth.user.id,
        role: 'leader',
      },
    ])

    // 7. Create sample ideas
    console.log('💡 Creating sample ideas...')
    
    await supabase.from('ideas').insert([
      {
        title: 'EcoTrack - Carbon Footprint AI Assistant',
        description: 'An AI-powered mobile app that tracks and suggests ways to reduce your carbon footprint using smart recommendations.',
        hackathon_id: hackathon1.id,
        team_id: team1.id,
        created_by: managerAuth.user.id,
        category: 'Sustainability',
        tags: ['AI', 'Environment', 'Mobile'],
        status: 'submitted',
      },
      {
        title: 'Smart City Traffic Optimizer',
        description: 'ML algorithm that optimizes traffic light timing in real-time to reduce congestion and emissions.',
        hackathon_id: hackathon1.id,
        created_by: managerAuth.user.id,
        category: 'Smart Cities',
        tags: ['ML', 'IoT', 'Traffic'],
        status: 'draft',
      },
    ])

    console.log('✅ Database seeding completed successfully!')
    console.log('\n📋 Demo Account Summary:')
    console.log('👑 Admin: admin@example.com | password (Global access)')
    console.log('👨‍💼 Manager: manager@example.com | password (Acme Corp owner)')
    console.log('👤 Participant: user@example.com | password (TechStart owner)')
    console.log('\n🏢 Organizations:')
    console.log('• Acme Corporation (acme-corp) - Managed by John Manager')
    console.log('• TechStart Inc (techstart) - Managed by Jane Participant')
    console.log('\n🚀 Hackathons:')
    console.log('• Acme Innovation Challenge 2025 (OPEN)')
    console.log('• TechStart Future Builders (DRAFT)')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('\n🎉 Ready to test the organization-based system!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

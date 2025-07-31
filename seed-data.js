import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Use service role for seeding

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log('🌱 Seeding database with sample data...')

  try {
    // Get the manager and user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    const manager = profiles.find(p => p.email === 'manager@example.com')
    const user = profiles.find(p => p.email === 'user@example.com')

    if (!manager || !user) {
      console.error('❌ Manager or user profile not found. Make sure to run create-accounts first.')
      return
    }

    console.log('👤 Found profiles:', { manager: manager.name, user: user.name })

    // 1. Create a sample hackathon
    console.log('🏆 Creating sample hackathon...')
    const { data: hackathon, error: hackathonError } = await supabase
      .from('hackathons')
      .insert([
        {
          title: 'AI Innovation Challenge 2025',
          description: 'Build the next generation of AI applications that solve real-world problems. Focus on sustainability, healthcare, education, or social impact.',
          registration_key: 'AI2025',
          created_by: manager.id,
          start_date: '2025-08-15T09:00:00Z',
          end_date: '2025-08-17T18:00:00Z',
          max_team_size: 5,
          allowed_participants: 50,
          status: 'open',
          rules: 'Teams must submit working prototypes with documentation. All code must be original or properly attributed.',
          prizes: ['$10,000 + Mentorship Program', '$5,000 + Cloud Credits', '$2,500 + Development Tools'],
          tags: ['AI', 'Innovation', 'Technology', 'Sustainability']
        }
      ])
      .select()
      .single()

    if (hackathonError) {
      console.error('❌ Error creating hackathon:', hackathonError)
      return
    }

    console.log('✅ Created hackathon:', hackathon.title)

    // 2. Create sample teams
    console.log('👥 Creating sample teams...')
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .insert([
        {
          name: 'EcoSmart Solutions',
          description: 'Developing AI-powered sustainability tools for smart cities',
          hackathon_id: hackathon.id,
          created_by: manager.id
        },
        {
          name: 'HealthTech Innovators',
          description: 'Building AI diagnostic tools for early disease detection',
          hackathon_id: hackathon.id,
          created_by: user.id
        },
        {
          name: 'EduAI Collective',
          description: 'Creating personalized learning experiences with AI',
          hackathon_id: hackathon.id,
          created_by: manager.id
        }
      ])
      .select()

    if (teamsError) {
      console.error('❌ Error creating teams:', teamsError)
      return
    }

    console.log('✅ Created teams:', teams.map(t => t.name).join(', '))

    // 4. Add team members
    console.log('👨‍👩‍👧‍👦 Adding team members...')
    await supabase
      .from('team_members')
      .insert([
        { team_id: teams[0].id, user_id: manager.id, role: 'leader' },
        { team_id: teams[1].id, user_id: user.id, role: 'member' }
      ])

    console.log('✅ Added team members')

    // 3. Create sample ideas
    console.log('💡 Creating sample ideas...')
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .insert([
        {
          title: 'Smart Waste Management System',
          description: 'AI-powered system that optimizes waste collection routes and predicts bin fill levels using IoT sensors and machine learning.',
          hackathon_id: hackathon.id,
          created_by: manager.id,
          category: 'Sustainability',
          tags: ['AI', 'IoT', 'Sustainability', 'Smart Cities']
        },
        {
          title: 'Medical Image Analysis Platform',
          description: 'Deep learning platform for analyzing medical images to assist radiologists in early detection of diseases.',
          hackathon_id: hackathon.id,
          created_by: user.id,
          category: 'Healthcare',
          tags: ['AI', 'Healthcare', 'Deep Learning', 'Medical']
        },
        {
          title: 'Adaptive Learning Assistant',
          description: 'Personalized AI tutor that adapts to individual learning styles and provides customized educational content.',
          hackathon_id: hackathon.id,
          created_by: manager.id,
          category: 'Education',
          tags: ['AI', 'Education', 'Machine Learning', 'Personalization']
        }
      ])
      .select()

    if (ideasError) {
      console.error('❌ Error creating ideas:', ideasError)
      return
    }

    console.log('✅ Created ideas:', ideas.map(i => i.title).join(', '))

    // 6. Add some votes to ideas
    console.log('🗳️ Adding sample votes...')
    await supabase
      .from('idea_votes')
      .insert([
        { idea_id: ideas[0].id, user_id: user.id },
        { idea_id: ideas[1].id, user_id: manager.id },
        { idea_id: ideas[0].id, user_id: manager.id }
      ])

    console.log('✅ Added sample votes')

    // 7. Add sample chat messages
    console.log('💬 Adding sample chat messages...')
    await supabase
      .from('chat_messages')
      .insert([
        {
          team_id: teams[0].id,
          user_id: manager.id,
          content: 'Welcome to EcoSmart Solutions! Let\'s discuss our project approach.'
        },
        {
          team_id: teams[0].id,
          user_id: manager.id,
          content: 'I think we should focus on the IoT sensor integration first, then work on the AI optimization algorithms.'
        },
        {
          team_id: teams[1].id,
          user_id: user.id,
          content: 'Hey team! Excited to work on the medical image analysis platform. Has anyone worked with medical imaging data before?'
        }
      ])

    console.log('✅ Added sample chat messages')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`✅ 1 Hackathon: "${hackathon.title}"`)
    console.log(`✅ ${teams.length} Teams`)
    console.log(`✅ ${ideas.length} Ideas`)
    console.log(`✅ Sample votes and chat messages`)
    console.log('\n🚀 You can now test the application with real data!')
    console.log('\n🔑 Login with:')
    console.log('👨‍💼 Manager: manager@example.com / password')
    console.log('👤 User: user@example.com / password')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

seedData()

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
          registration_key: 'HACKHUB2025',
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

    // 2. Create sample teams with skills
    console.log('👥 Creating sample teams...')
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .insert([
        {
          name: 'EcoSmart Solutions',
          description: 'Developing AI-powered sustainability tools for smart cities using IoT sensors and machine learning to optimize resource usage.',
          hackathon_id: hackathon.id,
          created_by: manager.id,
          skills: ['AI/ML', 'IoT', 'Python', 'React', 'Node.js'],
          is_open: true
        },
        {
          name: 'HealthTech Innovators',
          description: 'Building AI diagnostic tools for early disease detection using deep learning and medical imaging analysis.',
          hackathon_id: hackathon.id,
          created_by: user.id,
          skills: ['AI/ML', 'Python', 'TensorFlow', 'React', 'Data Science'],
          is_open: false
        },
        {
          name: 'EduAI Collective',
          description: 'Creating personalized learning experiences with AI that adapts to individual student needs and learning patterns.',
          hackathon_id: hackathon.id,
          created_by: manager.id,
          skills: ['AI/ML', 'JavaScript', 'React', 'Node.js', 'UI/UX'],
          is_open: true
        },
        {
          name: 'FinTech Disruptors',
          description: 'Revolutionizing financial services with blockchain and AI for secure, transparent, and accessible financial solutions.',
          hackathon_id: hackathon.id,
          created_by: user.id,
          skills: ['Blockchain', 'AI/ML', 'Solidity', 'React', 'Security'],
          is_open: true
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
        // Team 1: EcoSmart Solutions - Manager as leader
        { team_id: teams[0].id, user_id: manager.id, role: 'leader' },
        // Team 2: HealthTech Innovators - User as leader (since they created it)
        { team_id: teams[1].id, user_id: user.id, role: 'leader' },
        // Team 3: EduAI Collective - Manager as leader (since they created it)
        { team_id: teams[2].id, user_id: manager.id, role: 'leader' },
        // Team 4: FinTech Disruptors - User as leader (since they created it)
        { team_id: teams[3].id, user_id: user.id, role: 'leader' }
      ])

    console.log('✅ Added team members - all teams now have leaders')

    // 3. Create sample ideas with complete project data
    console.log('💡 Creating sample ideas with project data...')
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .insert([
        {
          title: 'Smart Waste Management System',
          description: 'AI-powered system that optimizes waste collection routes and predicts bin fill levels using IoT sensors and machine learning. The system analyzes historical data, weather patterns, and real-time sensor data to create optimal collection schedules, reducing costs and environmental impact.',
          hackathon_id: hackathon.id,
          team_id: teams[0].id, // Assign to EcoSmart Solutions
          created_by: manager.id,
          category: 'AI/Machine Learning',
          tags: ['AI', 'IoT', 'Sustainability', 'Smart Cities', 'Machine Learning'],
          status: 'in-progress',
          repository_url: 'https://github.com/HackHub-wtf/app/tree/main',
          demo_url: 'https://hackhub.wtf',
          project_attachments: JSON.stringify([
            {
              id: 'eco-1',
              type: 'screenshot',
              title: 'Dashboard Overview',
              description: 'Main dashboard showing real-time waste bin status and AI-powered route optimization',
              url: 'https://hackhub.wtf/assets/black_banner.svg',
              display_order: 0
            },
            {
              id: 'eco-2',
              type: 'video',
              title: 'System Demo',
              description: 'Live demonstration of the AI routing algorithm in action',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              display_order: 1
            },
            {
              id: 'eco-3',
              type: 'document',
              title: 'Technical Architecture',
              description: 'Comprehensive system architecture and ML model documentation',
              url: 'https://docs.google.com/document/d/1eco-tech-architecture',
              display_order: 2
            }
          ])
        },
        {
          title: 'Medical Image Analysis Platform',
          description: 'Deep learning platform for analyzing medical images to assist radiologists in early detection of diseases. Uses convolutional neural networks and transfer learning to identify anomalies in X-rays, CT scans, and MRIs with high accuracy.',
          hackathon_id: hackathon.id,
          team_id: teams[1].id, // Assign to HealthTech Innovators
          created_by: user.id,
          category: 'AI/Machine Learning',
          tags: ['AI', 'Healthcare', 'Deep Learning', 'Medical', 'Computer Vision'],
          status: 'submitted',
          repository_url: 'https://github.com/HackHub-wtf/app/tree/main',
          demo_url: 'https://hackhub.wtf',
          project_attachments: JSON.stringify([
            {
              id: 'med-1',
              type: 'screenshot',
              title: 'AI Analysis Interface',
              description: 'Medical image upload and analysis interface with real-time diagnosis',
              url: 'https://hackhub.wtf/assets/black_banner.svg',
              display_order: 0
            },
            {
              id: 'med-2',
              type: 'dataset',
              title: 'Training Dataset',
              description: 'Anonymized medical images dataset used for model training',
              url: 'https://drive.google.com/drive/folders/medical-dataset-samples',
              display_order: 1
            },
            {
              id: 'med-3',
              type: 'research',
              title: 'Research Paper',
              description: 'Published research on AI applications in medical diagnostics',
              url: 'https://arxiv.org/abs/2025.medical-ai-diagnostics',
              display_order: 2
            },
            {
              id: 'med-4',
              type: 'model',
              title: 'Pre-trained Model',
              description: 'Download our trained CNN model for medical image analysis',
              url: 'https://huggingface.co/healthtech/medical-cnn-v2',
              display_order: 3
            }
          ])
        },
        {
          title: 'Adaptive Learning Assistant',
          description: 'Personalized AI tutor that adapts to individual learning styles and provides customized educational content. Uses natural language processing and machine learning to understand student needs and deliver personalized learning experiences.',
          hackathon_id: hackathon.id,
          team_id: teams[2].id, // Assign to EduAI Collective
          created_by: manager.id,
          category: 'AI/Machine Learning',
          tags: ['AI', 'Education', 'Machine Learning', 'Personalization', 'NLP'],
          status: 'in-progress',
          repository_url: 'https://github.com/HackHub-wtf/app/tree/main',
          demo_url: 'https://hackhub.wtf',
          project_attachments: JSON.stringify([
            {
              id: 'edu-1',
              type: 'screenshot',
              title: 'Learning Dashboard',
              description: 'Student progress tracking and personalized learning path visualization',
              url: 'https://hackhub.wtf/assets/black_banner.svg',
              display_order: 0
            },
            {
              id: 'edu-2',
              type: 'prototype',
              title: 'Interactive Prototype',
              description: 'Full interactive Figma prototype of the learning interface',
              url: 'https://figma.com/proto/eduai-learning-assistant',
              display_order: 1
            },
            {
              id: 'edu-3',
              type: 'api',
              title: 'API Documentation',
              description: 'Complete API documentation for the learning platform',
              url: 'https://api.eduai.com/docs',
              display_order: 2
            }
          ])
        },
        {
          title: 'DeFi Portfolio Optimizer',
          description: 'Blockchain-based portfolio optimization platform that uses AI to analyze DeFi protocols and suggest optimal yield farming strategies. Includes risk assessment, automated rebalancing, and smart contract integration.',
          hackathon_id: hackathon.id,
          team_id: teams[3].id, // Assign to FinTech Disruptors
          created_by: user.id,
          category: 'Blockchain',
          tags: ['Blockchain', 'DeFi', 'AI', 'Smart Contracts', 'Finance'],
          status: 'draft',
          repository_url: 'https://github.com/HackHub-wtf/app/tree/main',
          demo_url: 'https://hackhub.wtf',
          project_attachments: JSON.stringify([
            {
              id: 'defi-1',
              type: 'screenshot',
              title: 'Portfolio Dashboard',
              description: 'DeFi portfolio management dashboard with real-time analytics',
              url: 'https://hackhub.wtf/assets/black_banner.svg',
              display_order: 0
            },
            {
              id: 'defi-2',
              type: 'smart_contract',
              title: 'Smart Contract Code',
              description: 'Solidity contracts for automated portfolio rebalancing',
              url: 'https://etherscan.io/address/0x123456789abcdef',
              display_order: 1
            },
            {
              id: 'defi-3',
              type: 'whitepaper',
              title: 'Technical Whitepaper',
              description: 'Comprehensive technical specifications and tokenomics',
              url: 'https://ipfs.io/ipfs/QmDefiWhitepaperHash',
              display_order: 2
            },
            {
              id: 'defi-4',
              type: 'simulation',
              title: 'Backtesting Results',
              description: 'Historical performance simulation and risk analysis',
              url: 'https://sheets.google.com/defi-backtesting-results',
              display_order: 3
            }
          ])
        }
      ])
      .select()

    if (ideasError) {
      console.error('❌ Error creating ideas:', ideasError)
      return
    }

    console.log('✅ Created ideas:', ideas.map(i => i.title).join(', '))

    // 6. Set up voting criteria for the hackathon
    console.log('🎯 Setting up voting criteria...')
    const { data: votingCriteria, error: criteriaError } = await supabase
      .from('voting_criteria')
      .insert([
        {
          hackathon_id: hackathon.id,
          name: 'Innovation & Creativity',
          description: 'How innovative and creative is the solution? Does it bring fresh ideas or novel approaches?',
          weight: 30,
          display_order: 1
        },
        {
          hackathon_id: hackathon.id,
          name: 'Technical Implementation',
          description: 'Quality of code, architecture, and technical execution. Is it well-built and scalable?',
          weight: 25,
          display_order: 2
        },
        {
          hackathon_id: hackathon.id,
          name: 'Impact & Potential',
          description: 'Real-world impact and potential for adoption. Could this solve meaningful problems?',
          weight: 25,
          display_order: 3
        },
        {
          hackathon_id: hackathon.id,
          name: 'Presentation Quality',
          description: 'How well is the idea communicated? Quality of demo, pitch, and documentation.',
          weight: 20,
          display_order: 4
        }
      ])
      .select()

    if (criteriaError) {
      console.error('❌ Error creating voting criteria:', criteriaError)
      return
    }

    console.log('✅ Created voting criteria:', votingCriteria.map(c => c.name).join(', '))

    // 7. Add detailed scores for ideas using the new flexible voting system
    console.log('🗳️ Adding sample detailed scores...')
    const scoreData = [
      // User scoring idea 1 (EcoSmart Solutions - Smart Waste Management)
      { idea_id: ideas[0].id, user_id: user.id, criteria_id: votingCriteria[0].id, score: 9 }, // Innovation
      { idea_id: ideas[0].id, user_id: user.id, criteria_id: votingCriteria[1].id, score: 7 }, // Technical
      { idea_id: ideas[0].id, user_id: user.id, criteria_id: votingCriteria[2].id, score: 8 }, // Impact
      { idea_id: ideas[0].id, user_id: user.id, criteria_id: votingCriteria[3].id, score: 6 }, // Presentation
      
      // Manager scoring idea 1 (EcoSmart Solutions)
      { idea_id: ideas[0].id, user_id: manager.id, criteria_id: votingCriteria[0].id, score: 8 },
      { idea_id: ideas[0].id, user_id: manager.id, criteria_id: votingCriteria[1].id, score: 9 },
      { idea_id: ideas[0].id, user_id: manager.id, criteria_id: votingCriteria[2].id, score: 9 },
      { idea_id: ideas[0].id, user_id: manager.id, criteria_id: votingCriteria[3].id, score: 7 },

      // Manager scoring idea 2 (HealthTech - Medical Image Analysis)
      { idea_id: ideas[1].id, user_id: manager.id, criteria_id: votingCriteria[0].id, score: 10 },
      { idea_id: ideas[1].id, user_id: manager.id, criteria_id: votingCriteria[1].id, score: 8 },
      { idea_id: ideas[1].id, user_id: manager.id, criteria_id: votingCriteria[2].id, score: 10 },
      { idea_id: ideas[1].id, user_id: manager.id, criteria_id: votingCriteria[3].id, score: 8 },

      // User scoring idea 2 (HealthTech - Medical Image Analysis)
      { idea_id: ideas[1].id, user_id: user.id, criteria_id: votingCriteria[0].id, score: 9 },
      { idea_id: ideas[1].id, user_id: user.id, criteria_id: votingCriteria[1].id, score: 9 },
      { idea_id: ideas[1].id, user_id: user.id, criteria_id: votingCriteria[2].id, score: 9 },
      { idea_id: ideas[1].id, user_id: user.id, criteria_id: votingCriteria[3].id, score: 7 },

      // User scoring idea 3 (EduAI - Adaptive Learning Assistant)
      { idea_id: ideas[2].id, user_id: user.id, criteria_id: votingCriteria[0].id, score: 7 },
      { idea_id: ideas[2].id, user_id: user.id, criteria_id: votingCriteria[1].id, score: 6 },
      { idea_id: ideas[2].id, user_id: user.id, criteria_id: votingCriteria[2].id, score: 8 },
      { idea_id: ideas[2].id, user_id: user.id, criteria_id: votingCriteria[3].id, score: 9 },

      // Manager scoring idea 3 (EduAI - Adaptive Learning Assistant)
      { idea_id: ideas[2].id, user_id: manager.id, criteria_id: votingCriteria[0].id, score: 8 },
      { idea_id: ideas[2].id, user_id: manager.id, criteria_id: votingCriteria[1].id, score: 7 },
      { idea_id: ideas[2].id, user_id: manager.id, criteria_id: votingCriteria[2].id, score: 7 },
      { idea_id: ideas[2].id, user_id: manager.id, criteria_id: votingCriteria[3].id, score: 8 },

      // User scoring idea 4 (FinTech - DeFi Portfolio Optimizer)
      { idea_id: ideas[3].id, user_id: user.id, criteria_id: votingCriteria[0].id, score: 10 },
      { idea_id: ideas[3].id, user_id: user.id, criteria_id: votingCriteria[1].id, score: 8 },
      { idea_id: ideas[3].id, user_id: user.id, criteria_id: votingCriteria[2].id, score: 7 },
      { idea_id: ideas[3].id, user_id: user.id, criteria_id: votingCriteria[3].id, score: 6 },

      // Manager scoring idea 4 (FinTech - DeFi Portfolio Optimizer)
      { idea_id: ideas[3].id, user_id: manager.id, criteria_id: votingCriteria[0].id, score: 9 },
      { idea_id: ideas[3].id, user_id: manager.id, criteria_id: votingCriteria[1].id, score: 9 },
      { idea_id: ideas[3].id, user_id: manager.id, criteria_id: votingCriteria[2].id, score: 6 },
      { idea_id: ideas[3].id, user_id: manager.id, criteria_id: votingCriteria[3].id, score: 5 }
    ]

    await supabase
      .from('idea_scores')
      .insert(scoreData)

    console.log('✅ Added detailed scoring data')

    // Note: The calculate_idea_scores() function will automatically update total_score and vote_count

    // 8. Add sample chat messages with project context
    console.log('💬 Adding sample chat messages...')
    await supabase
      .from('chat_messages')
      .insert([
        // EcoSmart Solutions team chat
        {
          team_id: teams[0].id,
          user_id: manager.id,
          content: 'Welcome to EcoSmart Solutions! 🌱 Let\'s build something amazing for sustainable waste management.'
        },
        {
          team_id: teams[0].id,
          user_id: manager.id,
          content: 'I\'ve pushed the initial IoT sensor simulation to our GitHub repo. Check out the `/sensors` directory for the sensor data models.'
        },
        {
          team_id: teams[0].id,
          user_id: manager.id,
          content: 'Next steps: 1) Complete the ML route optimization algorithm 2) Build the React dashboard 3) Test with demo data'
        },
        
        // HealthTech Innovators team chat
        {
          team_id: teams[1].id,
          user_id: user.id,
          content: 'Hey team! 🏥 Excited to work on the medical image analysis platform. The deep learning model is showing promising results!'
        },
        {
          team_id: teams[1].id,
          user_id: user.id,
          content: 'I\'ve uploaded our CNN model weights to the repository. The accuracy on test data is currently at 94.2% for X-ray anomaly detection.'
        },
        {
          team_id: teams[1].id,
          user_id: user.id,
          content: 'Demo deployment is live! Check it out at medical-ai-demo.netlify.app - you can upload sample X-rays to test the analysis.'
        },
        
        // EduAI Collective team chat
        {
          team_id: teams[2].id,
          user_id: manager.id,
          content: '📚 EduAI team assemble! Our adaptive learning platform is taking shape. The NLP components are working great.'
        },
        {
          team_id: teams[2].id,
          user_id: manager.id,
          content: 'The personalization algorithm is adapting well to different learning styles. We should focus on the UI/UX for our final presentation.'
        },
        
        // FinTech Disruptors team chat
        {
          team_id: teams[3].id,
          user_id: user.id,
          content: '💰 DeFi team! Our smart contracts are deployed on testnet. The portfolio optimization algorithm is calculating yield strategies correctly.'
        },
        {
          team_id: teams[3].id,
          user_id: user.id,
          content: 'Risk assessment module is complete. Next: integrate with the frontend dashboard and add real-time price feeds from Chainlink oracles.'
        }
      ])

    console.log('✅ Added sample chat messages')

    // 9. Add sample hackathon participants
    console.log('👥 Adding hackathon participants...')
    await supabase
      .from('hackathon_participants')
      .insert([
        {
          hackathon_id: hackathon.id,
          user_id: manager.id,
          joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        {
          hackathon_id: hackathon.id,
          user_id: user.id,
          joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        }
      ])

    console.log('✅ Added hackathon participants')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`✅ 1 Hackathon: "${hackathon.title}"`)
    console.log(`✅ ${teams.length} Teams with skills and project data`)
    console.log(`✅ ${ideas.length} Ideas with complete project information`)
    console.log(`✅ Repository URLs, demo links, and project attachments`)
    console.log(`✅ Detailed voting criteria and scores`)
    console.log(`✅ Team chat messages and participant data`)
    console.log('\n🚀 You can now test the application with comprehensive data!')
    console.log('\n🔑 Login with:')
    console.log('👨‍💼 Manager: manager@example.com / password')
    console.log('👤 User: user@example.com / password')
    console.log('\n💡 Features to test:')
    console.log('• Create teams with project attachments')
    console.log('• View project repositories and demo links')
    console.log('• Team collaboration (chat, file sharing)')
    console.log('• Idea voting with detailed criteria')
    console.log('• Project status tracking')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

seedData()

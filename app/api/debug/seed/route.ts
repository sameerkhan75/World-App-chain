import { IPFSDataService } from "@/lib/ipfs-service"
import { NextRequest, NextResponse } from "next/server"

// Different demo communities for different users to test isolation
const getUserDemoCommunities = (userDisplayName: string) => {
  const normalizedName = userDisplayName.toLowerCase().trim()
  
  if (normalizedName === 'alice') {
    return [
      { name: 'Alice\'s Reading Club', description: 'Book discussions and reviews' },
      { name: 'Science Fiction', description: 'Sci-fi books and movies' },
      { name: 'Fantasy Worlds', description: 'Fantasy literature discussions' }
    ]
  } else if (normalizedName === 'bob') {
    return [
      { name: 'Bob\'s Tech Hub', description: 'Technology news and discussions' },
      { name: 'Programming Tips', description: 'Coding tutorials and tips' },
      { name: 'Web Development', description: 'Frontend and backend development' }
    ]
  } else {
    return [
      { name: `${userDisplayName}'s Community`, description: `Personal community for ${userDisplayName}` },
      { name: 'General Discussion', description: 'General topics and conversations' },
      { name: 'Announcements', description: 'Important updates and news' }
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting user-specific data seeding...')
    
    const { user_id, user_display_name } = await request.json()
    
    // Use provided user info or defaults for demo
    const userId = user_id || 'demo-user'
    const userDisplayName = user_display_name || 'Demo User'

    console.log('👤 Creating communities for user:', userDisplayName)

    // Get user-specific demo communities
    const userCommunities = getUserDemoCommunities(userDisplayName)
    
    // Create each demo community for this specific user
    const createdCommunities = []
    for (const communityData of userCommunities) {
      try {
        console.log(`🏗️ Creating community for ${userDisplayName}: ${communityData.name}`)
        const community = await IPFSDataService.createCommunity(
          communityData.name,
          communityData.description,
          userId,
          userDisplayName // This ensures user-specific data storage
        )
        createdCommunities.push(community)
        console.log(`✅ Created: ${community.name} (${community.id})`)
      } catch (error) {
        console.error(`❌ Failed to create ${communityData.name}:`, error)
      }
    }

    console.log(`✅ Seeding completed for ${userDisplayName}`)
    
    return NextResponse.json({
      message: `Demo data seeded successfully for ${userDisplayName}`,
      user: userDisplayName,
      communitiesCreated: createdCommunities.length,
      communities: createdCommunities.map(c => ({ id: c.id, name: c.name }))
    })
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    return NextResponse.json({ 
      error: "Failed to seed data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to seed demo data",
    note: "Include user_id and user_display_name in request body, or defaults will be used"
  })
}

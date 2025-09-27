import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
import { NextResponse } from "next/server"

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

export async function POST() {
  try {
    console.log('🌱 Starting user-specific data seeding...')
    
    // Get current user for creating communities
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - please log in first" }, { status: 401 })
    }

    console.log('👤 User authenticated:', user.display_name)

    // Get user-specific demo communities
    const userCommunities = getUserDemoCommunities(user.display_name)
    
    // Create each demo community for this specific user
    const createdCommunities = []
    for (const communityData of userCommunities) {
      try {
        console.log(`🏗️ Creating community for ${user.display_name}: ${communityData.name}`)
        const community = await IPFSDataService.createCommunity(
          communityData.name,
          communityData.description,
          user.id,
          user.display_name // This ensures user-specific data storage
        )
        createdCommunities.push(community)
        console.log(`✅ Created: ${community.name} (${community.id})`)
      } catch (error) {
        console.error(`❌ Failed to create ${communityData.name}:`, error)
      }
    }

    console.log(`✅ Seeding completed for ${user.display_name}`)
    
    return NextResponse.json({
      message: `Demo data seeded successfully for ${user.display_name}`,
      user: user.display_name,
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
    note: "You must be logged in to seed data"
  })
}

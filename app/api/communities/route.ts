import { IPFSDataService } from "@/lib/ipfs-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Communities are global, not user-specific
    console.log('📋 Fetching global communities')
    const communities = await IPFSDataService.getCommunities()
    console.log('📋 Retrieved communities:', communities.map(c => ({ id: c.id, name: c.name })))
    return NextResponse.json({ communities })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, user_id, user_display_name } = await request.json()

    // Validate user information is provided
    if (!user_id || !user_display_name) {
      return NextResponse.json({ error: "User information required" }, { status: 400 })
    }

    console.log('🏗️ Creating global community for user:', user_display_name)
    const community = await IPFSDataService.createCommunity(name, description, user_id, user_display_name)
    return NextResponse.json({ community })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

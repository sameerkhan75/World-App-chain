import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
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
    const { name, description } = await request.json()

    // Get the current user
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🏗️ Creating global community for user:', user.display_name)
    const community = await IPFSDataService.createCommunity(name, description, user.id, user.display_name)
    return NextResponse.json({ community })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const communities = await IPFSDataService.getCommunities()
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

    const community = await IPFSDataService.createCommunity(name, description, user.id)
    return NextResponse.json({ community })
  } catch (error) {
    console.error('Error creating community:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

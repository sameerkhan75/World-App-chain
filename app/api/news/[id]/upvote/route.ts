import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get the current user
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await IPFSDataService.toggleUpvote(id, user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling upvote:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

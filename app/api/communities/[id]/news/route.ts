import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    
    // Get current user for upvote status
    const user = await AuthService.getCurrentUser()
    
    const result = await IPFSDataService.getCommunityNews(
      communityId, 
      user?.id
    )

    if (!result.community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 })
    }

    return NextResponse.json({
      community: result.community,
      news: result.news,
      totalNews: result.news.length
    })
  } catch (error) {
    console.error('Error fetching community news:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

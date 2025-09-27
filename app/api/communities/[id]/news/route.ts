import { IPFSDataService } from "@/lib/ipfs-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const userDisplayName = searchParams.get("user_display_name")
    
    console.log('📋 Fetching community news for user:', userDisplayName || 'anonymous', 'community:', communityId)
    
    const result = await IPFSDataService.getCommunityNews(
      communityId, 
      userId || undefined,
      userDisplayName || undefined
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

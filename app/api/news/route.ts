import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get("community_id")
    const authorId = searchParams.get("author_id")

    const news = await IPFSDataService.getNews(
      communityId || undefined,
      authorId || undefined
    )

    // Add user upvote status if user is authenticated
    const user = await AuthService.getCurrentUser()
    if (user) {
      const userUpvotes = await IPFSDataService.getUserUpvotes(user.id)
      news.forEach(item => {
        item.user_upvoted = userUpvotes.includes(item.id)
      })
    }

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, community_id, ipfs_hash } = await request.json()

    // Get the current user
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Store content on IPFS if not already provided
    let contentHash = ipfs_hash
    if (!contentHash && content) {
      contentHash = await IPFSDataService.storeContent(content, title)
    }

    const newsItem = await IPFSDataService.createNews(
      title,
      content,
      community_id,
      user.id,
      contentHash
    )

    return NextResponse.json({ news: newsItem })
  } catch (error) {
    console.error('Error creating news:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

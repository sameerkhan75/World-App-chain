import { IPFSDataService } from "@/lib/ipfs-service"
import { AuthService } from "@/lib/auth-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get("community_id")
    const authorId = searchParams.get("author_id")

    // Get current user to load their specific data
    const user = await AuthService.getCurrentUser()
    const userDisplayName = user?.display_name

    console.log('📰 Fetching news for user:', userDisplayName || 'anonymous')
    const news = await IPFSDataService.getNews(
      communityId || undefined,
      authorId || undefined,
      userDisplayName
    )

    // Add user upvote status if user is authenticated
    if (user) {
      const userUpvotes = await IPFSDataService.getUserUpvotes(user.id, userDisplayName)
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
    console.log('📝 Starting post creation...')
    const { title, content, community_id, ipfs_hash } = await request.json()
    
    console.log('📝 Request data:', { title, content: content?.substring(0, 50) + '...', community_id, ipfs_hash })
    console.log('📝 Community ID type and value:', { type: typeof community_id, value: community_id, stringified: JSON.stringify(community_id) })

    // Validate input
    if (!title || !content || !community_id) {
      console.error('❌ Missing required fields:', { title: !!title, content: !!content, community_id: !!community_id })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the current user
    console.log('👤 Getting current user...')
    const user = await AuthService.getCurrentUser()
    if (!user) {
      console.error('❌ No authenticated user found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.display_name)

    // Store content on IPFS if not already provided
    let contentHash = ipfs_hash
    if (!contentHash && content) {
      console.log('💾 Storing content on IPFS...')
      try {
        contentHash = await IPFSDataService.storeContent(content, title)
        console.log('✅ Content stored with hash:', contentHash)
      } catch (storeError) {
        console.error('❌ Failed to store content on IPFS:', storeError)
        // Continue without IPFS hash for now
        contentHash = undefined
      }
    }

    console.log('📰 Creating news item in database...')
    const newsItem = await IPFSDataService.createNews(
      title,
      content,
      community_id,
      user.id,
      contentHash,
      user.display_name
    )
    console.log('✅ News item created successfully:', newsItem.id)

    return NextResponse.json({ news: newsItem })
  } catch (error) {
    console.error('❌ Error creating news:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Return more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

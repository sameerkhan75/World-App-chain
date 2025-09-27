import { IPFSDataService } from "@/lib/ipfs-service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const validation = await IPFSDataService.validateData()
    const currentHash = IPFSDataService.getCurrentHash()
    
    // Get recent activity
    const communities = await IPFSDataService.getCommunities()
    const allNews = await IPFSDataService.getNews()
    
    return NextResponse.json({
      validation,
      currentHash,
      stats: {
        communities: communities.length,
        news: allNews.length,
        totalDataSize: validation.dataSize
      },
      recentActivity: {
        latestCommunity: communities[communities.length - 1],
        latestNews: allNews[0], // Already sorted by upvotes/date
        totalUpvotes: allNews.reduce((sum, news) => sum + news.upvotes, 0)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug data API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Force cache clear for debugging
export async function DELETE() {
  try {
    IPFSDataService.clearCache()
    return NextResponse.json({ message: "Cache cleared successfully" })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({ 
      error: "Failed to clear cache",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
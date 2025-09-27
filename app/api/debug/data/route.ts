import { IPFSDataService } from "@/lib/ipfs-service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get all data to see current state
    const communities = await IPFSDataService.getCommunities()
    const news = await IPFSDataService.getNews()

    // Calculate stats
    const totalUpvotes = news.reduce((sum, n) => sum + (n.upvotes || 0), 0)
    const communitiesWithStats = communities.map(community => {
      const communityNews = news.filter(n => n.community_id === community.id)
      const communityUpvotes = communityNews.reduce((sum, n) => sum + (n.upvotes || 0), 0)
      
      return {
        ...community,
        actual_news_count: communityNews.length,
        actual_total_upvotes: communityUpvotes
      }
    })

    return NextResponse.json({
      communities: communitiesWithStats,
      news: news,
      stats: {
        totalCommunities: communities.length,
        totalNews: news.length,
        totalUpvotes: totalUpvotes,
        averageNewsPerCommunity: communities.length > 0 ? (news.length / communities.length).toFixed(1) : 0
      },
      mainDataHash: process.env.MAIN_DATA_HASH || null,
      dataStructureVersion: '1.0'
    })
  } catch (error) {
    console.error('Debug data API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

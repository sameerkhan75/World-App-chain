import { IPFSDataService } from "@/lib/ipfs-service"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Clear cache and reload from IPFS
    IPFSDataService.clearCache()
    
    // Load fresh data
    const communities = await IPFSDataService.getCommunities()
    const news = await IPFSDataService.getNews()

    return NextResponse.json({
      success: true,
      message: "Cache cleared and data reloaded from IPFS",
      data: {
        communities: communities.length,
        news: news.length,
        totalCommunities: communities.length,
        totalNews: news.length
      }
    })
  } catch (error) {
    console.error('Debug reload API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

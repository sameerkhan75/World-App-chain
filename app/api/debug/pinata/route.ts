import { NextResponse } from "next/server"

export async function GET() {
  try {
    const PINATA_JWT = process.env.PINATA_JWT

    if (!PINATA_JWT) {
      return NextResponse.json({ 
        error: "No PINATA_JWT found in environment variables",
        hasJWT: false 
      })
    }

    // Get list of pinned files
    const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=20', {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: `Pinata API error: ${response.status} ${errorText}`,
        hasJWT: true 
      })
    }

    const data = await response.json()
    
    // Filter for worldfeed data
    const worldfeedFiles = data.rows?.filter((file: any) => 
      file.metadata?.name?.includes('worldfeed') || 
      file.metadata?.keyvalues?.app === 'worldfeed'
    ) || []

    // Sort by date (newest first)
    worldfeedFiles.sort((a: any, b: any) => 
      new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime()
    )

    return NextResponse.json({
      hasJWT: true,
      totalFiles: data.count || 0,
      worldfeedFiles: worldfeedFiles.length,
      files: worldfeedFiles.map((file: any) => ({
        hash: file.ipfs_pin_hash,
        name: file.metadata?.name,
        size: file.size,
        timestamp: file.date_pinned,
        keyvalues: file.metadata?.keyvalues
      })),
      mainDataHash: process.env.MAIN_DATA_HASH || null
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

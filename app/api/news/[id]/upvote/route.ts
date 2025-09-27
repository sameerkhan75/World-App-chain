import { IPFSDataService } from "@/lib/ipfs-service"
import { type NextRequest, NextResponse } from "next/server"
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user_id, user_display_name, payload, action, signal } = await request.json() as {
      user_id?: string,
      user_display_name?: string,
      payload?: ISuccessResult,
      action?: string,
      signal?: string
    }

    console.log('🎯 [Upvote API] Processing upvote request:', {
      newsId: id,
      userId: user_id,
      userDisplayName: user_display_name,
      hasPayload: !!payload,
      action
    })

    // Validate user information is provided
    if (!user_id) {
      console.error('❌ [Upvote API] User ID missing')
      return NextResponse.json({ error: "User information required" }, { status: 400 })
    }

    // If a verification payload is provided, verify via World first
    if (payload) {
      console.log('🔐 [Upvote API] Verification payload provided, verifying...')
      const app_id = process.env.APP_ID as `app_${string}` | undefined
      if (!app_id) {
        console.warn('⚠️ [Upvote API] APP_ID missing. Skipping verification in dev mode.')
      } else {
        const verifyRes = (await verifyCloudProof(payload, app_id, action || 'verify', signal)) as IVerifyResponse
        if (!verifyRes.success) {
          console.error('❌ [Upvote API] Verification failed:', verifyRes)
          return NextResponse.json({ error: 'Verification failed', verifyRes, status: 400 }, { status: 400 })
        }
        console.log('✅ [Upvote API] Verification successful')
      }
    } else {
      console.log('🌐 [Upvote API] No verification payload (dev mode)')
    }

    console.log('🔄 [Upvote API] Calling toggleUpvote...')
    const result = await IPFSDataService.toggleUpvote(id, user_id, user_display_name)
    console.log('✅ [Upvote API] Upvote toggled successfully:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ [Upvote API] Error toggling upvote:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { AuthService } from "@/lib/auth-service"
import { IPFSDataService } from "@/lib/ipfs-service"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, displayName } = await request.json()

    // For demo purposes, create a session with demo user
    const { user, sessionToken } = await AuthService.createDemoSession()

    // Ensure profile exists in IPFS
    await IPFSDataService.createProfile(user.id, displayName || user.display_name)

    const response = NextResponse.json({ user })
    
    // Set session cookie
    response.cookies.set(AuthService.SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

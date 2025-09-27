import { AuthService } from "@/lib/auth-service"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear session cookie
    response.cookies.delete(AuthService.SESSION_COOKIE)

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

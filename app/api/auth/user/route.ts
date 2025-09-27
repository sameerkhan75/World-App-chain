import { AuthService } from "@/lib/auth-service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await AuthService.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

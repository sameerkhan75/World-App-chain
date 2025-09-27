import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export interface User {
  id: string
  email?: string
  display_name: string
  created_at: string
}

export class AuthService {
  static readonly SESSION_COOKIE = 'worldfeed_session'
  private static readonly DEMO_USERS: User[] = [
    {
      id: 'demo-user-1',
      email: 'demo@example.com',
      display_name: 'Demo User',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-user-2', 
      email: 'admin@example.com',
      display_name: 'Admin User',
      created_at: new Date().toISOString(),
    },
  ]

  // Generate a simple session token
  private static generateSessionToken(userId: string): string {
    const payload = {
      userId,
      timestamp: Date.now(),
    }
    // In production, use proper JWT signing
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  // Verify and decode session token
  private static verifySessionToken(token: string): { userId: string; timestamp: number } | null {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString())
      // Check if token is not too old (24 hours)
      if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
        return null
      }
      return payload
    } catch {
      return null
    }
  }

  // Get current user from cookies (server-side)
  static async getCurrentUser(): Promise<User | null> {
    try {
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get(this.SESSION_COOKIE)?.value

      if (!sessionToken) {
        return null
      }

      const session = this.verifySessionToken(sessionToken)
      if (!session) {
        return null
      }

      return this.DEMO_USERS.find(user => user.id === session.userId) || null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Get current user from request (middleware)
  static getCurrentUserFromRequest(request: NextRequest): User | null {
    try {
      const sessionToken = request.cookies.get(this.SESSION_COOKIE)?.value

      if (!sessionToken) {
        return null
      }

      const session = this.verifySessionToken(sessionToken)
      if (!session) {
        return null
      }

      return this.DEMO_USERS.find(user => user.id === session.userId) || null
    } catch (error) {
      console.error('Error getting current user from request:', error)
      return null
    }
  }

  // Sign in (demo implementation)
  static async signIn(email: string): Promise<{ user: User; sessionToken: string } | null> {
    const user = this.DEMO_USERS.find(u => u.email === email)
    if (!user) {
      return null
    }

    const sessionToken = this.generateSessionToken(user.id)
    return { user, sessionToken }
  }

  // Create a demo session for development
  static async createDemoSession(): Promise<{ user: User; sessionToken: string }> {
    const user = this.DEMO_USERS[0] // Use first demo user
    const sessionToken = this.generateSessionToken(user.id)
    return { user, sessionToken }
  }

  // Sign out
  static async signOut(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(this.SESSION_COOKIE)
  }

  // Set session cookie
  static setSessionCookie(sessionToken: string): void {
    // This would be used in API routes to set the cookie
    // Implementation depends on the specific API route context
  }

  // Generate user ID for new users
  static generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Create new user (simplified)
  static createUser(email: string, displayName: string): User {
    return {
      id: this.generateUserId(),
      email,
      display_name: displayName,
      created_at: new Date().toISOString(),
    }
  }
}

import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export interface User {
  id: string
  email?: string
  display_name: string
  created_at: string
  world_id_verified?: boolean
  world_id_verified_at?: string
  world_id_nullifier_hash?: string
}

export class AuthService {
  static readonly SESSION_COOKIE = 'worldfeed_session'
  private static readonly DEMO_USERS: User[] = [
    {
      id: 'demo-user-1',
      email: 'demo@example.com',
      display_name: 'Demo User',
      created_at: new Date().toISOString(),
      world_id_verified: false,
    },
    {
      id: 'demo-user-2', 
      email: 'admin@example.com',
      display_name: 'Admin User',
      created_at: new Date().toISOString(),
      world_id_verified: false,
    },
  ]
  
  // Store custom user sessions
  private static customUsers = new Map<string, User>()

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

      return this.customUsers.get(session.userId) || this.DEMO_USERS.find(user => user.id === session.userId) || null
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

      return this.customUsers.get(session.userId) || this.DEMO_USERS.find(user => user.id === session.userId) || null
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
  static async createDemoSession(displayName?: string): Promise<{ user: User; sessionToken: string }> {
    const baseUser = this.DEMO_USERS[0] // Use first demo user as template
    const user = {
      ...baseUser,
      display_name: displayName || baseUser.display_name,
      world_id_verified: false // Start with unverified status
    }
    
    // Store the custom user for later retrieval
    this.customUsers.set(user.id, user)
    
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
      world_id_verified: false,
    }
  }

  // Update user verification status
  static async updateUserVerification(userId: string, nullifierHash: string): Promise<User | null> {
    try {
      // Find user in custom users first
      const customUser = this.customUsers.get(userId)
      if (customUser) {
        customUser.world_id_verified = true
        customUser.world_id_verified_at = new Date().toISOString()
        customUser.world_id_nullifier_hash = nullifierHash
        this.customUsers.set(userId, customUser)
        console.log(`✅ Updated verification status for custom user: ${customUser.display_name}`)
        return customUser
      }

      // Find user in demo users
      const demoUserIndex = this.DEMO_USERS.findIndex(user => user.id === userId)
      if (demoUserIndex !== -1) {
        this.DEMO_USERS[demoUserIndex].world_id_verified = true
        this.DEMO_USERS[demoUserIndex].world_id_verified_at = new Date().toISOString()
        this.DEMO_USERS[demoUserIndex].world_id_nullifier_hash = nullifierHash
        console.log(`✅ Updated verification status for demo user: ${this.DEMO_USERS[demoUserIndex].display_name}`)
        return this.DEMO_USERS[demoUserIndex]
      }

      console.error(`❌ User not found for verification update: ${userId}`)
      return null
    } catch (error) {
      console.error('Error updating user verification:', error)
      return null
    }
  }

  // Check if user is verified
  static async isUserVerified(userId: string): Promise<boolean> {
    try {
      const customUser = this.customUsers.get(userId)
      if (customUser) {
        return customUser.world_id_verified || false
      }

      const demoUser = this.DEMO_USERS.find(user => user.id === userId)
      if (demoUser) {
        return demoUser.world_id_verified || false
      }

      return false
    } catch (error) {
      console.error('Error checking user verification:', error)
      return false
    }
  }
}

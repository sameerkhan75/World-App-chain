"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { MiniKit, WalletAuthInput, ResponseEvent } from '@worldcoin/minikit-js'

interface User {
  id: string
  address: string
  username?: string
  display_name: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  authenticateWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  authenticateWallet: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Automatically authenticate when the app loads
  useEffect(() => {
    console.log("AuthProvider: Starting wallet authentication on app load")
    authenticateWallet()
  }, [])

  const authenticateWallet = async () => {
    console.log("AuthProvider: Starting wallet authentication")
    setIsLoading(true)
    
    try {
      if (!MiniKit.isInstalled()) {
        console.log('MiniKit not installed')
        // Create a demo user for testing outside World App
        const demoUser: User = {
          id: 'demo-user',
          address: '0x1234567890123456789012345678901234567890',
          username: 'demo_user',
          display_name: 'Demo User',
          created_at: new Date().toISOString(),
        }
        setUser(demoUser)
        setIsLoading(false)
        return
      }

      // Check if we already have wallet auth
      if (MiniKit.user?.walletAddress) {
        console.log('User already authenticated with wallet:', MiniKit.user.walletAddress)
        await createUserFromWallet(MiniKit.user.walletAddress, MiniKit.user.username)
        setIsLoading(false)
        return
      }

      console.log('Starting wallet authentication...')
      
      const walletAuthInput: WalletAuthInput = {
        scope: ['openid', 'profile', 'worldid'],
      }

      // Race wallet auth against a timeout to avoid hanging
      const walletAuthPromise = MiniKit.commandsAsync.walletAuth(walletAuthInput)
      const timeoutPromise = new Promise<{ finalPayload: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Wallet auth timeout')), 8000)
      })

      const {finalPayload} = await Promise.race([walletAuthPromise, timeoutPromise]) as any
      
      if (finalPayload.status === 'error') {
        console.error('Wallet auth error:', finalPayload)
        throw new Error('Wallet authentication failed')
      }

      console.log('Wallet authentication successful:', finalPayload)
      
      // Create user from wallet address
      await createUserFromWallet(finalPayload.address, finalPayload.username)
      
    } catch (error) {
      console.error("AuthProvider: Error during wallet authentication:", error)
      // For development, create a demo user if authentication fails
      const demoUser: User = {
        id: 'demo-user',
        address: '0x1234567890123456789012345678901234567890',
        username: 'demo_user',
        display_name: 'Demo User',
        created_at: new Date().toISOString(),
      }
      setUser(demoUser)
    } finally {
      setIsLoading(false)
    }
  }

  const createUserFromWallet = async (address: string, username?: string) => {
    console.log('Creating user from wallet:', { address, username })
    
    try {
      // Get username from World API if not provided
      let resolvedUsername = username
      if (!resolvedUsername && MiniKit.isInstalled()) {
        try {
          const worldIdUser = await MiniKit.getUserByAddress(address)
          resolvedUsername = worldIdUser?.username
        } catch (error) {
          console.log('Could not get username from World API:', error)
        }
      }

      const user: User = {
        id: address, // Use wallet address as user ID
        address,
        username: resolvedUsername,
        display_name: resolvedUsername || `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        created_at: new Date().toISOString(),
      }

      console.log('User created from wallet:', user)
      setUser(user)
    } catch (error) {
      console.error('Error creating user from wallet:', error)
      throw error
    }
  }

  console.log("AuthProvider render:", { user: !!user, isLoading })

  return (
    <AuthContext.Provider value={{ user, isLoading, authenticateWallet }}>
      {/* Show loading state while authenticating */}
      {isLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Connecting to World...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

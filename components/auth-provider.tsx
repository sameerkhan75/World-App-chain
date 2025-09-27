"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { LoginModal } from "./login-modal"

interface User {
  id: string
  email?: string
  display_name: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(true) // Start with modal open

  // Check if user is logged in on mount
  useEffect(() => {
    console.log("AuthProvider: Checking authentication on mount")
    checkAuth()
  }, [])

  const checkAuth = async () => {
    console.log("AuthProvider: Starting auth check")
    try {
      const response = await fetch("/api/auth/user")
      console.log("AuthProvider: Auth API response status:", response.status)
      
      if (!response.ok) {
        console.error("Auth API error:", response.status, response.statusText)
        // If API fails, show login modal
        setShowLoginModal(true)
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      console.log("AuthProvider: Auth API response data:", data)
      
      if (data.user) {
        console.log("AuthProvider: User found, setting user state")
        setUser(data.user)
        setShowLoginModal(false) // Close modal if user exists
      } else {
        console.log("AuthProvider: No user found, keeping login modal open")
        // Keep login modal open if not logged in
        setShowLoginModal(true)
      }
    } catch (error) {
      console.error("AuthProvider: Error checking auth:", error)
      // On any error, show login modal to allow user to authenticate
      setShowLoginModal(true)
    } finally {
      console.log("AuthProvider: Auth check complete, setting loading to false")
      setIsLoading(false)
    }
  }

  const login = () => {
    setShowLoginModal(true)
  }

  const handleLogin = (user: User) => {
    console.log("AuthProvider: Login successful, setting user and closing modal")
    setUser(user)
    setShowLoginModal(false)
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setShowLoginModal(true)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  console.log("AuthProvider render:", { user: !!user, isLoading, showLoginModal })

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {/* Show loading state while checking authentication */}
      {isLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Only show app content if user is logged in */}
          {user ? children : (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Welcome to WorldFeed</h1>
                <p className="text-muted-foreground">Please log in to continue</p>
              </div>
            </div>
          )}
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => {
              // Don't allow closing if not logged in - user must login to use the app
              if (user) {
                setShowLoginModal(false)
              }
            }}
            onLogin={handleLogin}
          />
        </>
      )}
    </AuthContext.Provider>
  )
}

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
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/user")
      const data = await response.json()
      
      if (data.user) {
        setUser(data.user)
      } else {
        // Auto-show login modal if not logged in
        setTimeout(() => setShowLoginModal(true), 500)
      }
    } catch (error) {
      console.error("Error checking auth:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = () => {
    setShowLoginModal(true)
  }

  const handleLogin = (user: User) => {
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          // Don't allow closing if not logged in
          if (user) {
            setShowLoginModal(false)
          }
        }}
        onLogin={handleLogin}
      />
    </AuthContext.Provider>
  )
}

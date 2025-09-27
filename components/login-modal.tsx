"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User } from "lucide-react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (user: any) => void
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [displayName, setDisplayName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const name = displayName.trim() || "Anonymous User"
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "demo@example.com",
          displayName: name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to login")
      }

      console.log("Login successful:", data.user)
      
      // Call the callback
      onLogin(data.user)
      
      // Reset form
      setDisplayName("")
      setError("")
      
      // Close modal
      onClose()
    } catch (error) {
      console.error("Error logging in:", error)
      setError(error instanceof Error ? error.message : "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm bg-background border border-border">
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Welcome to WorldFeed</h2>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Enter your display name to start sharing news
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-foreground mb-2">
                Display Name
              </label>
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name (optional)"
                className="w-full"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Continue"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This is a demo app using IPFS for decentralized storage
            </p>
          </form>
        </div>
      </Card>
    </div>
  )
}
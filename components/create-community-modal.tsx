"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"

interface CreateCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  onCommunityCreated?: () => void
}

export function CreateCommunityModal({ isOpen, onClose, onCommunityCreated }: CreateCommunityModalProps) {
  const [communityName, setCommunityName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!communityName.trim()) {
      setError("Community name is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (!user) {
        throw new Error("User not authenticated")
      }
      
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: communityName.trim(),
          description: description.trim() || "A new community",
          user_id: user.id,
          user_display_name: user.display_name
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create community")
      }

      console.log("Community created successfully:", data)
      
      // Reset form
      setCommunityName("")
      setDescription("")
      setError("")
      
      // Call the callback to refresh the list
      if (onCommunityCreated) {
        onCommunityCreated()
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error("Error creating community:", error)
      setError(error instanceof Error ? error.message : "Failed to create community")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setCommunityName("")
      setDescription("")
      setError("")
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-background border border-border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Create Community</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="community-name" className="block text-sm font-medium text-foreground mb-2">
                Community Name
              </label>
              <Input
                id="community-name"
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="Enter community name"
                className="w-full"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="community-description" className="block text-sm font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <Textarea
                id="community-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community..."
                className="w-full"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 bg-transparent"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || !communityName.trim()}
              >
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  communityId?: string
  communityName?: string
  onPostCreated?: () => void
  isVerified?: boolean
  onVerify?: () => Promise<void>
  onResetVerification?: () => void
}

export function CreatePostModal({ 
  isOpen, 
  onClose, 
  communityId, 
  communityName,
  onPostCreated,
  isVerified = false,
  onVerify,
  onResetVerification
}: CreatePostModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Debug log to see what's being received
  console.log('CreatePostModal received:', { communityId, communityName, isOpen, isVerified })

  const submitPost = useCallback(async () => {
    console.log('submitPost called with:', { communityId, communityName, title: title.trim(), content: content.trim() })
    setIsLoading(true)
    setError("")

    try {
      console.log('Making API call to /api/news...')
      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          community_id: communityId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (data.error && data.error.includes("Community not found")) {
          throw new Error("This community no longer exists. Please refresh the page and try again.")
        }
        throw new Error(data.error || "Failed to create post")
      }

      // Reset form
      setTitle("")
      setContent("")
      setError("")
      
      // Reset verification state for next post
      if (onResetVerification) {
        onResetVerification()
      }
      
      // Call success callback
      if (onPostCreated) {
        onPostCreated()
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error("Error creating post:", error)
      setError(error instanceof Error ? error.message : "Failed to create post")
    } finally {
      setIsLoading(false)
    }
  }, [communityId, title, content, onResetVerification, onPostCreated, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      setError("Please fill in all fields")
      return
    }

    if (!communityId) {
      setError("No community selected")
      return
    }

    // Check verification before posting
    if (!isVerified && onVerify) {
      try {
        console.log('Starting verification process...')
        setIsLoading(true)
        await onVerify()
        console.log('Verification completed, now submitting post...')
        // After verification succeeds, submit the post
        await submitPost()
        return
      } catch (error) {
        console.error('Verification failed:', error)
        setIsLoading(false)
        setError("Verification failed. Please try again.")
        return
      }
    }

    // If already verified, submit directly
    console.log('Already verified, submitting post directly...')
    await submitPost()
  }

  const handleClose = () => {
    if (!isLoading) {
      setTitle("")
      setContent("")
      setError("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Post</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 h-auto"
            >
              <X size={16} />
            </Button>
          </div>
          {communityName && (
            <p className="text-sm text-muted-foreground">
              Posting to <span className="font-medium">{communityName}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="content"
              placeholder="What's happening in your community?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={6}
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              {isLoading ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

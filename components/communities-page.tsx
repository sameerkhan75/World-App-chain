"use client"

import React, { useState, useEffect, useRef } from "react"
import { Plus, Users, User, LogOut, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateCommunityModal } from "@/components/create-community-modal"
import { CreatePostModal } from "@/components/create-post-modal"
import { useAuth } from "@/components/auth-provider"
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult, PayCommandInput, Tokens, tokenToDecimals } from '@worldcoin/minikit-js'

// Echo icon component (upvote arrow)
const EchoIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L4 10h5v10h6V10h5L12 2z"/>
  </svg>
)

// Dollar coin icon component
const DollarCoinIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6v12M9.5 9a2.5 2.5 0 0 1 5 0M14.5 15a2.5 2.5 0 0 1-5 0" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
)

interface Community {
  id: string
  name: string
  description: string
  created_at: string
  creator_name?: string
  news_count: number
  total_upvotes: number
}

interface Post {
  id: string
  title: string
  content: string
  community_id: string
  author_id: string
  upvotes: number
  created_at: string
  communities?: { name: string }
  profiles?: { display_name: string }
  community_name?: string
  author_name?: string
}

interface CommunitiesPageProps {
  onCommunitySelect?: (communityName: string, communityId: string) => void
}

export function CommunitiesPage({ onCommunitySelect }: CommunitiesPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
  const [communityPosts, setCommunityPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { user } = useAuth()

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities")
      const data = await response.json()
      if (data.communities) {
        setCommunities(data.communities)
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommunityPosts = async (communityId: string) => {
    setPostsLoading(true)
    try {
      const params = new URLSearchParams()
      if (user) {
        params.append('user_id', user.id)
        params.append('user_display_name', user.display_name)
      }
      const response = await fetch(`/api/communities/${communityId}/news?${params.toString()}`)
      const data = await response.json()
      if (data.news) {
        setCommunityPosts(data.news)
      }
      setCurrentPostIndex(0)
    } catch (error) {
      console.error("Failed to fetch community posts:", error)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleCommunityClick = (community: Community) => {
    console.log('🏠 Community selected:', { id: community.id, name: community.name })
    setSelectedCommunity(community)
    fetchCommunityPosts(community.id)
  }

  const handleBackToCommunities = () => {
    setSelectedCommunity(null)
    setCommunityPosts([])
    setCurrentPostIndex(0)
  }

  const handleUpvote = async (newsId: string) => {
    try {
      if (!user) {
        console.error('User not authenticated for upvote')
        return
      }
      
      console.log('🔍 Starting upvote process for:', newsId)
      
      let payload: ISuccessResult | undefined = undefined
      
      // Only do verification if in World App
      if (MiniKit.isInstalled()) {
        console.log('📱 World App detected, starting verification...')
        try {
          const verifyPayload: VerifyCommandInput = {
            action: 'verify',
            verification_level: VerificationLevel.Orb,
          }
          const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)
          if (finalPayload.status === 'error') {
            console.error('❌ Verification failed:', finalPayload)
            return
          }
          console.log('✅ Verification successful')
          payload = finalPayload as ISuccessResult
        } catch (verifyError) {
          console.error('❌ Verification error:', verifyError)
          return
        }
      } else {
        console.log('🌐 Browser mode detected, skipping verification')
      }

      console.log('📡 Sending upvote request...')
      const response = await fetch(`/api/news/${newsId}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          user_display_name: user.display_name,
          payload,
          action: 'verify',
        }),
      })
      
      const data = await response.json()
      console.log('📡 Upvote response:', { status: response.status, data })

      if (response.ok) {
        console.log('✅ Upvote successful, updating UI...')
        const newUserUpvotes = new Set(userUpvotes)
        if (data.upvoted) {
          newUserUpvotes.add(newsId)
          console.log('👍 Added upvote for:', newsId)
        } else {
          newUserUpvotes.delete(newsId)
          console.log('👎 Removed upvote for:', newsId)
        }
        setUserUpvotes(newUserUpvotes)
        
        // Refresh the community posts to get updated counts
        if (selectedCommunity) {
          console.log('🔄 Refreshing community posts...')
          fetchCommunityPosts(selectedCommunity.id)
        }
      } else {
        console.error('❌ Upvote failed:', data)
      }
    } catch (error) {
      console.error("❌ Failed to upvote:", error)
    }
  }

  const handleContribute = async (post: Post) => {
    try {
      if (!user) {
        console.error('User not authenticated for contribution')
        return
      }

      if (!MiniKit.isInstalled()) {
        console.log('MiniKit not installed - payment not available')
        return
      }

      // Step 1: Initiate payment 
      const initRes = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_address: post.author_id, // Using author_id as wallet address for demo
          author_name: post.author_name || 'Anonymous',
          post_title: post.title
        })
      })
      
      if (!initRes.ok) {
        throw new Error('Failed to initiate payment')
      }
      
      const { id: reference } = await initRes.json()

      // Step 2: Send payment command
      const payload: PayCommandInput = {
        reference,
        to: post.author_id, // Demo: using author_id as wallet address
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(0.1, Tokens.WLD).toString(), // 0.1 WLD minimum
          },
          {
            symbol: Tokens.USDC,
            token_amount: tokenToDecimals(0.1, Tokens.USDC).toString(), // 0.1 USDC minimum
          },
        ],
        description: `Contribution to "${post.title}" by ${post.author_name || 'Anonymous'}`,
      }

      const { finalPayload } = await MiniKit.commandsAsync.pay(payload)

      if (finalPayload.status === 'success') {
        // Step 3: Confirm payment
        const confirmRes = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: finalPayload }),
        })
        
        const confirmation = await confirmRes.json()
        if (confirmation.success) {
          console.log('✅ Payment successful!')
          // TODO: Update UI to show contribution success
          // TODO: Refresh posts to show updated contribution stats
        } else {
          console.error('❌ Payment verification failed:', confirmation)
        }
      } else {
        console.log('Payment cancelled or failed:', finalPayload)
      }
    } catch (error) {
      console.error("Failed to process contribution:", error)
    }
  }

  const nextPost = () => {
    if (currentPostIndex < communityPosts.length - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentPostIndex(currentPostIndex + 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const prevPost = () => {
    if (currentPostIndex > 0 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentPostIndex(currentPostIndex - 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const deltaX = touchStartRef.current.x - touchEnd.x
    const deltaY = Math.abs(touchStartRef.current.y - touchEnd.y)

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        nextPost() // Swipe left -> next
      } else {
        prevPost() // Swipe right -> previous
      }
    }

    touchStartRef.current = null
  }

  const handleCommunityCreated = () => {
    fetchCommunities() // Refresh the list
  }

  const handlePostCreated = () => {
    if (selectedCommunity) {
      fetchCommunityPosts(selectedCommunity.id) // Refresh the posts
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading communities...</p>
        </div>
      </div>
    )
  }

  // Show community posts if a community is selected
  if (selectedCommunity) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        {/* User info bar */}
        {user && (
          <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">{user.display_name}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleBackToCommunities}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{selectedCommunity.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {communityPosts.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {currentPostIndex + 1} / {communityPosts.length}
              </span>
            )}
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!user}
            >
              <Plus size={16} className="mr-1" />
              Add Post
            </Button>
          </div>
        </div>

        {postsLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : communityPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts in this community yet.</p>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="p-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Card className={`w-full max-w-2xl mx-auto transition-all duration-300 ease-out ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}>
              <div className="p-6 border-2 border-black" style={{ backgroundColor: '#f6efeb' }}>
                <div className="flex flex-col gap-2">
                  {/* Author Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="text-black" />
                    <p className="text-xs text-black" style={{ 
                      fontFamily: '"Press Start 2P", monospace, "Courier New", Courier',
                      letterSpacing: '0.05em'
                    }}>
                      {communityPosts[currentPostIndex].author_name || 'Anonymous User'}
                    </p>
                  </div>

                  {/* Post Title Box */}
                  <div className="border-2 border-black p-2" style={{ backgroundColor: 'white' }}>
                    <h3 className="text-sm text-black" style={{ 
                      fontFamily: '"Press Start 2P", monospace, "Courier New", Courier',
                      letterSpacing: '0.05em',
                      textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                    }}>{communityPosts[currentPostIndex].title}</h3>
                  </div>
                  
                  {/* Post Content Box */}
                  <div className="border-2 border-black p-2 mb-4" style={{ backgroundColor: 'white' }}>
                    <p className="text-sm text-black leading-relaxed italic" style={{ 
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: '300',
                      letterSpacing: '0.01em',
                      lineHeight: '1.5'
                    }}>{communityPosts[currentPostIndex].content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-black">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex items-center gap-2 flex-1 justify-center h-10 ${
                        userUpvotes.has(communityPosts[currentPostIndex].id) ? "bg-primary/10 text-primary" : ""
                      }`}
                      onClick={() => handleUpvote(communityPosts[currentPostIndex].id)}
                    >
                      <EchoIcon size={18} />
                      <span className="font-medium">{communityPosts[currentPostIndex].upvotes} Echo</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 flex-1 justify-center h-10"
                      onClick={() => handleContribute(communityPosts[currentPostIndex])}
                    >
                      <DollarCoinIcon size={18} />
                      <span className="font-medium">Contribute</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Swipe Indicator */}
        {communityPosts.length > 1 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-muted/80 backdrop-blur-sm rounded-full px-3 py-1">
              <p className="text-xs text-muted-foreground">
                Swipe to navigate
              </p>
            </div>
          </div>
        )}

        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          communityId={selectedCommunity.id}
          communityName={selectedCommunity.name}
          onPostCreated={handlePostCreated}
        />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* User info bar */}
      {user && (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <span className="text-sm text-foreground">{user.display_name}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Communities</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!user}
        >
          <Plus size={16} className="mr-1" />
          Add Community
        </Button>
      </div>

      <div className="space-y-4">
        {communities.map((community) => (
          <div
            key={community.id}
            className="hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => handleCommunityClick(community)}
          >
            <div className="flex gap-4 p-4 border-2 border-black" style={{ backgroundColor: '#f6efeb' }}>
              {/* Community Profile Picture Box */}
              <div className="w-32 h-24 border-2 border-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'white' }}>
                <Users size={24} className="text-black" />
              </div>
              
              {/* Community Info - Right Side */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Community Name Box */}
                <div className="border-2 border-black p-2" style={{ backgroundColor: 'white' }}>
                  <h3 className="text-sm text-black" style={{ 
                    fontFamily: '"Press Start 2P", monospace, "Courier New", Courier',
                    letterSpacing: '0.05em',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                  }}>{community.name}</h3>
                </div>
                
                {/* Community Description Box */}
                <div className="border-2 border-black p-2 flex-1" style={{ backgroundColor: 'white' }}>
                  <p className="text-sm text-black leading-relaxed italic" style={{ 
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: '300',
                    letterSpacing: '0.01em',
                    lineHeight: '1.5'
                  }}>{community.description}</p>
                </div>

                {/* Creator Name - moved below description and made smaller */}
                <div className="flex items-center gap-1 mt-1">
                  <User size={8} className="text-black opacity-70" />
                  <p className="text-xs text-black opacity-70" style={{ 
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '10px',
                    fontWeight: '400'
                  }}>
                    Created by {community.creator_name || 'Anonymous User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {communities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No communities yet. Create the first one!</p>
        </div>
      )}

      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCommunityCreated={handleCommunityCreated}
      />
    </div>
  )
}

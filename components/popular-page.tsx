"use client"

import React, { useState, useEffect, useRef } from "react"
import { Plus, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult, PayCommandInput, Tokens, tokenToDecimals } from '@worldcoin/minikit-js'

// Utility function to get avatar image path based on community ID hash
const getCommunityAvatarById = (communityId: string): string => {
  // Enhanced hash to ensure better distribution and avoid clustering
  let hash = 0
  for (let i = 0; i < communityId.length; i++) {
    const char = communityId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Add some salt based on the community ID's characteristics to improve distribution
  const salt = communityId.length * 7 + (communityId.charCodeAt(0) || 0) * 13
  hash = Math.abs(hash + salt)
  
  const avatarIndex = (hash % 3) + 1
  return `/community-avatar-${avatarIndex}.png`
}

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
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "@/components/create-post-modal"

interface NewsItem {
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

interface PopularPageProps {
  communityName?: string
  communityId?: string
}

export function PopularPage({ communityName, communityId }: PopularPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchNews()
  }, [communityId, user])

  const fetchNews = async () => {
    try {
      let url: string
      const params = new URLSearchParams()
      
      // Add user information if available
      if (user) {
        params.append('user_id', user.id)
        params.append('user_display_name', user.display_name)
      }
      
      if (communityId) {
        url = `/api/communities/${communityId}/news?${params.toString()}`
      } else {
        url = `/api/news?${params.toString()}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (communityId && data.community && data.news) {
        setNews(data.news)
      } else if (data.news) {
        setNews(data.news)
      }
      
      setCurrentIndex(0)
    } catch (error) {
      console.error("Failed to fetch news:", error)
    } finally {
      setLoading(false)
    }
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
        
        // Refresh the news to get updated counts
        console.log('🔄 Refreshing news data...')
        fetchNews()
      } else {
        console.error('❌ Upvote failed:', data)
      }
    } catch (error) {
      console.error("❌ Failed to upvote:", error)
    }
  }

  const handleContribute = async (newsItem: NewsItem) => {
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
          to_address: newsItem.author_id, // Using author_id as wallet address for demo
          author_name: newsItem.author_name || 'Anonymous',
          post_title: newsItem.title
        })
      })
      
      if (!initRes.ok) {
        throw new Error('Failed to initiate payment')
      }
      
      const { id: reference } = await initRes.json()

      // Step 2: Send payment command
      const payload: PayCommandInput = {
        reference,
        to: newsItem.author_id, // Demo: using author_id as wallet address
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
        description: `Contribution to "${newsItem.title}" by ${newsItem.author_name || 'Anonymous'}`,
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
          // TODO: Refresh news to show updated contribution stats
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

  const nextNews = () => {
    if (currentIndex < news.length - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const prevNews = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1)
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
        nextNews() // Swipe left -> next
      } else {
        prevNews() // Swipe right -> previous
      }
    }

    touchStartRef.current = null
  }

  const handlePostCreated = () => {
    fetchNews()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-2xl font-bold mb-4">{communityName || "Popular"}</h1>
        <p className="text-muted-foreground mb-4">No news available yet.</p>
        {communityName && (
          <Button onClick={() => setIsCreatePostOpen(true)}>
            <Plus size={16} className="mr-2" />
            Create Post
          </Button>
        )}
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          communityId={communityId}
          communityName={communityName}
          onPostCreated={handlePostCreated}
        />
      </div>
    )
  }

  const currentNews = news[currentIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">{communityName || "Popular"}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {news.length}
            </span>
            {communityName && (
              <Button onClick={() => setIsCreatePostOpen(true)} size="sm">
                <Plus size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* News Card */}
      <div 
        ref={containerRef}
        className="p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Card className={`w-full max-w-2xl mx-auto transition-all duration-300 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          <div className="p-6">
            {/* Community Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={getCommunityAvatarById(currentNews.community_id)} 
                  alt="Community avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {currentNews.communities?.name || currentNews.community_name || "Unknown Community"}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {currentNews.profiles?.display_name || currentNews.author_name || "Anonymous"}
                </p>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold mb-4 leading-tight">
              {currentNews.title}
            </h2>
            
            {/* Content */}
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {currentNews.content}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 flex-1 justify-center h-10 ${
                  userUpvotes.has(currentNews.id) ? "bg-primary/10 text-primary" : ""
                }`}
                onClick={() => handleUpvote(currentNews.id)}
              >
                <EchoIcon size={18} />
                <span className="font-medium">Echo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 flex-1 justify-center h-10"
                onClick={() => handleContribute(news[currentIndex])}
              >
                <DollarCoinIcon size={18} />
                <span className="font-medium">Contribute</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Swipe Indicator */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-muted/80 backdrop-blur-sm rounded-full px-3 py-1">
          <p className="text-xs text-muted-foreground">
            Swipe to navigate
          </p>
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        communityId={communityId}
        communityName={communityName}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

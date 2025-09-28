"use client"

import { User, Calendar, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"

const userProfile = {
  name: "sam",
  bio: "Web3 enthusiast and blockchain developer. Building the future of decentralized applications.",
  joinedDate: "January 2023",
  postsCount: 2,
}

const userPosts = [
  {
    id: 1,
    title: "Understanding Smart Contract Security",
    content:
      "Security should be the top priority when developing smart contracts.",
    community: "Web3 Developers",
    timestamp: "3 days ago",
    author_name: "sam",
  },
  {
    id: 2,
    title: "The Future of DeFi Protocols",
    content:
      "Decentralized finance is evolving rapidly. New protocols are emerging that solve liquidity and scalability challenges...",
    community: "DeFi Discussions",
    timestamp: "1 week ago",
    author_name: "sam",
  },
]

export function ProfilePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

      {/* Profile Info */}
      <Card className="p-6 mb-6 border border-border">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <User size={24} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground mb-2">{userProfile.name}</h2>
            <p className="text-muted-foreground text-sm text-pretty mb-3">{userProfile.bio}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Joined {userProfile.joinedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare size={12} />
                <span>{userProfile.postsCount} posts</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* User Posts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Your Posts</h3>
        {userPosts.map((post) => (
          <Card key={post.id} className="w-full max-w-2xl mx-auto">
            <div className="p-6 border-2 border-black" style={{ backgroundColor: '#f6efeb' }}>
              <div className="flex flex-col gap-2">
                {/* Author Name */}
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-black" />
                  <p className="text-xs text-black" style={{ 
                    fontFamily: '"Press Start 2P", monospace, "Courier New", Courier',
                    letterSpacing: '0.05em'
                  }}>
                    {post.author_name || 'Anonymous User'}
                  </p>
                </div>

                {/* Community and Timestamp */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-black bg-white px-2 py-1 border border-black" style={{
                    fontFamily: '"Press Start 2P", monospace, "Courier New", Courier',
                    fontSize: '10px'
                  }}>{post.community}</span>
                  <span className="text-xs text-black opacity-70">{post.timestamp}</span>
                </div>

                {/* Post Title Box */}
                <div className="border-2 border-black p-2" style={{ backgroundColor: 'white' }}>
                  <h3 className="text-sm text-black" style={{ 
                    fontFamily: '"Press Start 2P", monospace, "Courier New", Courier',
                    letterSpacing: '0.05em',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                  }}>{post.title}</h3>
                </div>
                
                {/* Post Content Box */}
                <div className="border-2 border-black p-2" style={{ backgroundColor: 'white' }}>
                  <p className="text-sm text-black leading-relaxed italic" style={{ 
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: '300',
                    letterSpacing: '0.01em',
                    lineHeight: '1.5'
                  }}>{post.content}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

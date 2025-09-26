"use client"

import { User, Calendar, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"

const userProfile = {
  name: "Alex Chen",
  bio: "Web3 enthusiast and blockchain developer. Building the future of decentralized applications.",
  joinedDate: "January 2023",
  postsCount: 24,
}

const userPosts = [
  {
    id: 1,
    title: "Understanding Smart Contract Security",
    content:
      "Security should be the top priority when developing smart contracts. Here are the key principles every developer should follow...",
    community: "Web3 Developers",
    timestamp: "3 days ago",
    likes: 45,
  },
  {
    id: 2,
    title: "The Future of DeFi Protocols",
    content:
      "Decentralized finance is evolving rapidly. New protocols are emerging that solve liquidity and scalability challenges...",
    community: "DeFi Discussions",
    timestamp: "1 week ago",
    likes: 32,
  },
  {
    id: 3,
    title: "NFT Utility Beyond Art",
    content:
      "Non-fungible tokens have applications far beyond digital art. From gaming to identity verification, the possibilities are endless...",
    community: "NFT Creators",
    timestamp: "2 weeks ago",
    likes: 28,
  },
  {
    id: 4,
    title: "Layer 2 Scaling Solutions Comparison",
    content:
      "A comprehensive analysis of different Layer 2 solutions and their trade-offs in terms of security, speed, and cost...",
    community: "Blockchain News",
    timestamp: "3 weeks ago",
    likes: 67,
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
          <Card key={post.id} className="p-4 border border-border">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary bg-accent px-2 py-1 rounded">{post.community}</span>
                <span className="text-xs text-muted-foreground">{post.timestamp}</span>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-balance mb-2">{post.title}</h4>
                <p className="text-sm text-muted-foreground text-pretty">{post.content}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">{post.likes} likes</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

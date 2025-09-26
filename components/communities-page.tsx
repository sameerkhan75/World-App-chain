"use client"

import { useState } from "react"
import { Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateCommunityModal } from "@/components/create-community-modal"

const demoCommunitiesData = [
  { id: 1, name: "DeFi Discussions", members: 12500, description: "Latest trends in decentralized finance" },
  { id: 2, name: "NFT Creators", members: 8900, description: "Showcase and discuss digital art" },
  { id: 3, name: "Web3 Developers", members: 15600, description: "Building the future of the internet" },
  { id: 4, name: "Crypto Trading", members: 22100, description: "Market analysis and trading strategies" },
  { id: 5, name: "Blockchain News", members: 18700, description: "Latest blockchain technology updates" },
  { id: 6, name: "DAO Governance", members: 6800, description: "Decentralized autonomous organizations" },
]

interface CommunitiesPageProps {
  onCommunitySelect?: (communityName: string) => void
}

export function CommunitiesPage({ onCommunitySelect }: CommunitiesPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCommunityClick = (communityName: string) => {
    if (onCommunitySelect) {
      onCommunitySelect(communityName)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Communities</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={16} className="mr-1" />
          Add Community
        </Button>
      </div>

      <div className="space-y-3">
        {demoCommunitiesData.map((community) => (
          <Card
            key={community.id}
            className="p-4 border border-border hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleCommunityClick(community.name)}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Users size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-balance">{community.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 text-pretty">{community.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{community.members.toLocaleString()} members</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreateCommunityModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  )
}

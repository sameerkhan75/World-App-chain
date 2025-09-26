"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Clock, Users, ArrowUp, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const demoNewsData = [
  {
    id: 1,
    title: "Ethereum 2.0 Staking Rewards Hit All-Time High",
    content:
      "The latest upgrade to Ethereum's proof-of-stake mechanism has resulted in unprecedented staking rewards for validators, with annual yields reaching 8.2%.",
    community: "DeFi Discussions",
    timestamp: "2 hours ago",
    author: "CryptoAnalyst",
  },
  {
    id: 2,
    title: "New NFT Marketplace Launches with Zero Gas Fees",
    content:
      "A revolutionary NFT platform has emerged, offering creators and collectors the ability to mint and trade digital assets without paying any gas fees through Layer 2 scaling.",
    community: "NFT Creators",
    timestamp: "4 hours ago",
    author: "DigitalArtist",
  },
  {
    id: 3,
    title: "Web3 Gaming Adoption Surges 300% This Quarter",
    content:
      "Play-to-earn games and blockchain-based gaming platforms have seen massive growth, with over 2 million new users joining Web3 gaming ecosystems.",
    community: "Web3 Developers",
    timestamp: "6 hours ago",
    author: "GameDev",
  },
  {
    id: 4,
    title: "Bitcoin Reaches New Technical Milestone",
    content:
      "The Bitcoin network has processed its 800 millionth transaction, marking a significant achievement in the cryptocurrency's 15-year history.",
    community: "Crypto Trading",
    timestamp: "8 hours ago",
    author: "BitcoinMaxi",
  },
  {
    id: 5,
    title: "DAO Treasury Management Best Practices Released",
    content:
      "Leading blockchain organizations have published comprehensive guidelines for managing decentralized autonomous organization treasuries effectively.",
    community: "DAO Governance",
    timestamp: "12 hours ago",
    author: "DAOExpert",
  },
]

interface PopularPageProps {
  communityName?: string
}

export function PopularPage({ communityName }: PopularPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < demoNewsData.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : 0)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex < demoNewsData.length - 1 ? currentIndex + 1 : demoNewsData.length - 1)
  }

  const filteredNews = communityName ? demoNewsData.filter((news) => news.community === communityName) : demoNewsData

  const currentFilteredNews = filteredNews[currentIndex] || filteredNews[0]

  const pageTitle = communityName || "Popular"

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {filteredNews.length}
        </div>
      </div>

      <div
        ref={containerRef}
        className="mb-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Card className="w-full p-6 border border-border bg-card relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Users size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{currentFilteredNews.community}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentFilteredNews.author}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{currentFilteredNews.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground text-balance leading-tight">
                {currentFilteredNews.title}
              </h2>
              <p className="text-muted-foreground text-pretty leading-relaxed">{currentFilteredNews.content}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" size="sm" className="flex items-center gap-2 flex-1 bg-transparent">
                <ArrowUp size={16} />
                Upvote
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 flex-1 bg-transparent">
                <Heart size={16} />
                Thanks
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 bg-transparent"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <div className="flex gap-1">
                {filteredNews.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentIndex === filteredNews.length - 1}
                className="flex items-center gap-1 bg-transparent"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">Swipe left or right to navigate</p>
      </div>
    </div>
  )
}

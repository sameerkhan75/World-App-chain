"use client"

import { useState } from "react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { CommunitiesPage } from "@/components/communities-page"
import { PopularPage } from "@/components/popular-page"
import { ProfilePage } from "@/components/profile-page"

export default function Home() {
  const [activeTab, setActiveTab] = useState("communities")
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null)

  const handleCommunitySelect = (communityName: string) => {
    setSelectedCommunity(communityName)
    setActiveTab("popular")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "communities":
        return <CommunitiesPage onCommunitySelect={handleCommunitySelect} />
      case "popular":
        return <PopularPage communityName={selectedCommunity || undefined} />
      case "profile":
        return <ProfilePage />
      default:
        return <CommunitiesPage onCommunitySelect={handleCommunitySelect} />
    }
  }

  const handleTabChange = (tab: string) => {
    if (tab === "popular" && activeTab !== "popular") {
      setSelectedCommunity(null)
    }
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{renderContent()}</main>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}

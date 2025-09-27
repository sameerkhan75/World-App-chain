"use client"

import { useState } from "react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { CommunitiesPage } from "@/components/communities-page"
import { PopularPage } from "@/components/popular-page"
import { ProfilePage } from "@/components/profile-page"
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'

interface SelectedCommunity {
  name: string
  id: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("communities")
  const [selectedCommunity, setSelectedCommunity] = useState<SelectedCommunity | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const handleResetVerification = () => {
    setIsVerified(false)
  }

  const handleCommunitySelect = (communityName: string, communityId: string) => {
    setSelectedCommunity({ name: communityName, id: communityId })
    setActiveTab("popular")
  }

  const renderContent = () => {
    switch (activeTab) {
      case "communities":
        return <CommunitiesPage 
          onCommunitySelect={handleCommunitySelect} 
          isVerified={isVerified}
          onVerify={handleVerify}
          onResetVerification={handleResetVerification}
        />
      case "popular":
        return <PopularPage 
          communityName={selectedCommunity?.name} 
          communityId={selectedCommunity?.id} 
        />
      case "profile":
        return <ProfilePage />
      default:
        return <CommunitiesPage 
          onCommunitySelect={handleCommunitySelect}
          isVerified={isVerified}
          onVerify={handleVerify}
          onResetVerification={handleResetVerification}
        />
    }
  }

  const handleTabChange = (tab: string) => {
    if (tab === "popular" && activeTab !== "popular") {
      setSelectedCommunity(null)
    }
    setActiveTab(tab)
  }

  const verifyPayload: VerifyCommandInput = {
    action: 'post', // This is your action ID from the Developer Portal
    signal: '0x12312', // Optional additional data
    verification_level: VerificationLevel.Orb, // Orb | Device
  }
  
  const handleVerify = async () => {
    try {
      if (!MiniKit.isInstalled()) {
        console.log('MiniKit not installed')
        return
      }
      
      console.log('Starting verification...')
      // World App will open a drawer prompting the user to confirm the operation, promise is resolved once user confirms or cancels
      const {finalPayload} = await MiniKit.commandsAsync.verify(verifyPayload)
      
      if (finalPayload.status === 'error') {
        console.log('Error payload', finalPayload)
        return
      }
      
      console.log('World ID verification completed, verifying with backend...')
      
      // Verify the proof in the backend
      const verifyResponse = await fetch('/api/varify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult, // Parses only the fields we need to verify
          action: 'post',
          signal: '0x12312', // Optional
        }),
      })
      
      const verifyResponseJson = await verifyResponse.json()
      console.log('Backend verification response:', verifyResponseJson)
      
      if (verifyResponseJson.status === 200) {
        console.log('Verification success!')
        setIsVerified(true)
      } else {
        console.log('Verification failed:', verifyResponseJson)
        throw new Error('Verification failed on backend')
      }
    } catch (error) {
      console.error('Verification error:', error)
      throw error // Re-throw so the modal can handle it
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{renderContent()}</main>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}

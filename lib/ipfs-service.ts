// Types for our data structures
export interface Community {
  id: string
  name: string
  description: string
  created_at: string
  created_by: string
  news_count: number
  total_upvotes: number
}

export interface NewsItem {
  id: string
  title: string
  content: string
  community_id: string
  author_id: string
  ipfs_hash?: string
  upvotes: number
  created_at: string
  updated_at: string
  // Computed fields for display
  community_name?: string
  author_name?: string
  user_upvoted?: boolean
}

export interface Upvote {
  id: string
  news_id: string
  user_id: string
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
  created_at: string
}

// IPFS-based data storage service using Pinata
export class IPFSDataService {
  private static get PINATA_JWT() {
    return process.env.PINATA_JWT
  }
  private static get PINATA_GATEWAY() {
    return process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'
  }
  private static readonly PINATA_API_URL = 'https://api.pinata.cloud'

  // Store data on IPFS via Pinata
  private static async storeData(data: any): Promise<string> {
    try {
      if (!this.PINATA_JWT) {
        console.warn('No PINATA_JWT found, using demo mode')
        // Fallback to demo mode
        const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        console.log(`[IPFS Demo] Stored data with hash: ${mockHash}`)
        return mockHash
      }

      const response = await fetch(`${this.PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `worldfeed-data-${Date.now()}`,
            keyvalues: {
              app: 'worldfeed',
              timestamp: new Date().toISOString()
            }
          }
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Pinata API error:', errorText)
        throw new Error(`Pinata API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log(`[IPFS] Successfully stored data with hash: ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Error storing data on IPFS:', error)
      throw new Error(`Failed to store data on IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Retrieve data from IPFS via Pinata gateway
  private static async getData(hash: string): Promise<any> {
    try {
      if (!hash) {
        return this.getEmptyDataStructure()
      }

      const url = `${this.PINATA_GATEWAY}${hash}`
      console.log(`[IPFS] Fetching data from: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn(`Failed to fetch from IPFS: ${response.status}`)
        return this.getEmptyDataStructure()
      }

      const data = await response.json()
      console.log(`[IPFS] Successfully retrieved data from hash: ${hash}`)
      return data
    } catch (error) {
      console.error('Error retrieving data from IPFS:', error)
      // Return empty data structure on error to prevent app crashes
      return this.getEmptyDataStructure()
    }
  }

  // Get or create the main data structure hash from a simple storage
  private static mainDataHash: string | null = null
  private static dataCache: any = null

  private static async getMainDataHash(): Promise<string | null> {
    if (this.mainDataHash) {
      return this.mainDataHash
    }

    // Always try to get the latest hash from Pinata first
    const latestHash = await this.getLatestHashFromPinata()
    if (latestHash) {
      this.mainDataHash = latestHash
      return latestHash
    }

    // Fallback to environment variable only if Pinata fails
    if (process.env.MAIN_DATA_HASH) {
      console.log('⚠️  Using fallback hash from environment variable')
      this.mainDataHash = process.env.MAIN_DATA_HASH
      return this.mainDataHash
    }

    return null
  }

  private static async getLatestHashFromPinata(): Promise<string | null> {
    try {
      if (!this.PINATA_JWT) {
        return null
      }

      const response = await fetch(`${this.PINATA_API_URL}/data/pinList?status=pinned&pageLimit=10`, {
        headers: {
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
      })

      if (!response.ok) {
        console.warn('Could not fetch latest hash from Pinata')
        return null
      }

      const data = await response.json()
      if (data.rows && data.rows.length > 0) {
        // Filter for worldfeed files and sort by date
        const worldfeedFiles = data.rows.filter((file: any) => 
          file.metadata?.name?.includes('worldfeed') || 
          file.metadata?.keyvalues?.app === 'worldfeed'
        ).sort((a: any, b: any) => 
          new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime()
        )

        if (worldfeedFiles.length > 0) {
          const latestHash = worldfeedFiles[0].ipfs_pin_hash
          console.log(`📥 Found latest WorldFeed data hash from Pinata: ${latestHash}`)
          this.mainDataHash = latestHash
          return latestHash
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching latest hash from Pinata:', error)
      return null
    }
  }

  private static setMainDataHash(hash: string): void {
    this.mainDataHash = hash
    console.log(`New main data hash: ${hash}`)
    console.log(`💾 Data saved to IPFS: https://gateway.pinata.cloud/ipfs/${hash}`)
    console.log(`🔄 Next request will automatically load this latest data`)
  }

  // Initialize empty data structure
  private static getEmptyDataStructure() {
    return {
      communities: [] as Community[],
      news: [] as NewsItem[],
      upvotes: [] as Upvote[],
      profiles: [] as Profile[],
      stats: {
        total_communities: 0,
        total_news: 0,
        total_upvotes: 0,
        total_users: 0
      },
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    }
  }

  // Load all data from IPFS
  private static async loadAllData() {
    // Return cached data if available
    if (this.dataCache) {
      return this.dataCache
    }

    // Try to get main hash (this is now async)
    const mainHash = await this.getMainDataHash()

    if (!mainHash) {
      console.log('📝 No existing data found, starting with empty structure')
      this.dataCache = this.getEmptyDataStructure()
      return this.dataCache
    }

    try {
      console.log(`📥 Loading data from IPFS hash: ${mainHash}`)
      this.dataCache = await this.getData(mainHash)
      console.log(`✅ Successfully loaded data from IPFS (${this.dataCache.communities?.length || 0} communities, ${this.dataCache.news?.length || 0} news)`)
      return this.dataCache
    } catch (error) {
      console.warn('Could not load data from IPFS, starting fresh:', error)
      this.dataCache = this.getEmptyDataStructure()
      return this.dataCache
    }
  }

  // Save all data to IPFS
  private static async saveAllData(data: any): Promise<string> {
    data.lastUpdated = new Date().toISOString()
    const hash = await this.storeData(data)
    this.setMainDataHash(hash)
    
    // Clear cache to force next request to load fresh data from IPFS
    // This ensures we always get the latest data with the new hash
    this.clearCacheAfterSave()
    
    return hash
  }

  // Clear cache to force reload from IPFS
  static clearCache(): void {
    this.dataCache = null
    this.mainDataHash = null
    console.log('🗑️ Cache cleared, will reload from IPFS on next request')
  }

  // Clear cache after saving new data (internal method)
  private static clearCacheAfterSave(): void {
    // Clear the old cached data but keep the new hash
    this.dataCache = null
    console.log('🔄 Cache cleared after save, next request will load fresh data')
  }

  // Generate UUID (simple implementation)
  private static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Communities methods
  static async getCommunities(): Promise<Community[]> {
    const data = await this.loadAllData()
    return data.communities || []
  }

  static async createCommunity(name: string, description: string, createdBy: string): Promise<Community> {
    const data = await this.loadAllData()
    const community: Community = {
      id: this.generateId(),
      name,
      description,
      created_at: new Date().toISOString(),
      created_by: createdBy,
      news_count: 0,
      total_upvotes: 0,
    }

    data.communities = data.communities || []
    data.communities.push(community)
    
    // Update stats
    data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
    data.stats.total_communities = data.communities.length
    
    await this.saveAllData(data)
    return community
  }

  // News methods
  static async getNews(communityId?: string, authorId?: string): Promise<NewsItem[]> {
    const data = await this.loadAllData()
    let news = data.news || []

    if (communityId) {
      news = news.filter((item: NewsItem) => item.community_id === communityId)
    }

    if (authorId) {
      news = news.filter((item: NewsItem) => item.author_id === authorId)
    }

    // Add community names and sort by upvotes
    const communities = data.communities || []
    const profiles = data.profiles || []

    news = news.map((item: NewsItem) => {
      const community = communities.find((c: Community) => c.id === item.community_id)
      const profile = profiles.find((p: Profile) => p.id === item.author_id)
      return {
        ...item,
        community_name: community?.name,
        author_name: profile?.display_name,
      }
    })

    // Sort by upvotes (descending) then by created_at (descending)
    news.sort((a: NewsItem, b: NewsItem) => {
      if (b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return news
  }

  static async createNews(
    title: string,
    content: string,
    communityId: string,
    authorId: string,
    ipfsHash?: string
  ): Promise<NewsItem> {
    const data = await this.loadAllData()
    
    // Verify community exists
    const community = data.communities?.find((c: Community) => c.id === communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    const newsItem: NewsItem = {
      id: this.generateId(),
      title,
      content,
      community_id: communityId,
      author_id: authorId,
      ipfs_hash: ipfsHash,
      upvotes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    data.news = data.news || []
    data.news.push(newsItem)
    
    // Update community stats
    community.news_count = (community.news_count || 0) + 1
    
    // Update global stats
    data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
    data.stats.total_news = data.news.length
    
    await this.saveAllData(data)

    // Add community and author names for response
    const profiles = data.profiles || []
    const profile = profiles.find((p: Profile) => p.id === authorId)

    return {
      ...newsItem,
      community_name: community.name,
      author_name: profile?.display_name,
    }
  }

  // Upvotes methods
  static async toggleUpvote(newsId: string, userId: string): Promise<{ upvoted: boolean; upvotes: number }> {
    const data = await this.loadAllData()
    data.upvotes = data.upvotes || []
    data.news = data.news || []

    console.log(`🔍 Looking for news item: ${newsId}`)
    console.log(`📊 Available news items: ${data.news.map((n: NewsItem) => n.id).join(', ')}`)

    const existingUpvote = data.upvotes.find(
      (upvote: Upvote) => upvote.news_id === newsId && upvote.user_id === userId
    )

    const newsItem = data.news.find((item: NewsItem) => item.id === newsId)
    if (!newsItem) {
      console.error(`❌ News item ${newsId} not found in data`)
      throw new Error('News item not found')
    }

    // Find the community to update its stats
    const community = data.communities?.find((c: Community) => c.id === newsItem.community_id)

    if (existingUpvote) {
      // Remove upvote
      data.upvotes = data.upvotes.filter(
        (upvote: Upvote) => !(upvote.news_id === newsId && upvote.user_id === userId)
      )
      newsItem.upvotes = Math.max(0, newsItem.upvotes - 1)
      
      // Update community stats
      if (community) {
        community.total_upvotes = Math.max(0, (community.total_upvotes || 0) - 1)
      }
      
      // Update global stats
      data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
      data.stats.total_upvotes = data.upvotes.length
      
      await this.saveAllData(data)
      return { upvoted: false, upvotes: newsItem.upvotes }
    } else {
      // Add upvote
      const upvote: Upvote = {
        id: this.generateId(),
        news_id: newsId,
        user_id: userId,
        created_at: new Date().toISOString(),
      }
      data.upvotes.push(upvote)
      newsItem.upvotes += 1
      
      // Update community stats
      if (community) {
        community.total_upvotes = (community.total_upvotes || 0) + 1
      }
      
      // Update global stats
      data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
      data.stats.total_upvotes = data.upvotes.length
      
      await this.saveAllData(data)
      return { upvoted: true, upvotes: newsItem.upvotes }
    }
  }

  static async getUserUpvotes(userId: string): Promise<string[]> {
    const data = await this.loadAllData()
    const upvotes = data.upvotes || []
    return upvotes.filter((upvote: Upvote) => upvote.user_id === userId).map((upvote: Upvote) => upvote.news_id)
  }

  // Get news for a specific community with enhanced data
  static async getCommunityNews(communityId: string, userId?: string): Promise<{
    community: Community | null,
    news: NewsItem[]
  }> {
    const data = await this.loadAllData()
    const community = data.communities?.find((c: Community) => c.id === communityId) || null
    
    if (!community) {
      return { community: null, news: [] }
    }

    let news = data.news?.filter((item: NewsItem) => item.community_id === communityId) || []
    
    // Add author names and user upvote status
    const profiles = data.profiles || []
    const userUpvotes = userId ? await this.getUserUpvotes(userId) : []
    
    news = news.map((item: NewsItem) => {
      const profile = profiles.find((p: Profile) => p.id === item.author_id)
      return {
        ...item,
        community_name: community.name,
        author_name: profile?.display_name,
        user_upvoted: userUpvotes.includes(item.id)
      }
    })

    // Sort by upvotes (descending) then by created_at (descending)
    news.sort((a: NewsItem, b: NewsItem) => {
      if (b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return { community, news }
  }

  // Profile methods
  static async createProfile(userId: string, displayName: string): Promise<Profile> {
    const data = await this.loadAllData()
    data.profiles = data.profiles || []

    const existingProfile = data.profiles.find((p: Profile) => p.id === userId)
    if (existingProfile) {
      return existingProfile
    }

    const profile: Profile = {
      id: userId,
      display_name: displayName,
      created_at: new Date().toISOString(),
    }

    data.profiles.push(profile)
    await this.saveAllData(data)
    return profile
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    const data = await this.loadAllData()
    const profiles = data.profiles || []
    return profiles.find((p: Profile) => p.id === userId) || null
  }

  // Content storage on IPFS
  static async storeContent(content: string, title: string): Promise<string> {
    const contentData = {
      title,
      content,
      timestamp: new Date().toISOString(),
    }
    return await this.storeData(contentData)
  }

  static async getContent(hash: string): Promise<{ title: string; content: string; timestamp: string }> {
    return await this.getData(hash)
  }

  // Get IPFS URL for content
  static getIPFSUrl(hash: string): string {
    return `${this.PINATA_GATEWAY}${hash}`
  }
}

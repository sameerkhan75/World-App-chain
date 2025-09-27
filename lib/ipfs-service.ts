import path from 'node:path'
import fs from 'node:fs/promises'

// Types for our data structures
export interface Community {
  id: string
  name: string
  description: string
  created_at: string
  created_by: string
  creator_name?: string  // Display name of the creator
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

  // Local fallback storage (used when PINATA_JWT is not set)
  private static readonly LOCAL_STORAGE_DIR = path.join(process.cwd(), 'data')
  private static async ensureLocalDir(): Promise<void> {
    try {
      await fs.mkdir(this.LOCAL_STORAGE_DIR, { recursive: true })
    } catch (_) {
      // ignore
    }
  }
  private static localFileForUser(userDisplayName?: string): string {
    if (userDisplayName && userDisplayName.trim().length > 0) {
      const normalized = userDisplayName.toLowerCase().trim()
      return path.join(this.LOCAL_STORAGE_DIR, `worldfeed-user-${normalized}.json`)
    }
    return path.join(this.LOCAL_STORAGE_DIR, 'worldfeed-global.json')
  }
  private static async readLocal(filePath: string): Promise<any | null> {
    try {
      const buf = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(buf)
    } catch (_) {
      return null
    }
  }
  private static async writeLocal(filePath: string, data: any): Promise<void> {
    await this.ensureLocalDir()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }
  private static async localExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch (_) {
      return false
    }
  }

  // Store data on IPFS via Pinata
  private static async storeData(data: any, userDisplayName?: string): Promise<string> {
    try {
      if (!this.PINATA_JWT) {
        // Local persistence fallback: write to disk instead of returning random mock hash
        const localPath = this.localFileForUser(userDisplayName)
        await this.writeLocal(localPath, data)
        const localHash = `local:${path.basename(localPath)}`
        const logPrefix = userDisplayName ? `[LOCAL User:${userDisplayName}]` : '[LOCAL Global]'
        console.log(`${logPrefix} Stored data at ${localPath} with ref: ${localHash}`)
        return localHash
      }

      // Create metadata for user-specific or global data
      const timestamp = new Date().toISOString()
      const metadata: any = {
        name: userDisplayName 
          ? `worldfeed-user-${userDisplayName.toLowerCase().trim()}-${Date.now()}`
          : `worldfeed-data-${Date.now()}`,
        keyvalues: {
          app: 'worldfeed',
          timestamp
        }
      }

      // Add user identifier if this is user-specific data
      if (userDisplayName) {
        metadata.keyvalues.user = userDisplayName.toLowerCase().trim()
        metadata.keyvalues.type = 'user-data'
      } else {
        metadata.keyvalues.type = 'global-data'
      }

      const response = await fetch(`${this.PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: metadata
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Pinata API error:', errorText)
        throw new Error(`Pinata API error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      const logPrefix = userDisplayName ? `[IPFS User:${userDisplayName}]` : '[IPFS Global]'
      console.log(`${logPrefix} Successfully stored data with hash: ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Error storing data on IPFS:', error)
      throw new Error(`Failed to store data on IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Retrieve data from IPFS via Pinata gateway
  private static async getData(hash: string): Promise<any> {
    try {
      if (!hash || hash.trim() === '') {
        console.warn('Empty hash provided, returning empty structure')
        return this.getEmptyDataStructure()
      }

      // Local fallback loader
      if (hash.startsWith('local:')) {
        const fileName = hash.replace('local:', '')
        const filePath = path.join(this.LOCAL_STORAGE_DIR, fileName)
        const data = await this.readLocal(filePath)
        if (!data) {
          console.warn(`Local data not found at ${filePath}, returning empty structure`)
          return this.getEmptyDataStructure()
        }
        return data
      }

      const url = `${this.PINATA_GATEWAY}${hash}`
      console.log(`[IPFS] Fetching data from: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        console.warn(`Failed to fetch from IPFS: ${response.status} ${response.statusText}`)
        // If it's a 404, the hash might be invalid
        if (response.status === 404) {
          console.error(`❌ Hash not found on IPFS: ${hash}`)
        }
        return this.getEmptyDataStructure()
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON, might be corrupted data')
        return this.getEmptyDataStructure()
      }

      const data = await response.json()
      
      // Validate the structure
      if (!data || typeof data !== 'object') {
        console.warn('Invalid data structure received from IPFS')
        return this.getEmptyDataStructure()
      }

      // Ensure required fields exist
      if (!Array.isArray(data.communities) || !Array.isArray(data.news)) {
        console.warn('Missing required arrays in data structure, fixing...')
        data.communities = data.communities || []
        data.news = data.news || []
        data.upvotes = data.upvotes || []
        data.profiles = data.profiles || []
        data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
      }

      console.log(`[IPFS] Successfully retrieved and validated data from hash: ${hash}`)
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
  private static isLoading = false
  private static isSaving = false
  
  // User-specific data storage
  private static userDataHashes = new Map<string, string>() // displayName -> hash
  private static userDataCaches = new Map<string, any>() // displayName -> data
  private static userLoadingStates = new Map<string, boolean>() // displayName -> loading
  private static userSavingStates = new Map<string, boolean>() // displayName -> saving

  // Get user-specific data hash
  private static async getUserDataHash(userDisplayName: string): Promise<string | null> {
    const normalizedName = userDisplayName.toLowerCase().trim()
    
    if (this.userDataHashes.has(normalizedName)) {
      return this.userDataHashes.get(normalizedName) || null
    }

    // Try to get the latest hash for this user from Pinata
    const latestHash = await this.getLatestHashFromPinata(normalizedName)
    if (latestHash) {
      this.userDataHashes.set(normalizedName, latestHash)
      return latestHash
    }

    return null
  }

  // Set user-specific data hash
  private static setUserDataHash(userDisplayName: string, hash: string): void {
    const normalizedName = userDisplayName.toLowerCase().trim()
    this.userDataHashes.set(normalizedName, hash)
    console.log(`📝 User data hash set for ${normalizedName}: ${hash}`)
  }

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

  private static async getLatestHashFromPinata(userDisplayName?: string): Promise<string | null> {
    try {
      if (!this.PINATA_JWT) {
        // Fallback to local files
        const candidate = this.localFileForUser(userDisplayName)
        if (await this.localExists(candidate)) {
          const localHash = `local:${path.basename(candidate)}`
          if (userDisplayName) {
            console.log(`📥 Using local user data for ${userDisplayName}: ${localHash}`)
          } else {
            console.log(`📥 Using local global data: ${localHash}`)
            this.mainDataHash = localHash
          }
          return localHash
        }
        return null
      }

      const response = await fetch(`${this.PINATA_API_URL}/data/pinList?status=pinned&pageLimit=20`, {
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
        let worldfeedFiles = data.rows.filter((file: any) => 
          file.metadata?.name?.includes('worldfeed') || 
          file.metadata?.keyvalues?.app === 'worldfeed'
        )

        // If userDisplayName is provided, filter for user-specific data
        if (userDisplayName) {
          const normalizedName = userDisplayName.toLowerCase().trim()
          worldfeedFiles = worldfeedFiles.filter((file: any) => 
            file.metadata?.keyvalues?.user === normalizedName ||
            file.metadata?.name?.includes(`user-${normalizedName}`)
          )
        } else {
          // For global data, exclude user-specific files
          worldfeedFiles = worldfeedFiles.filter((file: any) => 
            !file.metadata?.keyvalues?.user &&
            !file.metadata?.name?.includes('user-')
          )
        }

        // Sort by date (newest first)
        worldfeedFiles.sort((a: any, b: any) => 
          new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime()
        )

        if (worldfeedFiles.length > 0) {
          const latestHash = worldfeedFiles[0].ipfs_pin_hash
          if (userDisplayName) {
            console.log(`📥 Found latest user data hash for ${userDisplayName}: ${latestHash}`)
          } else {
            console.log(`📥 Found latest global data hash: ${latestHash}`)
            this.mainDataHash = latestHash
          }
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

  // Load user-specific data from IPFS
  private static async loadUserData(userDisplayName: string) {
    const normalizedName = userDisplayName.toLowerCase().trim()
    
    // Return cached data if available
    if (this.userDataCaches.has(normalizedName)) {
      return this.userDataCaches.get(normalizedName)
    }

    // Prevent concurrent loading
    if (this.userLoadingStates.get(normalizedName)) {
      console.log(`⏳ Already loading data for ${normalizedName}, waiting...`)
      while (this.userLoadingStates.get(normalizedName)) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return this.userDataCaches.get(normalizedName) || this.getEmptyDataStructure()
    }

    this.userLoadingStates.set(normalizedName, true)
    
    try {
      // Try to get user-specific hash
      const userHash = await this.getUserDataHash(normalizedName)

      if (!userHash) {
        console.log(`📝 No existing data found for ${normalizedName}, starting with empty structure`)
        const emptyData = this.getEmptyDataStructure()
        this.userDataCaches.set(normalizedName, emptyData)
        return emptyData
      }

      console.log(`📥 Loading data for ${normalizedName} from IPFS hash: ${userHash}`)
      const userData = await this.getData(userHash)
      
      // Validate the loaded data
      if (!userData || typeof userData !== 'object') {
        console.warn(`⚠️ Invalid data structure loaded for ${normalizedName}, using empty structure`)
        const emptyData = this.getEmptyDataStructure()
        this.userDataCaches.set(normalizedName, emptyData)
        return emptyData
      } else {
        console.log(`✅ Successfully loaded data for ${normalizedName} (${userData.communities?.length || 0} communities, ${userData.news?.length || 0} news)`)
        this.userDataCaches.set(normalizedName, userData)
        return userData
      }
    } catch (error) {
      console.warn(`Could not load data for ${normalizedName} from IPFS, starting fresh:`, error)
      const emptyData = this.getEmptyDataStructure()
      this.userDataCaches.set(normalizedName, emptyData)
      return emptyData
    } finally {
      this.userLoadingStates.set(normalizedName, false)
    }
  }

  // Load all data from IPFS (keeping for backward compatibility, but now loads for current user)
  private static async loadAllData(userDisplayName?: string) {
    if (userDisplayName) {
      return await this.loadUserData(userDisplayName)
    }

    // Return cached data if available
    if (this.dataCache) {
      return this.dataCache
    }

    // Prevent concurrent loading
    if (this.isLoading) {
      console.log('⏳ Already loading data, waiting...')
      // Wait for current loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return this.dataCache || this.getEmptyDataStructure()
    }

    this.isLoading = true
    
    try {
      // Try to get main hash (this is now async)
      const mainHash = await this.getMainDataHash()

      if (!mainHash) {
        console.log('📝 No existing data found, starting with empty structure')
        this.dataCache = this.getEmptyDataStructure()
        return this.dataCache
      }

      console.log(`📥 Loading data from IPFS hash: ${mainHash}`)
      this.dataCache = await this.getData(mainHash)
      
      // Validate the loaded data
      if (!this.dataCache || typeof this.dataCache !== 'object') {
        console.warn('⚠️ Invalid data structure loaded, using empty structure')
        this.dataCache = this.getEmptyDataStructure()
      } else {
        console.log(`✅ Successfully loaded data from IPFS (${this.dataCache.communities?.length || 0} communities, ${this.dataCache.news?.length || 0} news)`)
      }
      
      return this.dataCache
    } catch (error) {
      console.warn('Could not load data from IPFS, starting fresh:', error)
      this.dataCache = this.getEmptyDataStructure()
      return this.dataCache
    } finally {
      this.isLoading = false
    }
  }

  // Save user-specific data to IPFS
  private static async saveUserData(data: any, userDisplayName: string): Promise<string> {
    const normalizedName = userDisplayName.toLowerCase().trim()
    
    // Prevent concurrent saves for this user
    if (this.userSavingStates.get(normalizedName)) {
      console.log(`⏳ Already saving data for ${normalizedName}, waiting...`)
      while (this.userSavingStates.get(normalizedName)) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      // Return the current hash if available
      return this.userDataHashes.get(normalizedName) || ''
    }

    this.userSavingStates.set(normalizedName, true)
    
    try {
      // Validate data before saving
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure for saving')
      }
      
      // Ensure required fields exist
      data.communities = data.communities || []
      data.news = data.news || []
      data.upvotes = data.upvotes || []
      data.profiles = data.profiles || []
      data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
      data.lastUpdated = new Date().toISOString()
      data.version = data.version || '1.0'
      data.owner = normalizedName // Mark data ownership
      
      console.log(`💾 Saving data for ${normalizedName} to IPFS (${data.communities.length} communities, ${data.news.length} news)`)
      const hash = await this.storeData(data, normalizedName)
      
      if (!hash) {
        throw new Error('Failed to get hash from IPFS storage')
      }
      
      this.setUserDataHash(normalizedName, hash)
      
      // Update cache with the new data instead of clearing it
      this.userDataCaches.set(normalizedName, data)
      
      console.log(`✅ Data for ${normalizedName} successfully saved to IPFS with hash: ${hash}`)
      return hash
    } catch (error) {
      console.error(`❌ Error saving data for ${normalizedName} to IPFS:`, error)
      throw error
    } finally {
      this.userSavingStates.set(normalizedName, false)
    }
  }

  // Save all data to IPFS (keeping for backward compatibility, but now saves for current user)
  private static async saveAllData(data: any, userDisplayName?: string): Promise<string> {
    if (userDisplayName) {
      return await this.saveUserData(data, userDisplayName)
    }

    // Prevent concurrent saves
    if (this.isSaving) {
      console.log('⏳ Already saving data, waiting...')
      while (this.isSaving) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      // Return the current hash if available
      return this.mainDataHash || ''
    }

    this.isSaving = true
    
    try {
      // Validate data before saving
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure for saving')
      }
      
      // Ensure required fields exist
      data.communities = data.communities || []
      data.news = data.news || []
      data.upvotes = data.upvotes || []
      data.profiles = data.profiles || []
      data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
      data.lastUpdated = new Date().toISOString()
      data.version = data.version || '1.0'
      
      console.log(`💾 Saving data to IPFS (${data.communities.length} communities, ${data.news.length} news)`)
      const hash = await this.storeData(data)
      
      if (!hash) {
        throw new Error('Failed to get hash from IPFS storage')
      }
      
      this.setMainDataHash(hash)
      
      // Update cache with the new data instead of clearing it
      this.dataCache = data
      
      console.log(`✅ Data successfully saved to IPFS with hash: ${hash}`)
      return hash
    } catch (error) {
      console.error('❌ Error saving data to IPFS:', error)
      throw error
    } finally {
      this.isSaving = false
    }
  }

  // Clear cache to force reload from IPFS
  static clearCache(): void {
    this.dataCache = null
    this.mainDataHash = null
    console.log('🗑️ Cache cleared, will reload from IPFS on next request')
  }

  // Method to get current data hash for debugging
  static getCurrentHash(): string | null {
    return this.mainDataHash
  }

  // Method to validate current data integrity
  static async validateData(): Promise<{ isValid: boolean; hash: string | null; dataSize: number }> {
    try {
      const data = await this.loadAllData()
      const hash = this.mainDataHash
      
      const isValid = !!(
        data &&
        typeof data === 'object' &&
        Array.isArray(data.communities) &&
        Array.isArray(data.news) &&
        Array.isArray(data.upvotes) &&
        Array.isArray(data.profiles)
      )
      
      return {
        isValid,
        hash,
        dataSize: JSON.stringify(data).length
      }
    } catch (error) {
      return { isValid: false, hash: null, dataSize: 0 }
    }
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
  static async getCommunities(userDisplayName?: string): Promise<Community[]> {
    // Communities should be global, not user-specific
    const data = await this.loadAllData() // Load global data
    return data.communities || []
  }

  static async createCommunity(name: string, description: string, createdBy: string, userDisplayName?: string): Promise<Community> {
    // Communities should be global, not user-specific
    const data = await this.loadAllData() // Load global data
    const community: Community = {
      id: this.generateId(),
      name,
      description,
      created_at: new Date().toISOString(),
      created_by: createdBy,
      creator_name: userDisplayName,
      news_count: 0,
      total_upvotes: 0,
    }

    data.communities = data.communities || []
    data.communities.push(community)
    
    // Update stats
    data.stats = data.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
    data.stats.total_communities = data.communities.length
    
    await this.saveAllData(data) // Save to global data
    return community
  }

  // News methods
  static async getNews(communityId?: string, authorId?: string, userDisplayName?: string): Promise<NewsItem[]> {
    const data = await this.loadAllData(userDisplayName)
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
        author_name: item.author_name || profile?.display_name, // Use existing author_name first, then fallback to profile
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
    ipfsHash?: string,
    userDisplayName?: string
  ): Promise<NewsItem> {
    console.log('🔵 createNews called with:', { title, communityId, authorId, hasIpfsHash: !!ipfsHash, userDisplayName })
    
    try {
      // Load global data to check if community exists
      console.log('📥 Loading global data to verify community exists...')
      const globalData = await this.loadAllData() // Global data for community verification
      console.log('✅ Global data loaded, communities:', globalData.communities?.length)
      
      // Verify community exists in global data
      console.log('🔍 Looking for community in global data:', communityId)
      console.log('🔍 Target community ID details:', {
        type: typeof communityId,
        value: communityId,
        stringified: JSON.stringify(communityId),
        length: communityId?.length
      })
      console.log('🔍 Global data structure:', {
        hasGlobalData: !!globalData,
        hasCommunitiesArray: !!globalData.communities,
        communitiesCount: globalData.communities?.length || 0,
        allCommunityIds: globalData.communities?.map((c: Community) => c.id) || [],
        allCommunityIdsWithTypes: globalData.communities?.map((c: Community) => ({ id: c.id, type: typeof c.id, stringified: JSON.stringify(c.id) })) || [],
        targetCommunityId: communityId
      })
      
      let community = globalData.communities?.find((c: Community) => c.id === communityId)
      if (!community) {
        console.warn('⚠️ Community not found on first pass. Forcing fresh global reload...')
        // Force a fresh reload of global data to avoid stale cache issues
        this.dataCache = null
        this.mainDataHash = await this.getLatestHashFromPinata() || this.mainDataHash
        const reloadedGlobal = await this.loadAllData()
        community = reloadedGlobal.communities?.find((c: Community) => c.id === communityId)

        if (!community) {
          console.error('❌ Community still not found after reload.')
          console.error('❌ Available communities:', reloadedGlobal.communities?.map((c: Community) => ({ id: c.id, name: c.name })))
          console.error('❌ Looking for community ID:', communityId)

          // Check if the community exists in user data for diagnostics
          console.log('🔍 Checking user data for community...')
          const userData = await this.loadAllData(userDisplayName)
          console.log('🔍 User data communities:', userData.communities?.map((c: Community) => ({ id: c.id, name: c.name })))
          
          throw new Error(`Community not found: ${communityId}`)
        }
      }
      console.log('✅ Community found in global data:', community.name)

      // Now load user-specific data for saving the news item
      console.log('📥 Loading current user data for saving news item:', userDisplayName)
      const data = await this.loadAllData(userDisplayName)
      console.log('✅ User data loaded, news:', data.news?.length)

      console.log('🆔 Generating news item ID...')
      const newsItem: NewsItem = {
        id: this.generateId(),
        title,
        content,
        community_id: communityId,
        author_id: authorId,
        author_name: userDisplayName,
        ipfs_hash: ipfsHash,
        upvotes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      console.log('✅ News item created with ID:', newsItem.id)

      // Ensure news array exists
      data.news = data.news || []
      console.log('📝 Adding news item to array. Current count:', data.news.length)
      data.news.push(newsItem)
      console.log('✅ News item added. New count:', data.news.length)
      
      // Update community stats in global data
      console.log('📊 Updating community stats in global data...')
      community.news_count = (community.news_count || 0) + 1
      
      // Update global stats
      globalData.stats = globalData.stats || { total_communities: 0, total_news: 0, total_upvotes: 0, total_users: 0 }
      globalData.stats.total_news = (globalData.stats.total_news || 0) + 1
      console.log('✅ Global stats updated. Total news:', globalData.stats.total_news)
      
      console.log('💾 Saving user data to IPFS...')
      await this.saveAllData(data, userDisplayName)
      console.log('💾 Saving global data to IPFS...')
      await this.saveAllData(globalData) // Save updated global stats
      console.log('✅ Data saved successfully')

      // Add community and author names for response
      console.log('👤 Looking up author profile...')
      const profiles = data.profiles || []
      const profile = profiles.find((p: Profile) => p.id === authorId)
      console.log('✅ Author profile found:', profile?.display_name || 'No profile found')

      const result = {
        ...newsItem,
        community_name: community.name,
        author_name: userDisplayName || profile?.display_name, // Use userDisplayName first, then fallback to profile
      }
      
      console.log('✅ createNews completed successfully for:', result.id)
      return result
    } catch (error) {
      console.error('❌ Error in createNews:', error)
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack')
      throw error
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

  static async getUserUpvotes(userId: string, userDisplayName?: string): Promise<string[]> {
    const data = await this.loadAllData(userDisplayName)
    const upvotes = data.upvotes || []
    return upvotes.filter((upvote: Upvote) => upvote.user_id === userId).map((upvote: Upvote) => upvote.news_id)
  }

  // Get news for a specific community with enhanced data
  static async getCommunityNews(communityId: string, userId?: string, userDisplayName?: string): Promise<{
    community: Community | null,
    news: NewsItem[]
  }> {
    // Load global data to get community info
    const globalData = await this.loadAllData()
    const community = globalData.communities?.find((c: Community) => c.id === communityId) || null
    
    if (!community) {
      return { community: null, news: [] }
    }

    // Load user-specific data to get news items
    const data = await this.loadAllData(userDisplayName)

    let news = data.news?.filter((item: NewsItem) => item.community_id === communityId) || []
    
    // Add author names and user upvote status
    const profiles = data.profiles || []
    const userUpvotes = userId ? await this.getUserUpvotes(userId, userDisplayName) : []
    
    news = news.map((item: NewsItem) => {
      const profile = profiles.find((p: Profile) => p.id === item.author_id)
      return {
        ...item,
        community_name: community.name,
        author_name: item.author_name || profile?.display_name, // Use existing author_name first, then fallback to profile
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

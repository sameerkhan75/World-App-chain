# IPFS Integration Setup Guide

This application has been migrated from Supabase to use IPFS as the backend storage solution.

## What Changed

- **Removed**: Supabase dependencies and authentication
- **Added**: IPFS-based data storage with local fallback
- **Added**: Simple session-based authentication for demo purposes

## Quick Start (Development Mode)

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Copy environment file:**
   ```bash
   cp env.example .env.local
   ```

3. **Start the application:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

The app will work in demo mode without any IPFS configuration. Data will be stored temporarily in memory.

## Production IPFS Setup

### Option 1: Using Pinata (Recommended)

1. **Sign up for Pinata:** https://pinata.cloud
2. **Get your JWT token** from the API keys section
3. **Update your `.env.local`:**
   ```
   PINATA_JWT=your_pinata_jwt_token_here
   PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
   NODE_ENV=production
   ```

### Option 2: Local IPFS Node

1. **Install IPFS:** https://docs.ipfs.io/install/
2. **Initialize and start IPFS:**
   ```bash
   ipfs init
   ipfs daemon
   ```
3. **Update your `.env.local`:**
   ```
   IPFS_API_HOST=localhost
   IPFS_API_PORT=5001
   IPFS_API_PROTOCOL=http
   NODE_ENV=development
   ```

### Option 3: Infura IPFS

1. **Sign up for Infura:** https://infura.io
2. **Create an IPFS project**
3. **Update your `.env.local`:**
   ```
   IPFS_API_HOST=ipfs.infura.io
   IPFS_API_PORT=5001
   IPFS_API_PROTOCOL=https
   # Add authentication headers in the code
   ```

## Data Structure

The application stores all data in a single IPFS object with the following structure:

```json
{
  "communities": [
    {
      "id": "uuid",
      "name": "Community Name",
      "description": "Description",
      "created_at": "ISO date",
      "created_by": "user_id"
    }
  ],
  "news": [
    {
      "id": "uuid",
      "title": "News Title",
      "content": "News content",
      "community_id": "uuid",
      "author_id": "user_id",
      "ipfs_hash": "content_hash",
      "upvotes": 0,
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ],
  "upvotes": [
    {
      "id": "uuid",
      "news_id": "uuid",
      "user_id": "user_id",
      "created_at": "ISO date"
    }
  ],
  "profiles": [
    {
      "id": "user_id",
      "display_name": "User Name",
      "created_at": "ISO date"
    }
  ],
  "lastUpdated": "ISO date"
}
```

## Authentication

The current implementation uses a simple demo authentication system:

- **Demo Users**: Pre-defined users for testing
- **Session Cookies**: Simple base64-encoded session tokens
- **No Passwords**: For demo purposes only

### For Production

Replace the demo authentication with a proper solution:

1. **JWT-based authentication**
2. **OAuth providers** (Google, GitHub, etc.)
3. **Web3 authentication** (MetaMask, WalletConnect)
4. **Traditional email/password** with proper hashing

## API Endpoints

- `GET /api/communities` - Get all communities
- `POST /api/communities` - Create a new community
- `GET /api/news` - Get news (with optional filters)
- `POST /api/news` - Create a new news item
- `POST /api/news/[id]/upvote` - Toggle upvote on news item
- `POST /api/auth/login` - Demo login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

## Key Features

1. **Decentralized Storage**: All data stored on IPFS
2. **Immutable Content**: News content can be stored with IPFS hashes
3. **Community-based**: Users can create communities and post news
4. **Upvoting System**: Users can upvote news items
5. **Popular Feed**: Shows news sorted by upvotes

## Troubleshooting

### Common Issues

1. **"Failed to connect to IPFS"**
   - Check if your IPFS node is running
   - Verify API endpoint configuration
   - Try demo mode first

2. **"Unauthorized" errors**
   - Check if you're logged in (use demo login)
   - Verify session cookies are set

3. **Data not persisting**
   - In demo mode, data is temporary
   - Configure proper IPFS setup for persistence
   - Check MAIN_DATA_HASH environment variable

### Demo Mode

The application includes a demo mode that works without any IPFS setup:
- Data is stored in memory (not persistent)
- Simulates IPFS operations
- Perfect for development and testing

## Next Steps

1. **Set up proper IPFS hosting** (Pinata, Infura, or local node)
2. **Implement real authentication** system
3. **Add data validation** and error handling
4. **Implement caching** for better performance
5. **Add backup/restore** functionality
6. **Consider using IPNS** for mutable data references

## Support

For issues or questions about the IPFS integration, please check:
- IPFS Documentation: https://docs.ipfs.io
- Pinata Documentation: https://docs.pinata.cloud
- This implementation in the `/lib/ipfs-service.ts` file

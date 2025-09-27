# 🚀 WorldFeed Quick Start Guide

## Your IPFS Integration is Working! ✅

Your communities are now being saved to IPFS via Pinata. Here's how to use your app:

## 1. Start the App
```bash
npm run dev
```

## 2. Open in Browser
Visit: http://localhost:3000

## 3. Login
When you open the app, you'll see a login modal:
- Enter any display name (or leave blank for "Anonymous User")
- Click "Continue"
- This creates a demo session

## 4. Create Communities
- Go to the "Communities" tab
- Click "Add Community"
- Enter a name and description
- Click "Create"

## 5. Create News Posts
- Click on a community to open it
- Click the "Post" button
- Enter your news title and content
- Click "Create Post"

## 6. Upvote News
- Click the "Upvote" button on any news item
- The count will increase and the data is saved to IPFS

## ✅ What's Working

1. **Authentication**: Simple session-based auth (demo mode)
2. **Communities**: Created and stored on IPFS
3. **News Posts**: Stored on IPFS with content
4. **Upvotes**: Tracked and persisted on IPFS
5. **Data Persistence**: All data saved to Pinata/IPFS

## 📊 Check Your Data

### View Stored Data
- Communities: http://localhost:3000/api/communities
- Debug Info: http://localhost:3000/api/debug/data
- Pinata Status: http://localhost:3000/api/debug/pinata

### View on IPFS
Your latest data hash is shown in the server console. You can view it at:
```
https://gateway.pinata.cloud/ipfs/YOUR_HASH_HERE
```

## 💡 Tips

1. **Keep the server console open** to see IPFS hashes being generated
2. **Data persists in memory** during the session
3. **To persist across restarts**, copy the MAIN_DATA_HASH from console to `.env.local`

## 🔍 Troubleshooting

If you get "Unauthorized" errors:
1. Make sure you're logged in (check for user badge at top)
2. If not, refresh the page - login modal will appear
3. Enter any name and continue

## 📝 Your Data on IPFS

Every action creates a new IPFS hash containing all your data:
- Communities list
- News items with content
- Upvote counts
- User profiles

Example IPFS data structure:
```json
{
  "communities": [...],
  "news": [...],
  "upvotes": [...],
  "profiles": [...],
  "lastUpdated": "2024-..."
}
```

## 🎉 Success!

Your decentralized social platform is running on IPFS! Every community, post, and upvote is stored on the distributed web.

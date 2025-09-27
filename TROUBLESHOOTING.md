# 🔧 IPFS Integration Troubleshooting Guide

## Quick Diagnosis Steps

### 1. Test Your IPFS Connection
```bash
node test-ipfs.js
```
This will verify:
- JWT token is present and valid
- Pinata authentication works
- You can pin and retrieve data

### 2. Check Your Environment Variables
Make sure you have `.env.local` file with:
```
PINATA_JWT=your_actual_jwt_token_here
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
NODE_ENV=development
```

### 3. Debug Endpoints
Start your app and visit these URLs:

- **Check Pinata Connection:** http://localhost:3000/api/debug/pinata
- **View Current Data:** http://localhost:3000/api/debug/data

## Common Issues and Solutions

### Issue: "Communities not saving"

**Symptoms:**
- Click "Add Community" → Enter name → Click "Create" → Nothing happens
- Community doesn't appear in the list

**Solutions:**

1. **Check Browser Console (F12)**
   - Look for error messages
   - Check Network tab for failed requests

2. **Check Server Console**
   - Look for `[IPFS]` log messages
   - Check for JWT token errors

3. **Verify API is working:**
   ```bash
   curl -X POST http://localhost:3000/api/communities \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Community","description":"Testing"}'
   ```

### Issue: "Unauthorized" error

**Solution:**
The app uses demo authentication. You need to be "logged in":

1. Open browser DevTools Console
2. Run this command:
   ```javascript
   fetch('/api/auth/login', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({email: 'demo@example.com', displayName: 'Demo User'})
   }).then(r => r.json()).then(console.log)
   ```
3. Refresh the page
4. Try creating a community again

### Issue: "Failed to store data on IPFS"

**Solutions:**

1. **Check JWT Token Permissions:**
   - Files: Write ✅
   - Gateways: Read ✅

2. **Test Pinata directly:**
   ```bash
   node test-ipfs.js
   ```

3. **Check Pinata Dashboard:**
   - Login to pinata.cloud
   - Check API Keys section
   - Verify your JWT is active

### Issue: "Data not persisting between sessions"

**Current Behavior:**
The app stores data in memory + IPFS. When you restart, it starts fresh unless you save the MAIN_DATA_HASH.

**Solution:**
1. After creating communities, check server console for:
   ```
   💾 Save this hash to your .env.local as MAIN_DATA_HASH=QmXXXXXXXXX
   ```

2. Add that hash to your `.env.local`:
   ```
   MAIN_DATA_HASH=QmXXXXXXXXX
   ```

3. Restart the app - your data will load from IPFS

## Step-by-Step Testing Guide

### 1. Fresh Setup Test
```bash
# 1. Create .env.local with your JWT
echo "PINATA_JWT=your_token_here" > .env.local

# 2. Test IPFS connection
node test-ipfs.js

# 3. Start the app
npm run dev

# 4. Visit debug endpoint
open http://localhost:3000/api/debug/pinata
```

### 2. Create Community Test
```bash
# 1. Login (create session)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","displayName":"Test User"}' \
  -c cookies.txt

# 2. Create community
curl -X POST http://localhost:3000/api/communities \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Community","description":"Testing IPFS"}'

# 3. Check if it was saved
curl http://localhost:3000/api/debug/data
```

### 3. Manual Browser Test
1. Open http://localhost:3000
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Login with this command:
   ```javascript
   await fetch('/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email: 'demo@example.com'})})
   ```
5. Go to Communities tab
6. Click "Add Community"
7. Enter name and description
8. Click "Create"
9. Check Console for errors
10. Check Network tab for API calls

## What's Happening Behind the Scenes

When you create a community:

1. **Frontend** sends POST to `/api/communities`
2. **API** checks if user is authenticated (demo auth)
3. **API** loads current data from IPFS (or empty structure)
4. **API** adds new community to data
5. **API** uploads updated data to Pinata
6. **API** gets new IPFS hash
7. **API** stores hash in memory
8. **Frontend** refreshes community list

## Debug Checklist

- [ ] `.env.local` file exists
- [ ] `PINATA_JWT` is set correctly
- [ ] `node test-ipfs.js` passes all tests
- [ ] `/api/debug/pinata` shows `hasJWT: true`
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 OK responses
- [ ] Server console shows `[IPFS] Successfully stored data`

## Still Not Working?

1. **Clear everything and start fresh:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+ 
   ```

3. **Try demo mode (no Pinata):**
   Remove `PINATA_JWT` from `.env.local` and the app will use in-memory storage

4. **Enable verbose logging:**
   Add to your `.env.local`:
   ```
   DEBUG=true
   ```

## Contact for Help

If you're still having issues:
1. Check the server console for detailed error messages
2. Check browser console for client-side errors
3. Visit `/api/debug/pinata` and `/api/debug/data` for system status
4. The error messages will guide you to the specific problem

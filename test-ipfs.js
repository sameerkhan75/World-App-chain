// Test script to verify IPFS/Pinata connection
// Run with: node test-ipfs.js

require('dotenv').config({ path: '.env.local' });

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud';

console.log('🔍 Testing IPFS/Pinata Connection...\n');
console.log('JWT Token present:', PINATA_JWT ? `Yes (${PINATA_JWT.substring(0, 10)}...)` : 'No');

async function testPinataConnection() {
  if (!PINATA_JWT) {
    console.error('❌ No PINATA_JWT found in .env.local');
    console.log('\n📝 Please add your Pinata JWT to .env.local:');
    console.log('PINATA_JWT=your_actual_jwt_token_here\n');
    return;
  }

  try {
    // Test 1: Check authentication
    console.log('\n📡 Testing Pinata authentication...');
    const authResponse = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Authentication failed:', errorText);
      console.log('\n💡 Check that your JWT token has the correct permissions');
      return;
    }

    console.log('✅ Authentication successful!');

    // Test 2: List pinned files
    console.log('\n📂 Fetching pinned files...');
    const listResponse = await fetch(`${PINATA_API_URL}/data/pinList?status=pinned&pageLimit=5`, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('❌ Failed to list files:', errorText);
      return;
    }

    const listData = await listResponse.json();
    console.log(`✅ Found ${listData.count || 0} pinned files`);

    // Test 3: Try to pin a test object
    console.log('\n📤 Testing data pinning...');
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'WorldFeed IPFS test'
    };

    const pinResponse = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: testData,
        pinataMetadata: {
          name: `test-${Date.now()}`,
          keyvalues: {
            app: 'worldfeed-test'
          }
        }
      }),
    });

    if (!pinResponse.ok) {
      const errorText = await pinResponse.text();
      console.error('❌ Failed to pin data:', errorText);
      console.log('\n💡 Make sure your JWT has "Write" permission for Files');
      return;
    }

    const pinData = await pinResponse.json();
    console.log('✅ Successfully pinned test data!');
    console.log('   IPFS Hash:', pinData.IpfsHash);
    console.log('   Gateway URL:', `https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`);

    // Test 4: Retrieve the pinned data
    console.log('\n📥 Testing data retrieval...');
    const gatewayResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`);
    
    if (!gatewayResponse.ok) {
      console.error('❌ Failed to retrieve data from gateway');
      console.log('\n💡 Make sure your JWT has "Read" permission for Gateways');
      return;
    }

    const retrievedData = await gatewayResponse.json();
    console.log('✅ Successfully retrieved data from IPFS!');
    console.log('   Data:', JSON.stringify(retrievedData, null, 2));

    console.log('\n🎉 All tests passed! Your IPFS setup is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Create a community');
    console.log('3. Check the server console for the IPFS hash');
    console.log('4. Visit /api/debug/pinata to see your pinned files');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.log('\n💡 Common issues:');
    console.log('- Check your internet connection');
    console.log('- Verify your JWT token is correct');
    console.log('- Ensure your Pinata account is active');
  }
}

testPinataConnection();

#!/usr/bin/env node

const fetch = require('node-fetch');

async function createDemoNews() {
    try {
        // First, login to create a session
        console.log('🔐 Creating demo session...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'demo@example.com',
                displayName: 'Demo User'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login successful');

        // Get or create communities
        console.log('📋 Fetching communities...');
        let debugResponse = await fetch('http://localhost:3000/api/debug/data');
        let debugData = await debugResponse.json();
        
        let communityId;
        if (!debugData.communities || debugData.communities.length === 0) {
            console.log('📋 No communities found, creating one...');
            
            const communityResponse = await fetch('http://localhost:3000/api/communities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies
                },
                body: JSON.stringify({
                    name: 'Tech News',
                    description: 'Latest technology news and innovations from around the world'
                })
            });

            if (communityResponse.ok) {
                const communityData = await communityResponse.json();
                communityId = communityData.community.id;
                console.log(`✅ Created community: Tech News (${communityId})`);
            } else {
                throw new Error(`Failed to create community: ${communityResponse.status}`);
            }
        } else {
            communityId = debugData.communities[0].id;
            console.log(`📰 Using existing community: ${debugData.communities[0].name} (${communityId})`);
        }

        // Demo news data
        const newsItems = [
            {
                title: "Breaking: Major Technology Breakthrough",
                content: "Scientists have announced a groundbreaking discovery that could revolutionize the tech industry. This breakthrough promises to change how we interact with technology in our daily lives."
            },
            {
                title: "Industry Report: Market Trends 2024",
                content: "The latest industry report shows significant growth in emerging technologies. Market analysts predict continued expansion in the sector over the next quarter."
            },
            {
                title: "New Innovation Hub Opens Downtown",
                content: "A state-of-the-art innovation hub has opened its doors to startups and entrepreneurs. The facility offers cutting-edge resources and collaborative spaces for the tech community."
            },
            {
                title: "Conference Highlights: Key Insights",
                content: "Industry leaders gathered to share insights on future trends and challenges. The conference featured presentations on sustainability, innovation, and digital transformation."
            },
            {
                title: "Product Launch: Revolutionary Platform",
                content: "A new platform has been launched that promises to streamline workflows and improve productivity. Early users report significant improvements in efficiency and collaboration."
            }
        ];

        // Create news posts
        for (let i = 0; i < newsItems.length; i++) {
            const news = newsItems[i];
            console.log(`📝 Creating news: ${news.title}...`);
            
            const newsResponse = await fetch('http://localhost:3000/api/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies
                },
                body: JSON.stringify({
                    title: news.title,
                    content: news.content,
                    community_id: communityId
                })
            });

            if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                console.log(`✅ Created: ${news.title} (ID: ${newsData.news.id})`);
                
                // Add a few upvotes from the current user
                const upvotes = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < upvotes; j++) {
                    await fetch(`http://localhost:3000/api/news/${newsData.news.id}/upvote`, {
                        method: 'POST',
                        headers: {
                            'Cookie': cookies
                        }
                    });
                    // Toggle back to simulate different users
                    if (j < upvotes - 1) {
                        await fetch(`http://localhost:3000/api/news/${newsData.news.id}/upvote`, {
                            method: 'POST',
                            headers: {
                                'Cookie': cookies
                            }
                        });
                    }
                }
                console.log(`👍 Added upvotes to ${news.title}`);
            } else {
                console.log(`❌ Failed to create: ${news.title} - ${newsResponse.status}`);
            }
        }

        console.log('🎉 Demo news created successfully!');
        console.log('💡 Visit http://localhost:3000 to see your news');

    } catch (error) {
        console.error('❌ Error creating demo news:', error);
    }
}

createDemoNews();

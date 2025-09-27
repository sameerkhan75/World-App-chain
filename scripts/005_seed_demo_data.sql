-- Insert demo communities
INSERT INTO public.communities (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Web3 News', 'Latest updates from the Web3 ecosystem'),
  ('550e8400-e29b-41d4-a716-446655440002', 'DeFi Updates', 'Decentralized Finance news and trends'),
  ('550e8400-e29b-41d4-a716-446655440003', 'NFT Marketplace', 'Non-Fungible Token discussions and releases'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Crypto Trading', 'Cryptocurrency trading insights and analysis'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Blockchain Tech', 'Technical discussions about blockchain technology')
ON CONFLICT (name) DO NOTHING;

-- Insert demo news with varying upvote counts
INSERT INTO public.news (id, title, content, community_id, upvotes, created_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Ethereum 2.0 Staking Rewards Increase', 'Ethereum 2.0 validators are seeing increased staking rewards as network activity grows. The latest upgrade has improved efficiency and reduced gas fees significantly.', '550e8400-e29b-41d4-a716-446655440001', 45, NOW() - INTERVAL '2 hours'),
  ('660e8400-e29b-41d4-a716-446655440002', 'New DeFi Protocol Launches with $100M TVL', 'A revolutionary new DeFi protocol has launched with over $100 million in total value locked within the first 24 hours. The protocol offers innovative yield farming opportunities.', '550e8400-e29b-41d4-a716-446655440002', 38, NOW() - INTERVAL '4 hours'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Major NFT Collection Sells Out in Minutes', 'The latest NFT drop from a renowned digital artist sold out completely within 15 minutes, generating over $2 million in sales volume.', '550e8400-e29b-41d4-a716-446655440003', 52, NOW() - INTERVAL '1 hour'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Bitcoin Reaches New All-Time High', 'Bitcoin has surged to a new all-time high of $75,000, driven by institutional adoption and favorable regulatory developments worldwide.', '550e8400-e29b-41d4-a716-446655440004', 67, NOW() - INTERVAL '30 minutes'),
  ('660e8400-e29b-41d4-a716-446655440005', 'Layer 2 Solutions Show 300% Growth', 'Layer 2 scaling solutions have experienced unprecedented growth with transaction volumes increasing by 300% over the past quarter.', '550e8400-e29b-41d4-a716-446655440005', 29, NOW() - INTERVAL '6 hours'),
  ('660e8400-e29b-41d4-a716-446655440006', 'Web3 Gaming Platform Raises $50M', 'A leading Web3 gaming platform has successfully raised $50 million in Series B funding to expand its metaverse ecosystem.', '550e8400-e29b-41d4-a716-446655440001', 41, NOW() - INTERVAL '3 hours'),
  ('660e8400-e29b-41d4-a716-446655440007', 'Decentralized Exchange Volume Hits Record', 'DEX trading volume has reached an all-time high of $15 billion in daily volume, surpassing traditional centralized exchanges.', '550e8400-e29b-41d4-a716-446655440002', 33, NOW() - INTERVAL '5 hours'),
  ('660e8400-e29b-41d4-a716-446655440008', 'Cross-Chain Bridge Security Enhanced', 'Major improvements to cross-chain bridge security protocols have been implemented, reducing vulnerability risks by 90%.', '550e8400-e29b-41d4-a716-446655440005', 25, NOW() - INTERVAL '8 hours')
ON CONFLICT (id) DO NOTHING;

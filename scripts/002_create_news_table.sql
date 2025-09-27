-- Create news table
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ipfs_hash TEXT, -- Store IPFS hash for decentralized content
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- RLS policies for news
CREATE POLICY "news_select_all" ON public.news FOR SELECT USING (true);
CREATE POLICY "news_insert_authenticated" ON public.news FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);
CREATE POLICY "news_update_author" ON public.news FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "news_delete_author" ON public.news FOR DELETE USING (auth.uid() = author_id);

-- Create index for better performance on upvotes sorting
CREATE INDEX IF NOT EXISTS idx_news_upvotes ON public.news(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_news_community ON public.news(community_id);

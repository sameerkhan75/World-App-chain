-- Update communities table to include creator display name for easy access
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- Update news table to include author display name for easy access  
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Update existing records with creator names (if any exist)
-- This assumes you're using the demo/development setup
UPDATE public.communities 
SET creator_name = 'Demo User' 
WHERE creator_name IS NULL AND created_by IS NOT NULL;

UPDATE public.news 
SET author_name = 'Demo User' 
WHERE author_name IS NULL AND author_id IS NOT NULL;

-- Create index for better performance on name searches
CREATE INDEX IF NOT EXISTS idx_communities_creator_name ON public.communities(creator_name);
CREATE INDEX IF NOT EXISTS idx_news_author_name ON public.news(author_name);

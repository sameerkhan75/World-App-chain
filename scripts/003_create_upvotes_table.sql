-- Create upvotes table to track user votes
CREATE TABLE IF NOT EXISTS public.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(news_id, user_id) -- Prevent duplicate votes
);

-- Enable RLS
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for upvotes
CREATE POLICY "upvotes_select_all" ON public.upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_insert_authenticated" ON public.upvotes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "upvotes_delete_own" ON public.upvotes FOR DELETE USING (auth.uid() = user_id);

-- Create function to update upvote count
CREATE OR REPLACE FUNCTION update_news_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news 
    SET upvotes = upvotes + 1 
    WHERE id = NEW.news_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news 
    SET upvotes = upvotes - 1 
    WHERE id = OLD.news_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update upvote counts
DROP TRIGGER IF EXISTS upvote_count_trigger ON public.upvotes;
CREATE TRIGGER upvote_count_trigger
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION update_news_upvotes();

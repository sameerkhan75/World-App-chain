-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- RLS policies for communities
CREATE POLICY "communities_select_all" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities_insert_authenticated" ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "communities_update_owner" ON public.communities FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "communities_delete_owner" ON public.communities FOR DELETE USING (auth.uid() = created_by);

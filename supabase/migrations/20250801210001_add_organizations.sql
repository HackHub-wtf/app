-- Add organizations table and update relationships

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- GitHub-like unique identifier
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id to profiles table
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add organization_id to hackathons table
ALTER TABLE public.hackathons ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create organization_members table for explicit membership management
CREATE TABLE public.organization_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'manager', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_hackathons_organization_id ON public.hackathons(organization_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);

-- Add trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations are viewable by members" ON public.organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = (SELECT auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Organization owners can update their org" ON public.organizations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organizations.id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'manager'))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (
  created_by = (SELECT auth.uid())
);

-- RLS Policies for organization_members
CREATE POLICY "Organization members are viewable by org members" ON public.organization_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = (SELECT auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Organization managers can manage members" ON public.organization_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organization_members.organization_id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'manager'))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Organization managers can update members" ON public.organization_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organization_members.organization_id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'manager'))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Organization managers can remove members" ON public.organization_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organization_members.organization_id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'manager'))
  OR user_id = (SELECT auth.uid()) -- Users can leave organizations
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Update hackathons RLS policies to include organization-based access
DROP POLICY IF EXISTS "Creators can update their hackathons" ON public.hackathons;
CREATE POLICY "Organization managers can update hackathons" ON public.hackathons FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = hackathons.organization_id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'manager'))
  OR created_by = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
);

-- Update hackathons INSERT policy
DROP POLICY IF EXISTS "Managers can create hackathons" ON public.hackathons;
CREATE POLICY "Organization managers can create hackathons" ON public.hackathons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = hackathons.organization_id AND user_id = (SELECT auth.uid()) AND role IN ('owner', 'manager'))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager'))
);

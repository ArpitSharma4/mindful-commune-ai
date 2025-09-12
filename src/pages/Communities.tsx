import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { PostFeatures } from "@/features/community/components";

import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import JournalFeed from "@/features/community/components/CommunityMain";

const Communities = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [communityId, setCommunityId] = useState<number>(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for navigation state to pre-open post creation
  useEffect(() => {
    if (location.state?.preSelectedCommunityId) {
      setCommunityId(location.state.preSelectedCommunityId);
    }
  }, [location.state]);

  // Refresh posts when returning from CreatePost page
  useEffect(() => {
    if (location.state?.fromCreatePost) {
      setRefreshTrigger(prev => prev + 1);
      // Clear the navigation state to prevent repeated refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch the first available community ID on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        console.log('Fetching communities from /api/communities');
        const response = await fetch('/api/communities');
        console.log('Communities response status:', response.status);
        
        if (response.ok) {
          const communities = await response.json();
          console.log('Communities data:', communities);
          if (communities.length > 0) {
            console.log('Setting community ID to:', communities[0].community_id);
            setCommunityId(communities[0].community_id);
          } else {
            console.log('No communities found');
          }
        } else {
          console.error('Failed to fetch communities, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
        // Keep default community ID 1 if fetch fails
      }
    };

    fetchCommunities();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="w-full px-4 py-12">
          {!isSidebarOpen && (
            <div className="block">
              {/* Vertical rail line split into two segments to avoid the leaf area */}
              <div className="fixed left-[2.625rem] top-0 h-[calc(6rem-0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
              <div className="fixed left-[2.625rem] bottom-0 top-[calc(6rem+2.25rem+0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-6 top-24 z-60 h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow"
                aria-label="Open sidebar"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Leaf className="h-5 w-5 text-white" />
              </Button>
            </div>
          )}
          <div className={isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6" : "grid grid-cols-1 gap-6"}>
            {isSidebarOpen && (
              <div className="relative">
                <div className="sticky top-20 z-10">
                  <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
                </div>
              </div>
            )}
            {/* Main Content */}
            <div className="w-full max-w-screen-xl mx-auto">
              <JournalFeed 
                disableAnimations 
                communityId={communityId}
                key={refreshTrigger}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Communities;

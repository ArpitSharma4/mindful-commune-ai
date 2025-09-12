import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { useState } from "react";
import CommunityMain from "@/features/community/components/CommunityMain";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
              <CommunityMain 
                disableAnimations 
                isGlobalFeed={true}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LeftSidebar from "@/components/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="w-full px-4 py-12">
        {/* Leaf Toggle Button - Only visible when sidebar is closed */}
        {!isSidebarOpen && (
          <div className="block">
            {/* Vertical rail line split into two segments to avoid the leaf area */}
            <div className="fixed left-[2.625rem] top-0 h-[calc(8rem-0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
            <div className="fixed left-[2.625rem] bottom-0 top-[calc(8rem+2.25rem+0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-6 top-32 z-60 h-12 w-12 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow"
              aria-label="Open sidebar"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Leaf className="h-6 w-6 text-white" />
            </Button>
          </div>
        )}
        <div className={`transition-all duration-500 ease-in-out ${isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6" : "grid grid-cols-1 gap-6"}`}>
          {isSidebarOpen && (
            <div className="sticky top-3 self-start">
              <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          )}
          <div className="w-full max-w-screen-xl mx-auto transition-all duration-500 ease-in-out">
            <HeroSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
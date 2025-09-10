import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { JournalFeed, RedditStylePostEditor } from "@/features/journaling/components";
import { CommunitySidebar } from "@/features/community/components";
import { useState } from "react";

const Communities = () => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="w-full px-4 py-12">
          <div className="w-full grid grid-cols-1 md:grid-cols-[14rem_1fr_18rem] gap-8">
            {/* Left Sidebar */}
            <div className="sticky top-16 self-start">
              <LeftSidebar />
            </div>
            {/* Main Content */}
            <div className="w-full max-w-screen-xl mx-auto">
                {isComposeOpen ? (
                  <RedditStylePostEditor
                    isOpen={true}
                    onClose={() => setIsComposeOpen(false)}
                  />
                ) : (
                  <JournalFeed onOpenCreatePost={() => setIsComposeOpen(true)} />
                )}
            </div>

            {/* Sidebar */}
            <div>
              <CommunitySidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Communities;

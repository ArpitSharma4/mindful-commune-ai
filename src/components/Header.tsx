import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Menu, User, PenTool, HelpCircle, Bell, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import RedditStylePostEditor from "./RedditStylePostEditor";

const Header = () => {
  const { toast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handleNewJournal = () => {
    setIsCreatePostOpen(true);
  };

  // Auto-open editor if URL hash is #create (so other pages can trigger it)
  useEffect(() => {
    if (location.hash === "#create") {
      setIsCreatePostOpen(true);
    }
  }, [location]);

  const handleUserProfile = () => {
    toast({
      title: "User Profile",
      description: "Opening your profile...",
    });
  };

  const handleHelp = () => {
    toast({
      title: "Help & Support",
      description: "Opening help center...",
    });
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "Notifications center coming soon",
    });
  };

  const handleMobileMenu = () => {
    toast({
      title: "Menu",
      description: "Mobile menu opening...",
    });
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center px-2 border-b-0">
        {/* Logo - Left side */}
        <div className="flex items-center gap-2 flex-1 ml-0">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
              EchoWell
            </span>
          </Link>
        </div>

        {/* Center Search */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-xl items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="What would feel supportive to explore today?"
              className="pl-9 h-10 rounded-full bg-muted/50 border-muted focus:border-primary"
            />
          </div>
        </div>

        {/* Buttons - Right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
          <Button variant="therapeutic" size="sm" className="hidden sm:flex text-base" onClick={handleNewJournal}>
            <PenTool className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden lg:inline">Create Post</span>
            <span className="lg:hidden">Post</span>
          </Button>
          <Button variant="gentle" size="sm" className="text-base" onClick={handleNotifications}>
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="gentle" size="sm" className="text-base" onClick={handleHelp}>
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="gentle" size="sm" className="text-base" onClick={handleUserProfile}>
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleMobileMenu}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

    {isCreatePostOpen && (
      <div className="w-full max-w-screen-xl mx-auto px-4 mt-4">
        <RedditStylePostEditor 
          isOpen={isCreatePostOpen} 
          onClose={() => setIsCreatePostOpen(false)} 
        />
      </div>
    )}
    </>
  );
};

export default Header;
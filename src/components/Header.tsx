import { Button } from "@/components/ui/button";
import { Heart, Menu, User, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { toast } = useToast();

  const handleNewJournal = () => {
    toast({
      title: "New Journal Entry",
      description: "Opening journal editor...",
    });
  };

  const handleUserProfile = () => {
    toast({
      title: "User Profile",
      description: "Opening your profile...",
    });
  };

  const handleMobileMenu = () => {
    toast({
      title: "Menu",
      description: "Mobile menu opening...",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
              MindfulSpace
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </a>
          <a href="#journal" className="text-sm font-medium hover:text-primary transition-colors">
            Journal
          </a>
          <a href="#community" className="text-sm font-medium hover:text-primary transition-colors">
            Community
          </a>
          <a href="#support" className="text-sm font-medium hover:text-primary transition-colors">
            Support
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="therapeutic" size="sm" className="hidden sm:flex" onClick={handleNewJournal}>
            <PenTool className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden lg:inline">New Journal</span>
            <span className="lg:hidden">Journal</span>
          </Button>
          <Button variant="gentle" size="sm" onClick={handleUserProfile}>
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleMobileMenu}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Menu, User, HelpCircle, Search, Moon, Sun, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import HelpModal from "./HelpModal";
import UserProfileDropdown from "./UserProfileDropdown";
import LoginModal from "./LoginModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const { toast } = useToast();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{ username: string; userId: number; avatar_url?: string } | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Check authentication status on component mount and listen for changes
  useEffect(() => {
    const checkAuthStatus = () => {
      console.log('Header: Checking auth status...');
      const token = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');
      console.log('Header: Token exists:', !!token);
      console.log('Header: Stored user data:', storedUserData);
      
      if (token && storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          console.log('Header: Parsed user data:', parsed);
          setUserData(parsed);
          setIsLoggedIn(true);
          console.log('Header: Auth state updated - user is logged in');
        } catch (error) {
          console.error('Header: Error parsing user data:', error);
          setUserData(null);
          setIsLoggedIn(false);
        }
      } else {
        console.log('Header: No auth data found - user is logged out');
        setUserData(null);
        setIsLoggedIn(false);
      }
    };

    // Initial check
    console.log('Header: Component mounted, running initial auth check');
    checkAuthStatus();

    // Listen for storage changes to update auth state across tabs
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom auth events
    window.addEventListener('authStateChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleStorageChange);
    };
  }, []);

  const handleUserProfile = () => {
    setIsUserProfileOpen(true);
  };

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    console.log('Header: handleLoginSuccess called');
    
    // Check localStorage and update state
    const token = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    console.log('Header: Token exists:', !!token);
    console.log('Header: User data:', storedUserData);
    
    if (token && storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        console.log('Header: Setting user data:', parsed);
        setUserData(parsed);
        setIsLoggedIn(true);
        console.log('Header: isLoggedIn set to true');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    setIsLoginModalOpen(false);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  const handleHelp = () => {
    setIsHelpOpen(true);
  };

  const handleToggleTheme = () => {
    const next = (resolvedTheme || theme) === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const handleMobileMenu = () => {
    toast({
      title: "Menu",
      description: "Mobile menu opening...",
    });
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="w-full flex h-16 items-center px-4 border-b-0">
        {/* Logo - Left side */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
              EchoWell
            </span>
          </Link>
        </div>


        {/* Buttons - Right side */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <Button variant="gentle" size="sm" className="text-base" onClick={handleToggleTheme} aria-label="Toggle theme">
            { (resolvedTheme || theme) === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" /> }
          </Button>
          <Button variant="gentle" size="sm" className="text-base" onClick={handleHelp}>
            <HelpCircle className="h-4 w-4" />
          </Button>
          {isLoggedIn ? (
            <Button variant="gentle" size="sm" className="text-base p-0 h-8 w-8 rounded-md overflow-hidden" onClick={handleUserProfile}>
              {userData?.avatar_url ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData.avatar_url} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button variant="therapeutic" size="sm" className="text-base" onClick={handleLogin}>
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={handleMobileMenu}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

    
    <HelpModal 
      isOpen={isHelpOpen} 
      onClose={() => setIsHelpOpen(false)} 
    />
    
    <UserProfileDropdown 
      isOpen={isUserProfileOpen} 
      onClose={() => setIsUserProfileOpen(false)} 
    />

    <LoginModal 
      isOpen={isLoginModalOpen} 
      onClose={() => setIsLoginModalOpen(false)}
      onLoginSuccess={handleLoginSuccess}
    />
    </>
  );
};

export default Header;
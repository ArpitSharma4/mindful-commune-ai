import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Edit, 
  FileText, 
  Trophy, 
  TrendingUp, 
  LogIn, 
  LogOut,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoginModal from "./LoginModal";
import AvatarEditModal from "./AvatarEditModal";

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileDropdown = ({ isOpen, onClose }: UserProfileDropdownProps) => {
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{
    username: string;
    userId: number;
    avatar_url?: string;
  } | null>(null);

  // Check authentication status on component mount and listen for changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');
      
      if (token && storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          setIsLoggedIn(true);
        } catch (error) {
          // If there's an error parsing user data, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUserData(null);
          setIsLoggedIn(false);
        }
      } else {
        setUserData(null);
        setIsLoggedIn(false);
      }
    };

    // Initial check
    checkAuthStatus();

    // Listen for storage changes and custom auth events
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    // Refresh user data from localStorage after successful login
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
    
    setIsLoginModalOpen(false);
    onClose();
    toast({
      title: "Login Successful! 🎉",
      description: "Welcome back to EchoWell!",
    });
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
    
    onClose();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleMenuItem = (item: string) => {
    toast({
      title: item,
      description: `Opening ${item.toLowerCase()}...`,
    });
    onClose();
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (userData) {
      setUserData(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      // Update localStorage
      const updatedUserData = { ...userData, avatar_url: newAvatarUrl };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
    }
  };

  // Generate initials from username
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate username display (e.g., "u/johndoe")
  const getUsernameDisplay = (username: string) => {
    return `u/${username}`;
  };

  // Don't show dropdown if not open or user is not logged in
  if (!isOpen || !isLoggedIn || !userData) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-4 top-16 z-50 w-80 bg-background border rounded-lg shadow-lg">
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <button 
              onClick={() => setShowAvatarDialog(true)}
              className="hover:opacity-80 transition-opacity"
              title="Edit Avatar"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={userData.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {getInitials(userData.username)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1">
              <div className="font-medium">
                {userData.username}
              </div>
              <div className="text-sm text-muted-foreground">
                {getUsernameDisplay(userData.username)}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleMenuItem("View Profile")}>
              <User className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("My Posts")}
            >
              <FileText className="h-4 w-4" />
              <span>My Posts</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("Achievements")}
            >
              <Trophy className="h-4 w-4" />
              <span>Achievements</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("Analytics")}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </Button>

            <Link to="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-3"
                onClick={onClose}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>

          {/* Logout */}
          <div className="pt-3 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Avatar Edit Modal */}
      <AvatarEditModal
        isOpen={showAvatarDialog}
        onClose={() => setShowAvatarDialog(false)}
        currentAvatar={userData?.avatar_url || ""}
        username={userData?.username || ""}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </>
  );
};

export default UserProfileDropdown;
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import LoginModal from "./LoginModal";

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileDropdown = ({ isOpen, onClose }: UserProfileDropdownProps) => {
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{
    username: string;
    userId: number;
  } | null>(null);

  // Check authentication status on component mount
  useEffect(() => {
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
      }
    }
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

  if (!isOpen) return null;

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
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {isLoggedIn && userData ? getInitials(userData.username) : 'JD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">
                {isLoggedIn && userData ? userData.username : 'John Doe'}
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoggedIn && userData ? getUsernameDisplay(userData.username) : 'u/JohnDoe123'}
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
              onClick={() => handleMenuItem("Edit Avatar")}
            >
              <Edit className="h-4 w-4" />
              <span>Edit Avatar</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("Drafts")}
            >
              <FileText className="h-4 w-4" />
              <span>Drafts</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("Achievements")}
            >
              <Trophy className="h-4 w-4" />
              <div className="flex-1 text-left">
                <span>Achievements</span>
                <div className="text-xs text-muted-foreground">5 unlocked</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("Earn")}
            >
              <TrendingUp className="h-4 w-4" />
              <div className="flex-1 text-left">
                <span>Earn</span>
                <div className="text-xs text-muted-foreground">Earn rewards on EchoWell</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => handleMenuItem("Settings")}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>

            <div className="border-t pt-3">
              {isLoggedIn ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto p-3 text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto p-3 text-primary hover:text-primary"
                  onClick={handleLogin}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default UserProfileDropdown;

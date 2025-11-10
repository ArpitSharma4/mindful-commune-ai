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
  Settings,
  Zap,
  Award,
  Flame,
  CalendarCheck,
  BookOpen,
  BookMarked,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LoginModal from "./LoginModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserPoints } from "@/features/gamification/services";
import type { Achievement, UserPoints as UserPointsType } from "@/features/gamification/types";
interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

// Using UserPointsType from gamification/types

const UserProfileDropdown = ({ isOpen, onClose }: UserProfileDropdownProps) => {
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{
    username: string;
    userId: number;
    avatar_url?: string;
  } | null>(null);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [userPoints, setUserPoints] = useState<UserPointsType | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  // Load user points
  const loadUserPoints = async (userId: string) => {
    try {
      const points = await getUserPoints(userId);
      setUserPoints(points);
    } catch (error) {
      console.error('Error loading user points:', error);
    }
  };

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
          // Load user points when authenticated
          loadUserPoints(parsedUserData.userId);
        } catch (error) {
          // If there's an error parsing user data, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUserData(null);
          setIsLoggedIn(false);
          setUserPoints(null);
        }
      } else {
        setUserData(null);
        setIsLoggedIn(false);
        setUserPoints(null);
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
const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const handleAvatarUpload = async () => {
  if (!avatarFile) {
    toast({
      description: "Please select an image file to upload.",
      variant: "destructive",
    });
    return;
  }

  setIsUploadingAvatar(true);
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to upload an avatar.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await fetch('/api/users/avatar', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
      setShowAvatarDialog(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      // Refresh user data
      window.location.reload();
    } else {
      const data = await response.json();
      toast({
        title: "Upload Failed",
        description: data.error || "Failed to upload avatar.",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    toast({
      title: "Network Error",
      description: "Unable to connect to the server.",
      variant: "destructive",
    });
  } finally {
    setIsUploadingAvatar(false);
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

  // Get achievement icon component
  const getAchievementIcon = (id: string) => {
    switch (id) {
      case 'first_entry':
        return <BookOpen className="h-4 w-4" />;
      case 'streak_3_days':
        return <Flame className="h-4 w-4" />;
      case 'streak_7_days':
        return <Award className="h-4 w-4" />;
      case 'streak_30_days':
        return <CalendarCheck className="h-4 w-4" />;
      case 'journal_enthusiast':
        return <BookMarked className="h-4 w-4" />;
      case 'journal_master':
        return <Star className="h-4 w-4" />;
      case 'journal_legend':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
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
            <Avatar className="h-10 w-10">
              <AvatarImage src={userData.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {getInitials(userData.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">
                {userData.username}
              </div>
              <div className="text-sm text-muted-foreground">
                {getUsernameDisplay(userData.username)}
              </div>
              {userPoints && (
                <div className="flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium text-yellow-600">
                    {userPoints.totalPoints} points
                  </span>
                  <span className="mx-1 text-muted-foreground">•</span>
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-orange-600">
                    {userPoints.currentStreak} day{userPoints.currentStreak !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
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
  onClick={() => {
    // TODO: Open avatar upload dialog here
    toast({
      title: "Edit Avatar",
      description: "Avatar upload dialog will open here",
    });
    onClose();
  }}
>
  <Edit className="h-4 w-4" />
  <span>Edit Avatar</span>
</Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => setShowAchievements(true)}
            >
              <Trophy className="h-4 w-4" />
              <div className="flex-1 text-left">
                <span>Achievements</span>
                <div className="text-xs text-muted-foreground">
                  {userPoints ? `${userPoints.achievements.filter(a => a.unlocked).length} of ${userPoints.achievements.length} unlocked` : 'Loading...'}
                </div>
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

            <Link to="/settings" onClick={onClose}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-3"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Button>
            </Link>

            <div className="border-t pt-3">
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
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Achievements Dialog */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Achievements
            </DialogTitle>
            {userPoints && (
              <div className="flex items-center justify-between py-2 px-1">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{userPoints.totalPoints} points</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{userPoints.currentStreak} day streak</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{userPoints.entriesCount} entries</span>
                </div>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {userPoints?.achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${achievement.unlocked ? 'bg-amber-50' : 'opacity-60'}`}
              >
                <div className={`p-2 rounded-full ${achievement.unlocked ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                  {getAchievementIcon(achievement.id)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{achievement.name}</div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium text-yellow-600">+{achievement.points} points</span>
                      {achievement.unlockedAt && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-1">
                      Keep going!
                    </div>
                  )}
                </div>
                {achievement.unlocked && (
                  <div className="text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfileDropdown;

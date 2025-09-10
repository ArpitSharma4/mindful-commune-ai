import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Edit, 
  FileText, 
  Trophy, 
  TrendingUp, 
  LogOut, 
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileDropdown = ({ isOpen, onClose }: UserProfileDropdownProps) => {
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    onClose();
  };

  const handleMenuItem = (item: string) => {
    toast({
      title: item,
      description: `Opening ${item.toLowerCase()}...`,
    });
    onClose();
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
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">John Doe</div>
              <div className="text-sm text-muted-foreground">u/JohnDoe123</div>
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
    </>
  );
};

export default UserProfileDropdown;

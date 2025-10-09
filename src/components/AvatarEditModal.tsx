import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, User } from "lucide-react";

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  username: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

const AvatarEditModal = ({ 
  isOpen, 
  onClose, 
  currentAvatar, 
  username, 
  onAvatarUpdate 
}: AvatarEditModalProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update your avatar.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/users/avatar', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onAvatarUpdate(data.user.avatar_url);
        toast({
          title: "Avatar Updated",
          description: "Your avatar has been updated successfully.",
        });
        handleClose();
      } else {
        const errorData = await response.json();
        toast({
          title: "Upload Failed",
          description: errorData.error || "Failed to update avatar. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update your avatar.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onAvatarUpdate('');
        toast({
          title: "Avatar Removed",
          description: "Your avatar has been removed successfully.",
        });
        handleClose();
      } else {
        const errorData = await response.json();
        toast({
          title: "Remove Failed",
          description: errorData.error || "Failed to remove avatar. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Avatar</DialogTitle>
          <DialogDescription>
            Upload a new avatar image or remove your current one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || currentAvatar} />
                <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {previewUrl ? "Preview of new avatar" : "Current avatar"}
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose New Avatar
            </Button>

            {currentAvatar && (
              <Button
                variant="outline"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                className="w-full text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Current Avatar
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!previewUrl || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarEditModal;

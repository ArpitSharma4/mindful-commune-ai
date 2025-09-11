import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Users, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated: (community: any) => void;
}

const CreateCommunityModal = ({ isOpen, onClose, onCommunityCreated }: CreateCommunityModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Community Name Required",
        description: "Please enter a name for your community.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a community.",
          variant: "destructive",
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/community/createCommunity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Community Created! 🎉",
          description: `${formData.name} has been successfully created.`,
          duration: 5000,
        });
        
        onCommunityCreated(data);
        
        // Reset form
        setFormData({ name: "", description: "" });
        onClose();
      } else {
        toast({
          title: "Failed to Create Community",
          description: data.error || "An error occurred while creating the community.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div 
          className="bg-background rounded-lg shadow-lg w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create Community</h2>
                <p className="text-sm text-muted-foreground">Start a new community for meaningful discussions</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="community-name">Community Name *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="community-name"
                  type="text"
                  placeholder="e.g., Mindful Living, Anxiety Support"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10"
                  maxLength={100}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a clear, descriptive name for your community
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community-description">Description (Optional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="community-description"
                  placeholder="Describe what your community is about, its purpose, and what kind of discussions you want to foster..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="pl-10 min-h-[100px]"
                  maxLength={500}
                  rows={4}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Help others understand what your community is about
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="therapeutic"
                className="flex-1"
                disabled={isLoading || !formData.name.trim()}
              >
                {isLoading ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateCommunityModal;

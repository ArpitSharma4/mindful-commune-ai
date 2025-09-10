import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Shield, Heart, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CommunitySidebar = () => {
  const { toast } = useToast();

  const trendingCommunities = [
    { name: "r/Mindfulness", members: "12.5k", description: "Find peace in everyday moments" },
    { name: "r/Therapy", members: "8.9k", description: "Support and insights from therapy" },
    { name: "r/DepressionSupport", members: "15.2k", description: "Support for depression recovery" },
    { name: "r/Relationships", members: "22.1k", description: "Navigating relationships and boundaries" },
    { name: "r/AnxietyHelp", members: "18.7k", description: "Coping with anxiety and stress" }
  ];

  const handleJoinCommunity = (communityName: string) => {
    toast({
      title: "Community Joined! 🎉",
      description: `You've joined ${communityName}`,
    });
  };

  const handleCreateCommunity = () => {
    toast({
      title: "Create Community",
      description: "Opening community creator...",
    });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center py-8">
        <p className="text-muted-foreground">No sidebar content</p>
      </div>
    </div>
  );
};

export default CommunitySidebar;

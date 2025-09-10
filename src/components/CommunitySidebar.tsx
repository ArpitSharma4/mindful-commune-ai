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
    <div className="w-full max-w-sm space-y-6">
      {/* Create Community */}
      <Card className="shadow-none border-none bg-transparent">
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-lg">Create a Community</h3>
            <p className="text-sm text-muted-foreground">
              Start your own community around a topic you're passionate about
            </p>
            <Button 
              variant="therapeutic" 
              size="sm" 
              className="w-full"
              onClick={handleCreateCommunity}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trending Communities */}
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Communities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingCommunities.map((community, index) => (
            <div key={index} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{community.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{community.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{community.members} members</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 text-xs"
                onClick={() => handleJoinCommunity(community.name)}
              >
                Join
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Community Rules */}
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Be kind and supportive to others</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Respect privacy and anonymity</p>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>No harassment or hate speech</p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Share authentic experiences</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Sort by Hot
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            My Communities
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Heart className="h-4 w-4 mr-2" />
            Saved Posts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunitySidebar;

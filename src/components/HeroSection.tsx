import { Button } from "@/components/ui/button";
import { PenTool, Users, Brain, Shield, BookOpen, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { toast } = useToast();
  const [sparkleAnimation, setSparkleAnimation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sparkleTimer = setInterval(() => {
      setSparkleAnimation(true);
      setTimeout(() => setSparkleAnimation(false), 1000);
    }, 3000);
    
    return () => clearInterval(sparkleTimer);
  }, []);

  const handleStartJournaling = () => {
    toast({
      title: "Journaling Feature ",
      description: "Opening your personal journaling space...",
    });
    navigate('/journaling');
  };

  const handleAIChatbot = () => {
    toast({
      title: "AI Chatbot ",
      description: "Starting conversation with your AI companion...",
    });
    navigate('/chat');
  };

  const handleJoinCommunity = () => {
    toast({
      title: "Welcome to Our Community! ",
      description: "Connecting you with others on similar journeys.",
    });
    navigate('/explore');
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 text-center">
        <div className={"max-w-4xl mx-auto space-y-8"}>
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Welcome to
              <span className={`bg-gradient-primary bg-clip-text text-transparent block transition-all duration-500 ${sparkleAnimation ? 'animate-pulse' : ''}`}>
                EchoWell
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Share your thoughts anonymously, join supportive communities, and find your voice in a safe space. Post, vote, and connect with others who understand.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md sm:max-w-none mx-auto">
            <Button 
              variant="therapeutic" 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto transition-all duration-300 hover:scale-105 hover:shadow-therapeutic group"
              onClick={handleStartJournaling}
            >
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-200 group-hover:rotate-12" />
              Start Journaling
            </Button>
            <Button 
              variant="gentle" 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={handleAIChatbot}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
              AI Chatbot
            </Button>
          </div>

          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={handleJoinCommunity}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
              Browse Communities
            </Button>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-3 group cursor-pointer">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg">
                <Brain className="h-8 w-8 text-primary transition-transform duration-200 group-hover:rotate-12" />
              </div>
              <h3 className="font-semibold transition-colors duration-200 group-hover:text-primary">Anonymous Posting</h3>
              <p className="text-sm text-muted-foreground text-center transition-colors duration-200 group-hover:text-foreground">
                Share your thoughts safely with optional anonymous posting
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 group cursor-pointer">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg">
                <Users className="h-8 w-8 text-primary transition-transform duration-200 group-hover:scale-110" />
              </div>
              <h3 className="font-semibold transition-colors duration-200 group-hover:text-primary">Voting System</h3>
              <p className="text-sm text-muted-foreground text-center transition-colors duration-200 group-hover:text-foreground">
                Upvote and downvote posts to help quality content rise to the top
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 group cursor-pointer">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg">
                <Shield className="h-8 w-8 text-primary transition-transform duration-200 group-hover:pulse" />
              </div>
              <h3 className="font-semibold transition-colors duration-200 group-hover:text-primary">Communities</h3>
              <p className="text-sm text-muted-foreground text-center transition-colors duration-200 group-hover:text-foreground">
                Join topic-based communities and find your niche
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
import { Button } from "@/components/ui/button";
import { PenTool, Users, Brain, Shield, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-mindful.jpg";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [sparkleAnimation, setSparkleAnimation] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const sparkleTimer = setInterval(() => {
      setSparkleAnimation(true);
      setTimeout(() => setSparkleAnimation(false), 1000);
    }, 3000);
    
    return () => clearInterval(sparkleTimer);
  }, []);

  const handleStartJournaling = () => {
    toast({
      title: "Welcome to Your Journey! 🌱",
      description: "Let's create your first journal entry together.",
    });
    // Scroll to journal section
    document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoinCommunity = () => {
    toast({
      title: "Welcome to Our Community! 💙",
      description: "Connecting you with others on similar journeys.",
    });
    // Scroll to community section
    document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 opacity-30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="absolute top-40 right-20 opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <Sparkles className="h-6 w-6 text-secondary" />
        </div>
        <div className="absolute bottom-40 left-20 opacity-25 animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}>
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 text-center">
        <div className={`max-w-4xl mx-auto space-y-8 transition-all duration-1000 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0 translate-y-8'}`}>
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Your Safe Space for
              <span className={`bg-gradient-primary bg-clip-text text-transparent block transition-all duration-500 ${sparkleAnimation ? 'animate-pulse' : ''}`}>
                Mental Wellness
                <Sparkles className={`inline-block h-8 w-8 ml-2 text-primary transition-all duration-300 ${sparkleAnimation ? 'animate-spin text-yellow-400' : ''}`} />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Journal your thoughts, connect with a supportive community, and get AI-powered insights for your mental health journey.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md sm:max-w-none mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button 
              variant="therapeutic" 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto transition-all duration-300 hover:scale-105 hover:shadow-therapeutic group"
              onClick={handleStartJournaling}
            >
              <PenTool className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-200 group-hover:rotate-12" />
              Start Journaling
            </Button>
            <Button 
              variant="gentle" 
              size="lg" 
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              onClick={handleJoinCommunity}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
              Join Community
            </Button>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-3 animate-fade-in group cursor-pointer" style={{ animationDelay: '0.9s' }}>
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg">
                <Brain className="h-8 w-8 text-primary transition-transform duration-200 group-hover:rotate-12" />
              </div>
              <h3 className="font-semibold transition-colors duration-200 group-hover:text-primary">AI Support</h3>
              <p className="text-sm text-muted-foreground text-center transition-colors duration-200 group-hover:text-foreground">
                Get personalized insights and gentle guidance from our AI assistant
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 animate-fade-in group cursor-pointer" style={{ animationDelay: '1.1s' }}>
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg">
                <Users className="h-8 w-8 text-primary transition-transform duration-200 group-hover:scale-110" />
              </div>
              <h3 className="font-semibold transition-colors duration-200 group-hover:text-primary">Community</h3>
              <p className="text-sm text-muted-foreground text-center transition-colors duration-200 group-hover:text-foreground">
                Connect with others who understand your journey in a safe space
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 animate-fade-in group cursor-pointer" style={{ animationDelay: '1.3s' }}>
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg">
                <Shield className="h-8 w-8 text-primary transition-transform duration-200 group-hover:pulse" />
              </div>
              <h3 className="font-semibold transition-colors duration-200 group-hover:text-primary">Privacy First</h3>
              <p className="text-sm text-muted-foreground text-center transition-colors duration-200 group-hover:text-foreground">
                Your thoughts are safe with anonymous posting and secure journaling
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
import { Button } from "@/components/ui/button";
import { PenTool, Users, Brain, Shield } from "lucide-react";
import heroImage from "@/assets/hero-mindful.jpg";

const HeroSection = () => {
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

      {/* Content */}
      <div className="relative z-10 container px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Your Safe Space for
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                Mental Wellness
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Journal your thoughts, connect with a supportive community, and get AI-powered insights for your mental health journey.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-md sm:max-w-none mx-auto">
            <Button variant="therapeutic" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto">
              <PenTool className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Start Journaling
            </Button>
            <Button variant="gentle" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Join Community
            </Button>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-3 animate-slide-up">
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">AI Support</h3>
              <p className="text-sm text-muted-foreground text-center">
                Get personalized insights and gentle guidance from our AI assistant
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Community</h3>
              <p className="text-sm text-muted-foreground text-center">
                Connect with others who understand your journey in a safe space
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Privacy First</h3>
              <p className="text-sm text-muted-foreground text-center">
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
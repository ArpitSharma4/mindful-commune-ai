import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import JournalFeed from "@/components/JournalFeed";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <div id="journal">
          <JournalFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;
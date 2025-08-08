import JournalPost from "./JournalPost";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, Heart } from "lucide-react";

const JournalFeed = () => {
  // Mock data for journal posts
  const posts = [
    {
      id: "1",
      title: "Finding peace in small moments",
      content: "Today I realized that happiness doesn't always come from big achievements. Sometimes it's found in the quiet moments - like watching the sunrise with my coffee, hearing a favorite song on the radio, or simply taking a deep breath. These little pockets of peace have become my anchors during difficult times. I'm learning to notice them more and hold onto their warmth when anxiety creeps in.",
      author: "Sarah M.",
      isAnonymous: false,
      timeAgo: "2 hours ago",
      upvotes: 24,
      comments: 8,
      tags: ["mindfulness", "gratitude", "peace"]
    },
    {
      id: "2",
      title: "The weight of perfectionism",
      content: "I've been struggling with the constant need to be perfect in everything I do. It's exhausting to live with this voice that tells me nothing I do is ever good enough. Today my therapist helped me realize that perfectionism isn't about high standards - it's about fear. Fear of judgment, fear of failure, fear of not being worthy of love. I'm working on showing myself the same compassion I'd show a friend.",
      author: "Anonymous",
      isAnonymous: true,
      timeAgo: "4 hours ago",
      upvotes: 67,
      comments: 23,
      tags: ["perfectionism", "therapy", "self-compassion"]
    },
    {
      id: "3",
      title: "Celebrating small wins in depression recovery",
      content: "It might not seem like much, but I took a shower, made my bed, and even went for a short walk today. A month ago, getting out of bed felt impossible. Recovery isn't linear, and some days are still really hard, but I'm learning to celebrate these moments when I take care of myself. To anyone else fighting this battle - you're not alone, and every small step counts.",
      author: "Alex K.",
      isAnonymous: false,
      timeAgo: "6 hours ago",
      upvotes: 156,
      comments: 42,
      tags: ["depression", "recovery", "self-care", "progress"]
    },
    {
      id: "4",
      title: "Learning to set boundaries",
      content: "I used to think saying 'no' made me a bad person. I would overcommit, burn out, and then resent everyone around me. This week, I practiced setting boundaries with family and friends. It felt scary at first, but I'm starting to see that healthy boundaries actually improve my relationships. People who truly care about me respect my limits.",
      author: "Jordan R.",
      isAnonymous: false,
      timeAgo: "8 hours ago",
      upvotes: 89,
      comments: 31,
      tags: ["boundaries", "relationships", "self-respect"]
    }
  ];

  return (
    <section className="container px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Community Journal</h2>
          <p className="text-lg text-muted-foreground">
            Share your story, find support, and connect with others on their mental health journey
          </p>
        </div>

        {/* Create Post Button */}
        <div className="flex justify-center">
          <Button variant="therapeutic" size="lg" className="shadow-therapeutic">
            Share Your Story
          </Button>
        </div>

        {/* Feed Tabs */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            {posts.map((post) => (
              <JournalPost key={post.id} {...post} />
            ))}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {posts.slice().reverse().map((post) => (
              <JournalPost key={post.id} {...post} />
            ))}
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Follow other community members to see their posts here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default JournalFeed;
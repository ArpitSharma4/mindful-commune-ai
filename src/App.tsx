import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Communities from "./pages/Communities";
import Explore from "./pages/Explore";
import CommunityDetail from "./pages/CommunityDetail";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import Journaling from "./pages/Journaling";
import Settings from "./components/Settings";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
// Import new chat components
import { ChatLayout } from "./pages/chat/ChatLayout";
import NewChatPage from "./pages/chat/NewChatPage";
import { ConversationPage } from "./pages/chat/ConversationPage";
import { GamificationProvider } from "@/contexts/GamificationContext";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GamificationProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/global-feed" element={<Home />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/community/:communityId" element={<CommunityDetail />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/journaling" element={<Journaling />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/achievements" element={<Achievements />} />
          {/* Profile route */}
          <Route path="/profile/:username" element={<ProfilePage />} />
          
          {/* New Chat Routes */}
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<NewChatPage />} />
            <Route path=":id" element={<ConversationPage />} />
          </Route>
          
          {/* Redirect old chat route to new one */}
          <Route path="/old-chat" element={<Navigate to="/chat" replace />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </GamificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
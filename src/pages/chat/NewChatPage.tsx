import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NewChatPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isCreating) return;

    setIsCreating(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No auth token found.");

      // Call the "createNewChat" endpoint
      const createResponse = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input }) // Send the first message
      });

      if (!createResponse.ok) throw new Error('Failed to create chat session.');
      const newChat = await createResponse.json();
      
      // On success, redirect to the new chat's URL
      navigate(`/chat/${newChat.id}`);

    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {/* 1. Back Button (Left) */}
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-white">
          <Link to="/">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* 2. Title (Center) */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2 text-white">
            <Sparkles className="text-blue-400" />
            Mindwell
          </h1>
          <p className="text-muted-foreground text-sm">Your personal supportive companion</p>
        </div>

        {/* 3. Empty spacer (Right) - to keep title centered */}
        <div className="w-32"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Welcome Message - Centered in the available space */}
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
          <Sparkles className="h-16 w-16 text-blue-400 opacity-30" />
          <p className="text-muted-foreground mt-4">How can I help you today?</p>
        </div>

        {/* Input Form - Fixed at the bottom */}
        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message to start a new chat..."
              disabled={isCreating}
              className="flex-1"
            />
            <Button type="submit" disabled={isCreating || !input.trim()}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewChatPage;
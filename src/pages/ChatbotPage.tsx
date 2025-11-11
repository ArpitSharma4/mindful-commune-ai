import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, User, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Define the message structure
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatbotPage = () => {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true); // For initial history load
  const [isReplying, setIsReplying] = useState(false); // For when bot is typing
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Helper to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load chat history on page load
  useEffect(() => {
    setIsLoading(true);
    
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("No auth token found. Please log in.");

        const response = await fetch('http://localhost:3000/api/chat/history', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat history.');
        }

        const history: ChatMessage[] = await response.json();
        // Add a welcome message if history is empty
        if (history.length === 0) {
           setMessages([
             { role: 'assistant', content: "Hello! I'm your personal AI companion. How are you feeling today?" }
           ]);
        } else {
           setMessages(history);
        }

      } catch (error: any) { // Or (error as Error)
        toast({
          title: "Error",
          description: (error as Error).message || "Could not load chat history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [toast]);

  // 2. Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Handle sending a new message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isReplying) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsReplying(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No auth token found. Please log in.");

      const response = await fetch('http://localhost:3000/api/chat/handle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from the bot.');
      }

      const botMessage: ChatMessage = await response.json();
      setMessages((prev) => [...prev, botMessage]);

    } catch (error: any) { // Or (error as Error)
      toast({
        title: "Error",
        description: (error as Error).message || "Could not load chat history.",
        variant: "destructive",
      });
      // Remove the user's message if the send failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="text-blue-400" />
          AI Chatbot
        </h1>
        <p className="text-muted-foreground">Your personal supportive companion</p>
      </div>

      {/* Chat Messages Area */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isReplying && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-3 rounded-lg bg-muted flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isReplying}
          className="flex-1"
        />
        <Button type="submit" disabled={isReplying || !input.trim()}>
          {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatbotPage;

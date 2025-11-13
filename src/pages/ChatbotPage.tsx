import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, User, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Typewriter effect component
const Typewriter = ({ text, speed = 20, onComplete = () => {} }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length) {
      onComplete();
    }
  }, [text, currentIndex, speed, onComplete]);

  return <>{displayedText}</>;
};

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
  
  // Single declaration of messagesEndRef at the component level
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to scroll to the bottom of the chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  // Track which messages are currently being typed
  const [typingStatus, setTypingStatus] = useState<Record<number, boolean>>({});

  // Handle completion of typing for a message
  const handleTypingComplete = useCallback((index: number) => {
    setTypingStatus(prev => ({
      ...prev,
      [index]: false
    }));
  }, []);

  // 3. Handle sending a new message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isReplying) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const userMessageIndex = messages.length;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsReplying(true);

    // Add an empty assistant message that we'll update with the response
    const botMessage: ChatMessage = { role: 'assistant', content: '' };
    const botMessageIndex = userMessageIndex + 1;
    setMessages(prev => [...prev, botMessage]);
    setTypingStatus(prev => ({
      ...prev,
      [botMessageIndex]: true
    }));

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

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and update the message content
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;
        
        // Update the message content in state
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[botMessageIndex] = {
            ...newMessages[botMessageIndex],
            content: responseText
          };
          return newMessages;
        });
        
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: (error as Error).message || "An error occurred while processing your request.",
        variant: "destructive",
      });
      
      // Remove the bot message if there was an error
      setMessages(prev => prev.filter((_, i) => i !== botMessageIndex));
    } finally {
      // Mark typing as complete
      setTypingStatus(prev => ({
        ...prev,
        [botMessageIndex]: false
      }));
      setIsReplying(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="text-blue-400" />
          AI Chatbot
        </h1>
        <p className="text-muted-foreground">Your personal supportive companion</p>
      </div>

      {/* Chat Messages Area */}
      <Card className="flex-1 overflow-hidden flex flex-col border-0 rounded-none bg-background m-0 p-0 w-full">
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
                  {msg.role === 'assistant' && typingStatus[index] ? (
                    <p>
                      <Typewriter 
                        text={msg.content} 
                        speed={10} 
                        onComplete={() => {
                          handleTypingComplete(index);
                          setIsReplying(false);
                        }} 
                      />
                    </p>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isReplying && !typingStatus[messages.length] && (
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
      <div className="flex-shrink-0 p-4 bg-background border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
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
      </div>
    </div>
  );
};

export default ChatbotPage;


  import { useState, useEffect, useRef } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { useToast } from '@/components/ui/use-toast';
  import { Loader2, Send, ArrowLeft, Sparkles } from 'lucide-react';
  import { Link } from 'react-router-dom';
  import ReactMarkdown from 'react-markdown'; // <-- 1. IMPORTED MARKDOWN
  import { cn } from '@/lib/utils'; // <-- 1. IMPORTED CN
  interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
  }

  export const ConversationPage = () => {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversation messages
    useEffect(() => {
      const fetchMessages = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('No auth token found');

          const response = await fetch(`http://localhost:3000/api/chat/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!response.ok) throw new Error('Failed to load conversation');

          const data = await response.json();
          setMessages(data);
        } catch (error) {
          console.error('Error fetching messages:', error);
          toast({
            title: 'Error',
            description: error.message || 'Failed to load conversation',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };

      if (id) {
        fetchMessages();
      }
    }, [id, toast]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isSending) return;

      const userMessage: ChatMessage = { role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsSending(true);

      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No auth token found');

        const response = await fetch(`http://localhost:3000/api/chat/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: input }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        const botMessage: ChatMessage = await response.json();
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to send message',
          variant: 'destructive',
        });
        // Remove the user's message if sending failed
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsSending(false);
      }
    };

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={cn(
                    'max-w-[80%] p-4 rounded-lg',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white dark:bg-blue-700' // User message in blue
                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white', // Bot message in gray/white
                    'prose max-w-none dark:prose-invert',
                    'prose-p:text-current prose-strong:text-current prose-headings:text-current',
                    'prose-a:text-blue-500 hover:prose-a:text-blue-400',
                    'dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300'
                  )}
                >
                 <ReactMarkdown

                 components={{
                  a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" />
                  }}
                  >{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-lg bg-muted flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button type="submit" disabled={isSending || !input.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  };

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export const ChatSidebar = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Get the active chat ID from the URL
  const { id: activeChatId } = useParams();

  const [isDeleting, setIsDeleting] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Conversation | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch('http://localhost:3000/api/chat', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to load chats');
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: (error as Error).message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeChatId]);

  const handleNewChat = () => {
   navigate('/chat');
  };

  const promptDelete = (e: React.MouseEvent, chat: Conversation) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chat);
  };

  const handleDelete = async () => {
    if (!chatToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/chat/${chatToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete chat');

      toast({
        title: 'Chat Deleted',
        description: `"${chatToDelete.title}" was deleted.`,
      });

      // Update the UI
      setConversations(prev => prev.filter(c => c.id !== chatToDelete.id));

      // If the deleted chat is the one we're viewing, navigate to /chat
      if (activeChatId === chatToDelete.id) {
        navigate('/chat');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete chat',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setChatToDelete(null);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col p-3 border-r border-gray-700 h-full">
      <Button
        variant="outline"
        className="bg-transparent hover:bg-gray-700 justify-start gap-2 mb-4"
        onClick={handleNewChat}
      >
        <Plus className="h-4 w-4" />
        New Chat
      </Button>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-center text-sm text-gray-400 p-4">No conversations yet</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className={cn(
                  "flex items-center justify-between gap-2 p-2 rounded-md text-sm group",
                  "hover:bg-gray-700 transition-colors",
                  activeChatId === chat.id ? "bg-gray-700 font-medium" : "text-gray-400"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                  onClick={(e) => promptDelete(e, chat)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chat:
              <br />
              <strong className="font-semibold">{chatToDelete?.title}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

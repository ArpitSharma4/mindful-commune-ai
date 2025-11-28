import { toast } from "@/hooks/use-toast";

export async function generateShareLink(postId: string): Promise<string | null> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({
        title: "Login required",
        description: "Please log in to share posts.",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }

    const res = await fetch('/api/share/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ postId })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: 'Unable to create share link',
        description: data?.error || 'Please try again later.',
        variant: 'destructive',
        duration: 3000,
      });
      return null;
    }

    return data.shareUrl as string;
  } catch (err) {
    console.error('generateShareLink error', err);
    toast({
      title: 'Network Error',
      description: 'Could not reach server.',
      variant: 'destructive',
      duration: 3000,
    });
    return null;
  }
}

export async function sharePost(postId: string, title?: string) {
  const url = await generateShareLink(postId);
  if (!url) return false;

  // Try native share
  if (navigator.share) {
    try {
      await navigator.share({ title: title || 'Post', url });
      return true;
    } catch (_) {
      // fallthrough to copy
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Share URL copied to clipboard.',
      duration: 3000,
    });
    return true;
  } catch (err) {
    console.error('Clipboard write failed', err);
    toast({
      title: 'Copy failed',
      description: 'Please copy the URL manually: ' + url,
      variant: 'destructive',
      duration: 3000,
    });
    return false;
  }
}

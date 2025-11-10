import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Moon, 
  Globe, 
  Mail, 
  Smartphone,
  Lock,
  Download,
  Trash2,
  ArrowLeft,
  Loader2
} from "lucide-react";
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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("account");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
const [passwordData, setPasswordData] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
});
const [showPasswords, setShowPasswords] = useState({
  current: false,
  new: false,
  confirm: false
});
const [showAvatarDialog, setShowAvatarDialog] = useState(false);
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settings, setSettings] = useState({
    // Account Settings
    displayName: "",
    email: "",
    bio: "",
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    commentReplies: true,
    postUpvotes: false,
    mentions: true,
    communityUpdates: true,
    
    // Feed & Content Settings
    adultContent: false,
    autoplayMedia: true,
    showThumbnails: true,
    defaultSort: "hot",
    
    // Appearance Settings
    theme: "dark", // Default to dark theme
    compactMode: false,
    
    // Language & Region
    language: "en",
    country: "US"
  });

  useEffect(() => {
    // Fetch user data from backend
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setSettings(prev => ({
              ...prev,
              displayName: userData.username,
              email: userData.email
            }));
          }
        }
        
        // Load other settings from localStorage
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
          // Apply theme immediately after loading settings
          if (parsed.theme) {
            applyTheme(parsed.theme);
          }
        } else {
          // Apply default dark theme if no saved settings
          applyTheme('dark');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      // Apply specific theme
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Apply theme on mount and when settings change
  useEffect(() => {
    applyTheme(settings.theme);
    
    // Listen for system theme changes when using system theme
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      // Apply theme immediately when changed
      if (key === 'theme') {
        applyTheme(value);
      }
      
      return newSettings;
    });
  };


  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to delete your account.",
          variant: "destructive",
        });
        return;
      }
  
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        // Clear all local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSettings');
        
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
        });
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const data = await response.json();
        toast({
          title: "Deletion Failed",
          description: data.error || "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  const handlePasswordChange = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to change your password.",
          variant: "destructive",
        });
        return;
      }

      // Validate required fields
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast({
          title: "Missing Information",
          description: "Please fill in all password fields.",
          variant: "destructive",
        });
        return;
      }

      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "New password and confirm password do not match.",
          variant: "destructive",
        });
        return;
      }

      // Validate new password strength
      const passwordErrors = validatePassword(passwordData.newPassword);
      if (passwordErrors.length > 0) {
        toast({
          title: "Password Requirements Not Met",
          description: passwordErrors.join(", "),
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        
        // Reset form and close dialog
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        });
        setShowPasswordDialog(false);
      } else {
        const data = await response.json();
        toast({
          title: "Password Change Failed",
          description: data.error || "Failed to change password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast({
        title: "No File Selected",
        description: "Please select an image file to upload.",
        variant: "destructive",
      });
      return;
    }
  
    setIsUploadingAvatar(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to upload an avatar.",
          variant: "destructive",
        });
        return;
      }
  
      const formData = new FormData();
      formData.append('avatar', avatarFile);
  
      const response = await fetch('/api/users/avatar', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
  
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
        setShowAvatarDialog(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        // Refresh user data
        window.location.reload();
      } else {
        const data = await response.json();
        toast({
          title: "Upload Failed",
          description: data.error || "Failed to upload avatar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const sections = [
     { id: "account", label: t('settings.nav.account'), icon: User },
     { id: "notifications", label: t('settings.nav.notifications'), icon: Bell },
     { id: "appearance", label: t('settings.nav.appearance'), icon: Moon },
    { id: "language", label: t('settings.nav.language'), icon: Globe },
     { id: "data", label: t('settings.nav.data'), icon: Download }
 ];

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) => handleSettingChange("displayName", e.target.value)}
              placeholder="Your display name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => handleSettingChange("email", e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={settings.bio}
              onChange={(e) => handleSettingChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-4">Account Security</h3>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setShowPasswordDialog(true)}
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Smartphone className="h-4 w-4 mr-2" />
            Two-Factor Authentication
          </Button>
        </div>
      </div>
    </div>
  );



  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Browser push notifications</p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Comment Replies</Label>
              <p className="text-sm text-muted-foreground">When someone replies to your comment</p>
            </div>
            <Switch
              checked={settings.commentReplies}
              onCheckedChange={(checked) => handleSettingChange("commentReplies", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Post Upvotes</Label>
              <p className="text-sm text-muted-foreground">When your posts get upvoted</p>
            </div>
            <Switch
              checked={settings.postUpvotes}
              onCheckedChange={(checked) => handleSettingChange("postUpvotes", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Mentions</Label>
              <p className="text-sm text-muted-foreground">When someone mentions you</p>
            </div>
            <Switch
              checked={settings.mentions}
              onCheckedChange={(checked) => handleSettingChange("mentions", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Community Updates</Label>
              <p className="text-sm text-muted-foreground">Updates from communities you follow</p>
            </div>
            <Switch
              checked={settings.communityUpdates}
              onCheckedChange={(checked) => handleSettingChange("communityUpdates", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeedSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Content Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Default Sort</Label>
              <p className="text-sm text-muted-foreground">How posts are sorted by default</p>
            </div>
            <Select value={settings.defaultSort} onValueChange={(value) => handleSettingChange("defaultSort", value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="rising">Rising</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Adult Content</Label>
              <p className="text-sm text-muted-foreground">Show NSFW content (18+)</p>
            </div>
            <Switch
              checked={settings.adultContent}
              onCheckedChange={(checked) => handleSettingChange("adultContent", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Autoplay Media</Label>
              <p className="text-sm text-muted-foreground">Automatically play videos and GIFs</p>
            </div>
            <Switch
              checked={settings.autoplayMedia}
              onCheckedChange={(checked) => handleSettingChange("autoplayMedia", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Thumbnails</Label>
              <p className="text-sm text-muted-foreground">Display image previews in feed</p>
            </div>
            <Switch
              checked={settings.showThumbnails}
              onCheckedChange={(checked) => handleSettingChange("showThumbnails", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Display Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
            </div>
            <Select value={settings.theme} onValueChange={(value) => handleSettingChange("theme", value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">Show more content in less space</p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => handleSettingChange("compactMode", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t('settings.languagePage.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('settings.languagePage.subtitle')}</Label>
              <p className="text-sm text-muted-foreground">Interface language</p>
            </div>
            <Select
            value={i18n.language}
            onValueChange={(value) => i18n.changeLanguage(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Country/Region</Label>
              <p className="text-sm text-muted-foreground">For content recommendations</p>
            </div>
            <Select value={settings.country} onValueChange={(value) => handleSettingChange("country", value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const handleExportJournal = async (format = 'json') => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to export your journal data.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`http://localhost:3000/api/journal/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from content-disposition header or use default
      const disposition = response.headers.get('content-disposition');
      let filename = `journal-export-${new Date().toISOString().split('T')[0]}.${format}`;
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/"/g, '');
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({
        title: "Export Started",
        description: `Your journal data is being downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export journal data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">{t('settings.dataPage.title')}</h3>
        <div className="space-y-3">
<div className="flex gap-2">
            <Select 
              value={exportFormat} 
              onValueChange={setExportFormat}
              disabled={isExporting}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="flex-1 justify-start"
              onClick={() => handleExportJournal(exportFormat)}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                     {t('settings.dataPage.exportLabel')}                </>
              )}
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('settings.dataPage.deleteLabel')}
          </Button>
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All your posts and comments</li>
                <li>Your communities and memberships</li>
                <li>Your profile and settings</li>
                <li>All associated data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );


  const renderContent = () => {
    switch (activeSection) {
      case "account": return renderAccountSettings();
      case "notifications": return renderNotificationSettings();
      case "feed": return renderFeedSettings();
      case "appearance": return renderAppearanceSettings();
      case "language": return renderLanguageSettings();
      case "data": return renderDataSettings();
      default: return renderAccountSettings();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('settings.backButton')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('settings.title')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors ${
                          activeSection === section.id ? 'bg-muted border-r-2 border-primary' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {sections.find(s => s.id === activeSection)?.label}
                </CardTitle>
                <CardDescription>
                  Manage your {sections.find(s => s.id === activeSection)?.label.toLowerCase()} preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current password and choose a new secure password.
              <div className="mt-2 text-xs text-muted-foreground">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter your current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordChange}>
              Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avatar Upload Dialog */}
<AlertDialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Upload Profile Picture</AlertDialogTitle>
      <AlertDialogDescription>
        Choose an image file to use as your profile picture. Max size 5MB.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center gap-4">
        {avatarPreview ? (
          <img 
            src={avatarPreview} 
            alt="Avatar preview" 
            className="h-32 w-32 rounded-full object-cover"
          />
        ) : (
          <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
            <User className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={handleAvatarFileChange}
          className="max-w-xs"
        />
      </div>
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => {
        setAvatarFile(null);
        setAvatarPreview(null);
      }}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleAvatarUpload}
        disabled={!avatarFile || isUploadingAvatar}
      >
        {isUploadingAvatar ? "Uploading..." : "Upload"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  );
};

export default Settings;

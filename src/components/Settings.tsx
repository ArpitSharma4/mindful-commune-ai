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
  Moon, 
  Globe, 
  Mail, 
  Smartphone,
  Lock,
  Download,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("account");
  const [settings, setSettings] = useState({
    // Account Settings
    displayName: "",
    email: "",
    bio: "",
    
    // Privacy Settings
    profileVisibility: "public",
    showOnlineStatus: true,
    allowDirectMessages: true,
    showActivity: true,
    
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
    theme: "system",
    compactMode: false,
    
    // Language & Region
    language: "en",
    country: "US"
  });

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "privacy", label: "Privacy & Safety", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "feed", label: "Feed Settings", icon: Eye },
    { id: "appearance", label: "Appearance", icon: Moon },
    { id: "language", label: "Language & Region", icon: Globe },
    { id: "data", label: "Data & Privacy", icon: Download }
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
          <Button variant="outline" className="w-full justify-start">
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

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Profile Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">Who can see your profile</p>
            </div>
            <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange("profileVisibility", value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Online Status</Label>
              <p className="text-sm text-muted-foreground">Let others see when you're active</p>
            </div>
            <Switch
              checked={settings.showOnlineStatus}
              onCheckedChange={(checked) => handleSettingChange("showOnlineStatus", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Direct Messages</Label>
              <p className="text-sm text-muted-foreground">Let others send you private messages</p>
            </div>
            <Switch
              checked={settings.allowDirectMessages}
              onCheckedChange={(checked) => handleSettingChange("allowDirectMessages", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Activity</Label>
              <p className="text-sm text-muted-foreground">Display your recent activity</p>
            </div>
            <Switch
              checked={settings.showActivity}
              onCheckedChange={(checked) => handleSettingChange("showActivity", checked)}
            />
          </div>
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
        <h3 className="text-lg font-medium mb-4">Localization</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">Interface language</p>
            </div>
            <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
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

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Data Management</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Download My Data
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "account": return renderAccountSettings();
      case "privacy": return renderPrivacySettings();
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
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
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
                
                <div className="flex justify-end mt-8 pt-6 border-t">
                  <Button onClick={handleSave} variant="therapeutic">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

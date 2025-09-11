import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

  // Password validation rules
  const passwordRules = {
    minLength: { test: (pwd: string) => pwd.length >= 8, message: "At least 8 characters" },
    hasUppercase: { test: (pwd: string) => /[A-Z]/.test(pwd), message: "One uppercase letter" },
    hasLowercase: { test: (pwd: string) => /[a-z]/.test(pwd), message: "One lowercase letter" },
    hasNumber: { test: (pwd: string) => /\d/.test(pwd), message: "One number" },
    hasSpecial: { test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), message: "One special character" }
  };

  const validatePassword = (password: string) => {
    return Object.entries(passwordRules).map(([key, rule]) => ({
      key,
      valid: rule.test(password),
      message: rule.message
    }));
  };

  const isPasswordValid = (password: string) => {
    return Object.values(passwordRules).every(rule => rule.test(password));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token and user data
        localStorage.setItem('authToken', data.token);
        
        // Decode the JWT to get user info (username, userId)
        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('userData', JSON.stringify({
          userId: tokenPayload.userId,
          username: tokenPayload.username
        }));
        
        onLoginSuccess();
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!isPasswordValid(formData.password)) {
      toast({
        title: "Password Requirements Not Met",
        description: "Please ensure your password meets all the requirements.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Account Created! ",
          description: "Welcome to EchoWell! Please log in with your credentials.",
        });
        // Switch to login view after successful signup
        setCurrentView('login');
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "", name: "" }));
      } else {
        toast({
          title: "Signup Failed",
          description: data.error || "Unable to create account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Reset Link Sent! ",
      description: "Check your email for password reset instructions.",
    });
    setCurrentView('login');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ email: "", password: "", confirmPassword: "", name: "" });
    setCurrentView('login');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          Remember me
        </label>
        <Button 
          type="button"
          variant="link" 
          className="p-0 h-auto text-sm"
          onClick={() => setCurrentView('forgot')}
        >
          Forgot password?
        </Button>
      </div>

      <Button type="submit" className="w-full" variant="therapeutic">
        Sign In
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Button 
          type="button"
          variant="link" 
          className="p-0 h-auto text-sm"
          onClick={() => setCurrentView('signup')}
        >
          Sign up
        </Button>
      </div>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignup} className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Password Requirements */}
        {formData.password && (
          <div className="mt-2 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Password Strength</p>
              <span className="text-xs text-muted-foreground">
                {validatePassword(formData.password).filter(rule => rule.valid).length}/5
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  validatePassword(formData.password).filter(rule => rule.valid).length === 0 ? 'w-0 bg-destructive' :
                  validatePassword(formData.password).filter(rule => rule.valid).length <= 2 ? 'bg-destructive' :
                  validatePassword(formData.password).filter(rule => rule.valid).length <= 4 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ 
                  width: `${(validatePassword(formData.password).filter(rule => rule.valid).length / 5) * 100}%` 
                }}
              />
            </div>
            
            {/* Strength Label */}
            <p className={`text-xs font-medium ${
              validatePassword(formData.password).filter(rule => rule.valid).length === 0 ? 'text-muted-foreground' :
              validatePassword(formData.password).filter(rule => rule.valid).length <= 2 ? 'text-destructive' :
              validatePassword(formData.password).filter(rule => rule.valid).length <= 4 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {validatePassword(formData.password).filter(rule => rule.valid).length === 0 ? 'Enter password' :
               validatePassword(formData.password).filter(rule => rule.valid).length <= 2 ? 'Weak' :
               validatePassword(formData.password).filter(rule => rule.valid).length <= 4 ? 'Medium' :
               'Strong'}
            </p>
            
            {/* Show missing requirements only when password is not strong */}
            {validatePassword(formData.password).filter(rule => rule.valid).length < 5 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Missing: {validatePassword(formData.password)
                  .filter(rule => !rule.valid)
                  .map(rule => rule.message.toLowerCase())
                  .join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            className="pl-10"
            required
          />
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Passwords do not match
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        variant="therapeutic"
        disabled={!isPasswordValid(formData.password) || formData.password !== formData.confirmPassword}
      >
        Create Account
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button 
          type="button"
          variant="link" 
          className="p-0 h-auto text-sm"
          onClick={() => setCurrentView('login')}
        >
          Sign in
        </Button>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
      <div className="text-center space-y-2 mb-4">
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" variant="therapeutic">
        Send Reset Link
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Button 
          type="button"
          variant="link" 
          className="p-0 h-auto text-sm"
          onClick={() => setCurrentView('login')}
        >
          Sign in
        </Button>
      </div>
    </form>
  );

  const getTitle = () => {
    switch (currentView) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  return (
    <>
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background border rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{getTitle()}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content */}
          {currentView === 'login' && renderLoginForm()}
          {currentView === 'signup' && renderSignupForm()}
          {currentView === 'forgot' && renderForgotPasswordForm()}
        </div>
      </div>
    </>
  );
};

export default LoginModal;

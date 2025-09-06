import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface LoginPageProps {
  onBack: () => void;
  onSignUp: () => void;
  prefillEmail?: string;
}

export default function LoginPage({ onBack, onSignUp, prefillEmail }: LoginPageProps) {
  const { signIn } = useAuth();
  
  // Ensure prefillEmail is always a string
  const emailValue = typeof prefillEmail === 'string' ? prefillEmail : '';
  
  const [formData, setFormData] = useState({
    email: emailValue,
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update email when prefillEmail changes
  React.useEffect(() => {
    const emailVal = typeof prefillEmail === 'string' ? prefillEmail : '';
    if (emailVal) {
      setFormData(prev => ({ ...prev, email: emailVal }));
    }
  }, [prefillEmail]);

  const canSubmit = formData.email && formData.password && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    const result = await signIn(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error || "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-[#A0A0A0] hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="bg-[#2A2A2A] border-[#2A2A2A]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black text-white">Welcome Back</CardTitle>
            <CardDescription className="text-[#A0A0A0]">
              Time to do the work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white placeholder-[#A0A0A0] focus:border-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-[#1A1A1A] border-[#1A1A1A] text-white placeholder-[#A0A0A0] focus:border-white pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-[#A0A0A0]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#A0A0A0]" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-[#A0A0A0] cursor-pointer"
                  >
                    Remember me for 30 days
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-[#A0A0A0] hover:text-white p-0 h-auto text-sm"
                >
                  Forgot password?
                </Button>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-white text-black hover:bg-[#A0A0A0] disabled:bg-[#1A1A1A] disabled:text-[#A0A0A0] disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Continue Journey"}
              </Button>

              <div className="text-center pt-4">
                <span className="text-[#A0A0A0]">New here? </span>
                <Button
                  type="button"
                  variant="link"
                  className="text-white hover:text-[#A0A0A0] p-0 h-auto font-normal"
                  onClick={onSignUp}
                >
                  Sign up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SignUpPageProps {
  onBack: () => void;
  onLogin: (email?: string) => void;
}

export default function SignUpPage({ onBack, onLogin }: SignUpPageProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "One number", met: /\d/.test(formData.password) },
    { text: "One special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const canSubmit = formData.fullName && 
                    formData.email && 
                    isPasswordValid && 
                    passwordsMatch && 
                    agreedToTerms && 
                    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    // Additional client-side validation
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.fullName.trim().length < 2) {
      setError("Please enter your full name");
      setLoading(false);
      return;
    }

    const result = await signUp(formData.email.trim().toLowerCase(), formData.password, formData.fullName.trim());
    
    if (!result.success) {
      // Handle specific error cases with better user messages
      let errorMessage = result.error || "Sign up failed";
      
      if (errorMessage.includes("already been registered") || 
          errorMessage.includes("already exists") ||
          errorMessage.includes("User already registered") ||
          errorMessage.includes("Account already exists") ||
          errorMessage.includes("email address has already been registered") ||
          errorMessage.includes("Please try logging in instead")) {
        errorMessage = "Account already exists with this email";
      } else if (errorMessage.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (errorMessage.includes("Password")) {
        errorMessage = "Password doesn't meet requirements. Please check above.";
      } else if (errorMessage.includes("Network error") || errorMessage.includes("Failed to fetch")) {
        errorMessage = "Connection failed. Please check your internet and try again.";
      } else if (errorMessage.includes("Signup failed:")) {
        // Extract the actual error from server error messages
        errorMessage = errorMessage.replace("Signup failed: ", "");
      }
      
      setError(errorMessage);
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
            <CardTitle className="text-2xl font-black text-white">Create Your Account</CardTitle>
            <CardDescription className="text-[#A0A0A0]">
              30 days from now, you'll thank yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white placeholder-[#A0A0A0] focus:border-white"
                  required
                />
              </div>

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
                    placeholder="Create a strong password"
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

                {formData.password && (
                  <div className="space-y-1 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-sm">
                        {req.met ? (
                          <Check className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-[#A0A0A0] mr-2" />
                        )}
                        <span className={req.met ? "text-green-500" : "text-[#A0A0A0]"}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-[#1A1A1A] border-[#1A1A1A] text-white placeholder-[#A0A0A0] focus:border-white pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-[#A0A0A0]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#A0A0A0]" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-red-500 text-sm">Passwords don't match</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-[#A0A0A0] cursor-pointer"
                >
                  I agree to show up every damn day
                </Label>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm font-medium mb-2">{error}</p>
                  {(error.includes("already registered") || error.includes("Account already exists") || error.includes("email address has already been registered") || error.includes("Please try logging in instead")) && (
                    <div className="space-y-2">
                      <p className="text-[#A0A0A0] text-xs">
                        Looks like you already have an account. Try logging in instead.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                        onClick={() => onLogin(formData.email)}
                      >
                        Go to Login Page
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-white text-black hover:bg-[#A0A0A0] disabled:bg-[#1A1A1A] disabled:text-[#A0A0A0] disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Start My Journey"}
              </Button>

              <div className="text-center pt-4 space-y-2">
                <div>
                  <span className="text-[#A0A0A0]">Already started? </span>
                  <Button
                    type="button"
                    variant="link"
                    className="text-white hover:text-[#A0A0A0] p-0 h-auto font-normal"
                    onClick={() => onLogin()}
                  >
                    Log in here
                  </Button>
                </div>
                <p className="text-xs text-[#666]">
                  If you get an "account exists" error, try logging in instead
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
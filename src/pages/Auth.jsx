import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  // Sign in form
  const [signInData, setSignInData] = useState({ email: "", password: "" });

  // Sign up form
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Fetch user profile to get role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Redirect to appropriate dashboard
          if (profile.role === 'customer') {
            navigate(createPageUrl('CustomerDashboard'));
          } else {
            navigate(createPageUrl('VendorDashboard'));
          }
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!signInData.email || !signInData.password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (signInError) throw signInError;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Set session (keeping localStorage for compatibility with existing code for now)
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', profile.email || data.user.email); // Profile might not have email column, use auth user
      localStorage.setItem('userName', profile.display_name);
      localStorage.setItem('userRole', profile.role);

      toast.success("Signed in successfully");

      // Redirect to dashboard
      if (profile.role === 'customer') {
        navigate(createPageUrl('CustomerDashboard'));
      } else {
        navigate(createPageUrl('VendorDashboard'));
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!signUpData.name || !signUpData.email || !signUpData.password || !signUpData.role) {
      setError("Please fill in all fields");
      return;
    }

    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            display_name: signUpData.name,
            role: signUpData.role
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              role: signUpData.role,
              display_name: signUpData.name,
              status: 'active'
            }
          ]);

        if (profileError) {
          // If profile creation fails, we might want to delete the user or retry.
          // For now, just log it.
          console.error("Profile creation error:", profileError);
          throw new Error("Failed to create user profile");
        }

        // Set session
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', signUpData.email);
        localStorage.setItem('userName', signUpData.name);
        localStorage.setItem('userRole', signUpData.role);

        toast.success("Account created successfully");

        // Redirect to dashboard
        if (signUpData.role === 'customer') {
          navigate(createPageUrl('CustomerDashboard'));
        } else {
          navigate(createPageUrl('VendorDashboard'));
        }
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#CEFF00] selection:text-black overflow-hidden flex items-center justify-center px-4 py-12 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#CEFF00]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#CEFF00]/5 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back to Home button */}
        <Link to={createPageUrl('Home')} className="inline-flex items-center space-x-2 text-gray-600 hover:text-black transition-colors mb-8">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <div className="glass-card rounded-3xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-white">EASY</span>
              <span className="neon-text">CUSTOMIZED</span>
            </h1>
            <p className="text-gray-600">
              {activeTab === "signin" ? "Welcome Back" : "Create Your Account"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "signin" ? "Sign in to access your dashboard" : "Sign up to continue"}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 p-1 rounded-xl">
              <TabsTrigger
                value="signin"
                className="rounded-lg data-[state=active]:bg-[#CEFF00] data-[state=active]:text-[#0D0D0D] transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg data-[state=active]:bg-[#CEFF00] data-[state=active]:text-[#0D0D0D] transition-all"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <Label htmlFor="signin-email" className="text-white mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      className="bg-white/5 border-[#CEFF00]/20 text-white pl-11 h-12 focus:border-[#CEFF00]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signin-password" className="text-white mb-2 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      className="bg-white/5 border-[#CEFF00]/20 text-white pl-11 pr-11 h-12 focus:border-[#CEFF00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 glow-button rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                New to EASYCUSTOMIZED?{" "}
                <button
                  onClick={() => setActiveTab("signup")}
                  className="text-[#CEFF00] hover:underline font-semibold"
                >
                  Sign up to create your account
                </button>
              </p>
            </TabsContent>

            {/* Sign Up Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <Label htmlFor="signup-name" className="text-white mb-2 block">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      className="bg-white/5 border-[#CEFF00]/20 text-white pl-11 h-12 focus:border-[#CEFF00]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email" className="text-white mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className="bg-white/5 border-[#CEFF00]/20 text-white pl-11 h-12 focus:border-[#CEFF00]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-role" className="text-white mb-2 block">I want to</Label>
                  <select
                    id="signup-role"
                    value={signUpData.role}
                    onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-[#CEFF00]/20 text-white rounded-lg px-4 focus:border-[#CEFF00] focus:outline-none"
                  >
                    <option value="" className="bg-[#1A1A1A]">Select your role</option>
                    <option value="customer" className="bg-[#1A1A1A]">Buy Products (Customer)</option>
                    <option value="vendor" className="bg-[#1A1A1A]">Sell Products (Vendor)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="signup-password" className="text-white mb-2 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      className="bg-white/5 border-[#CEFF00]/20 text-white pl-11 pr-11 h-12 focus:border-[#CEFF00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                </div>

                <div>
                  <Label htmlFor="signup-confirm-password" className="text-white mb-2 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      className="bg-white/5 border-[#CEFF00]/20 text-white pl-11 pr-11 h-12 focus:border-[#CEFF00]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 glow-button rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Sign Up</span>
                  )}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                Already have an account?{" "}
                <button
                  onClick={() => setActiveTab("signin")}
                  className="text-[#CEFF00] hover:underline font-semibold"
                >
                  Sign in here
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;
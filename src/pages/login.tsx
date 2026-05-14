import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react";
import StarBackground from "@/components/star-background";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Standard cleanup
    const savedUsername = localStorage.getItem("savedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
    
    // Hard refresh check to clear any leaked state/styles
    if (window.location.pathname !== '/login' && !isLogin) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError("");
    setSuccess("");

    // Login validation
    if (isLogin) {
      if (!username.trim()) {
        setError("Please enter your username or email");
        return;
      }
      if (!password.trim()) {
        setError("Please enter your password");
        return;
      }
    } else {
      // Signup validation
      if (!username.trim()) {
        setError("Please enter your username");
        return;
      }
      if (username.trim().length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your email");
        return;
      }
      if (!password.trim()) {
        setError("Please enter your password");
        return;
      }
      if (password.trim().length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const body: any = { username, password };
      
      // For signup, include email
      if (!isLogin) {
        body.email = email.trim();
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.friendlyMessage || data.message || `${isLogin ? "Login" : "Registration"} failed. Please try again.`);
        setLoading(false);
        return;
      }

      if (isLogin && rememberMe) {
        localStorage.setItem("savedUsername", username);
      } else if (isLogin) {
        localStorage.removeItem("savedUsername");
      }

      setSuccess(`${isLogin ? "Login" : "Registration"} successful! Redirecting...`);
      
      // Prevent white flash by waiting for a smooth transition
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <StarBackground />
      
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 z-20 group">
        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2 px-4 py-6 rounded-xl border border-white/0 hover:border-white/10 transition-all backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold tracking-tight">Back to Home</span>
        </Button>
      </Link>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 shadow-xl mb-4 border border-yellow-500/30">
            <span className="text-4xl text-yellow-500 font-black tracking-tighter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">&gt;_</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Social Suite <span className="text-yellow-500">Pro</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Built by <span className="text-yellow-500/80">RantiDevs</span></p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-8">
          <div className="flex gap-4 mb-8 border-b border-slate-800 pb-4">
            <button 
              onClick={() => { setIsLogin(true); setError(""); setSuccess(""); setEmail(""); }}
              className={`flex-1 text-sm font-bold pb-2 transition-all ${isLogin ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              LOGIN
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
              className={`flex-1 text-sm font-bold pb-2 transition-all ${!isLogin ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SIGN UP
            </button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500/50 bg-green-500/10">
              <Check className="h-4 w-4 text-green-400" />
              <AlertDescription className="ml-2 text-green-300">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {isLogin ? "Username or Email" : "Username"}
              </label>
              <Input
                type="text"
                placeholder={isLogin ? "Enter username or email" : "Enter username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-800/50 border border-slate-700 hover:border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder:text-slate-500 transition-all rounded-lg py-2.5 px-4"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-800/50 border border-slate-700 hover:border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder:text-slate-500 transition-all rounded-lg py-2.5 px-4"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-800/50 border border-slate-700 hover:border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder:text-slate-500 transition-all rounded-lg py-2.5 px-4 pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-slate-400 cursor-pointer">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          <p>© 2024 Social Suite Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

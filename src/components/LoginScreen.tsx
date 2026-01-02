import { useState } from 'react';
import { signIn, signUp, signInWithGoogle, type AuthUser } from '@/lib/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logo } from '@/assets';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    if (isSignUp) {
      const { user, error: signUpError } = await signUp(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(signUpError || 'Failed to create account');
      }
    } else {
      const { user, error: signInError } = await signIn(email, password);
      if (user) {
        onLoginSuccess(user);
      } else if (signInError?.includes('Invalid')) {
        const { user: newUser, error: signUpError } = await signUp(email, password);
        if (newUser) {
          onLoginSuccess(newUser);
        } else {
          setError(signUpError || signInError || 'Invalid credentials');
        }
      } else {
        setError(signInError || 'Failed to sign in');
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#4A5FFF]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FF6B35]/8 rounded-full blur-[120px]" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src={logo}
            alt="Beyond The Game"
            className="h-28 w-auto mx-auto mb-4"
          />
          <p className="text-[#B8BCC8] text-sm tracking-wide">
            Financial Literacy for Students
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#12162F]/80 backdrop-blur-xl border border-[#2A2F4F] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white text-center mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-[#B8BCC8] text-sm text-center mb-8">
            {isSignUp
              ? 'Start your journey to financial freedom'
              : 'Sign in to continue learning'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-[#FF4757]/10 border border-[#FF4757]/20">
              <p className="text-[#FF4757] text-sm text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#B8BCC8] text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full bg-[#0A0E27] border border-[#2A2F4F] rounded-xl px-4 py-3.5 text-white placeholder-[#4A4F6A] focus:outline-none focus:border-[#4A5FFF] transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-[#B8BCC8] text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full bg-[#0A0E27] border border-[#2A2F4F] rounded-xl px-4 py-3.5 pr-12 text-white placeholder-[#4A4F6A] focus:outline-none focus:border-[#4A5FFF] transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4F6A] hover:text-[#B8BCC8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-white mt-6",
                "bg-gradient-to-r from-[#4A5FFF] to-[#6B7FFF]",
                "hover:from-[#5A6FFF] hover:to-[#7B8FFF]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2F4F]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#12162F] text-[#4A4F6A] text-sm">or</span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#0A0E27] border border-[#2A2F4F] text-white hover:bg-[#0F1332] hover:border-[#3A3F5F] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium">Continue with Google</span>
          </button>

          {/* Toggle */}
          <p className="text-center mt-8 text-[#B8BCC8] text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-[#4A5FFF] hover:text-[#6B7FFF] font-medium transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-[#4A4F6A] text-xs">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

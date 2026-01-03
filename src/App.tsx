import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type AuthUser, getCurrentUser } from '@/lib/auth';
import { type Enrollment } from '@/lib/enrollment';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { LoginScreen } from '@/components/LoginScreen';
import { ProgramSelectScreen } from '@/components/ProgramSelectScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { CoursesScreen } from '@/components/CoursesScreen';
import { GamesScreen } from '@/components/GamesScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { Loader2, Home, GraduationCap, Gamepad2, User, ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logo } from '@/assets';

type EnrollmentState = 'checking' | 'needs_program' | 'needs_onboarding' | 'ready' | 'error';
type ActiveTab = 'dashboard' | 'courses' | 'games' | 'profile';

function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Enrollment state
  const [enrollmentState, setEnrollmentState] = useState<EnrollmentState>('checking');
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Online status
  const { isOnline, isSyncing, syncNow } = useOnlineStatus();

  // Check auth state on mount
  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!isSubscribed) return;

        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
          await checkEnrollment(currentUser.id);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        if (isSubscribed) {
          setAuthLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          isNewUser: false,
        };
        setUser(authUser);
        setIsLoggedIn(true);
        await checkEnrollment(authUser.id);
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        setEnrollment(null);
        setEnrollmentState('checking');
        setActiveTab('dashboard');
        setAuthLoading(false);
      }
    });

    // Timeout for loading
    const timeout = setTimeout(() => {
      if (isSubscribed) {
        setAuthLoading(false);
      }
    }, 10000);

    checkAuth();

    return () => {
      isSubscribed = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Failsafe: Force exit from 'checking' state after 5 seconds
  useEffect(() => {
    if (enrollmentState !== 'checking') return;

    const failsafe = setTimeout(() => {
      console.warn('FAILSAFE: Force exiting enrollment check after 5 seconds');
      // Check localStorage for cached enrollment
      const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
      if (cachedEnrollment) {
        try {
          const parsed = JSON.parse(cachedEnrollment);
          setEnrollment(parsed);
          const onboardingComplete = localStorage.getItem('btg-onboarding-complete') === 'true';
          setEnrollmentState(onboardingComplete ? 'ready' : 'needs_onboarding');
          return;
        } catch {
          // Ignore parse errors
        }
      }
      setEnrollmentState('needs_program');
    }, 5000);

    return () => clearTimeout(failsafe);
  }, [enrollmentState]);

  // Check enrollment status - LOCAL ONLY for instant loading
  const checkEnrollment = async (_userId: string) => {
    // INSTANT: Check localStorage only - no network calls on initial load
    const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
    if (cachedEnrollment) {
      try {
        const parsed = JSON.parse(cachedEnrollment);
        console.log('Using cached enrollment');
        setEnrollment(parsed);
        const onboardingComplete = localStorage.getItem('btg-onboarding-complete') === 'true';
        setEnrollmentState(onboardingComplete ? 'ready' : 'needs_onboarding');
        return;
      } catch {
        // Invalid cache
      }
    }

    // No cache = need to select program (network check happens during enrollment)
    console.log('No cached enrollment, showing program select');
    setEnrollmentState('needs_program');
  };

  // Handle enrollment created
  const handleEnrollmentCreated = async () => {
    if (user) {
      await checkEnrollment(user.id);
    }
  };

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    setEnrollmentState('ready');
  };

  // Handle sign out
  const handleSignOut = () => {
    setUser(null);
    setIsLoggedIn(false);
    setEnrollment(null);
    setEnrollmentState('checking');
    setActiveTab('dashboard');
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'games' as const, label: 'Games', icon: Gamepad2 },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="particle-bg" />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle login success
  const handleLoginSuccess = async (authUser: AuthUser) => {
    setUser(authUser);
    setIsLoggedIn(true);
    await checkEnrollment(authUser.id);
  };

  // Login screen
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Program selection
  if (enrollmentState === 'needs_program') {
    return (
      <ProgramSelectScreen
        onEnrollmentCreated={handleEnrollmentCreated}
        userEmail={user?.email}
      />
    );
  }

  // Onboarding
  if (enrollmentState === 'needs_onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Checking enrollment state
  if (enrollmentState === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="particle-bg" />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Checking enrollment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (enrollmentState === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="particle-bg" />
        <div className="glass-card p-8 rounded-xl text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">
            Failed to load your enrollment. Please try again.
          </p>
          <button
            onClick={() => user && checkEnrollment(user.id)}
            className="btn-3d gradient-blue px-6 py-2 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main app with sidebar
  return (
    <div className="min-h-screen bg-background flex">
      <div className="particle-bg" />

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 flex-col sidebar-transition",
          sidebarCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#2A2F4F]">
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="Beyond The Game"
              className={cn(
                "object-contain transition-all",
                sidebarCollapsed ? "h-10 w-10" : "h-14"
              )}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-[var(--primary-500)]/10 text-[var(--primary-500)] border-l-[3px] border-[var(--primary-500)] pl-[13px]"
                    : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[var(--primary-500)]")} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Online status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            isOnline ? "bg-success-green/10" : "bg-destructive/10"
          )}>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-success-green" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            {!sidebarCollapsed && (
              <span className={cn(
                "text-sm",
                isOnline ? "text-success-green" : "text-destructive"
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
            {isSyncing && (
              <RefreshCw className="h-4 w-4 text-primary animate-spin ml-auto" />
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {enrollment?.program_id === 'HS' ? 'High School' : 'College'}
                </p>
              </div>
            )}
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content - Full width on mobile, offset on desktop */}
      <main
        className={cn(
          "min-h-screen w-full transition-all duration-300",
          "md:ml-[var(--sidebar-width)] md:w-[calc(100vw-var(--sidebar-width))]",
          sidebarCollapsed && "md:ml-[var(--sidebar-width-collapsed)] md:w-[calc(100vw-var(--sidebar-width-collapsed))]"
        )}
      >
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-destructive/20 border-b border-destructive/30 px-4 py-2 flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="text-xs md:text-sm text-destructive">
              You're offline. Changes will sync when you reconnect.
            </span>
            <button
              onClick={syncNow}
              className="text-xs md:text-sm underline text-destructive hover:no-underline ml-2"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Content - Add bottom padding for mobile nav */}
        <div className="w-full p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-sm md:text-base text-[#B8BCC8]">
              {activeTab === 'dashboard' && 'Welcome back! Here\'s your progress.'}
              {activeTab === 'courses' && 'Continue your financial literacy journey.'}
              {activeTab === 'games' && 'Learn through interactive games.'}
              {activeTab === 'profile' && 'Manage your account and settings.'}
            </p>
          </div>

          {/* Screen Components */}
          {activeTab === 'dashboard' && (
            <DashboardScreen
              enrollment={enrollment}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesScreen enrollment={enrollment} />
          )}

          {activeTab === 'games' && (
            <GamesScreen />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              enrollment={enrollment}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Show only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 safe-area-bottom">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-[var(--primary-500)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;

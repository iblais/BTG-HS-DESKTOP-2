import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type AuthUser, getCurrentUser } from '@/lib/auth';
import { type Enrollment, createEnrollment } from '@/lib/enrollment';
import { LoginScreen } from '@/components/LoginScreen';
// ProgramSelectScreen removed - users are now auto-enrolled
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { CoursesScreen } from '@/components/CoursesScreen';
import { GamesScreen } from '@/components/GamesScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { Loader2, Home, GraduationCap, Gamepad2, User, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // User profile state
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

          // Fetch user profile for avatar and display name
          const { data: userProfile } = await supabase
            .from('users')
            .select('avatar_url, display_name')
            .eq('id', currentUser.id)
            .single();

          if (userProfile) {
            setUserAvatarUrl(userProfile.avatar_url);
            setUserDisplayName(userProfile.display_name);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        if (isSubscribed) setAuthLoading(false);
      }
    };

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

        // Fetch user profile for avatar and display name
        const { data: userProfile } = await supabase
          .from('users')
          .select('avatar_url, display_name')
          .eq('id', authUser.id)
          .single();

        if (userProfile) {
          setUserAvatarUrl(userProfile.avatar_url);
          setUserDisplayName(userProfile.display_name);
        }

        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        setEnrollment(null);
        setEnrollmentState('checking');
        setActiveTab('dashboard');
        setUserAvatarUrl(null);
        setUserDisplayName(null);
        setAuthLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      if (isSubscribed) setAuthLoading(false);
    }, 10000);

    checkAuth();

    return () => {
      isSubscribed = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Failsafe for enrollment check
  useEffect(() => {
    if (enrollmentState !== 'checking') return;

    const failsafe = setTimeout(() => {
      const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
      if (cachedEnrollment) {
        try {
          const parsed = JSON.parse(cachedEnrollment);
          setEnrollment(parsed);
          localStorage.setItem('btg-onboarding-complete', 'true');
          setEnrollmentState('ready');
          return;
        } catch {
          // Ignore parse errors
        }
      }
      setEnrollmentState('needs_program');
    }, 5000);

    return () => clearTimeout(failsafe);
  }, [enrollmentState]);

  // Auto-enroll new users in HS Beginner program (English)
  useEffect(() => {
    if (enrollmentState !== 'needs_program' || !user) return;

    const autoEnroll = async () => {
      try {
        const newEnrollment = await createEnrollment('HS', 'beginner', 'en');
        setEnrollment(newEnrollment);
        localStorage.setItem('btg-onboarding-complete', 'true');
        setEnrollmentState('ready');
      } catch (err) {
        console.error('Auto-enrollment failed:', err);
        // Still try to proceed with a local-only enrollment
        setEnrollmentState('ready');
      }
    };

    autoEnroll();
  }, [enrollmentState, user]);

  // Check enrollment - LOCAL ONLY for instant loading
  const checkEnrollment = async (_userId: string) => {
    const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
    if (cachedEnrollment) {
      try {
        const parsed = JSON.parse(cachedEnrollment);
        setEnrollment(parsed);
        localStorage.setItem('btg-onboarding-complete', 'true');
        setEnrollmentState('ready');
        return;
      } catch {
        // Invalid cache
      }
    }
    setEnrollmentState('needs_program');
  };

  const handleEnrollmentCreated = async () => {
    if (user) await checkEnrollment(user.id);
  };

  const handleOnboardingComplete = () => setEnrollmentState('ready');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('btg_local_enrollment');
    localStorage.removeItem('btg-onboarding-complete');
    setUser(null);
    setIsLoggedIn(false);
    setEnrollment(null);
    setEnrollmentState('checking');
    setActiveTab('dashboard');
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'courses' as const, label: 'Courses', icon: GraduationCap },
    { id: 'games' as const, label: 'Games', icon: Gamepad2 },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#6366F1] animate-spin" />
          <p className="text-[#9CA3AF]">Loading...</p>
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

  // Auto-enrolling (was program selection - now handled automatically)
  if (enrollmentState === 'needs_program') {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#6366F1] animate-spin" />
          <p className="text-[#9CA3AF]">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Onboarding
  if (enrollmentState === 'needs_onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Checking enrollment state
  if (enrollmentState === 'checking') {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#6366F1] animate-spin" />
          <p className="text-[#9CA3AF]">Checking enrollment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (enrollmentState === 'error') {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
        <div className="bg-[#12162F] border border-white/10 p-8 rounded-xl text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-[#9CA3AF] mb-4">Failed to load your enrollment. Please try again.</p>
          <button
            onClick={() => user && checkEnrollment(user.id)}
            className="px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#5558E3] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate sidebar width
  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  // Main app layout
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-full bg-[#12162F] border-r border-white/10 z-50 flex-col transition-all duration-300",
        )}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="Beyond The Game"
              className={cn("object-contain transition-all", sidebarCollapsed ? "h-10 w-10" : "h-14")}
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
                    ? "bg-[#6366F1]/10 text-[#6366F1] border-l-[3px] border-[#6366F1] pl-[13px]"
                    : "text-[#9CA3AF] hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[#6366F1]")} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-sm font-bold">
                {(userDisplayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userDisplayName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {enrollment?.program_id === 'HS' ? 'High School' : 'College'}
                </p>
              </div>
            )}
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#9CA3AF] hover:bg-white/5 transition-colors"
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

      {/* Main Content Area */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          paddingBottom: isMobile ? '100px' : '0',
        }}
      >
        {/* Content wrapper */}
        <div className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-sm md:text-base text-[#9CA3AF]">
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
              onAvatarUpdate={(avatarUrl) => setUserAvatarUrl(avatarUrl)}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#12162F] border-t border-white/10 z-50"
        style={{ height: '64px' }}
      >
        <div className="grid grid-cols-4 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive ? "text-[#6366F1]" : "text-[#6B7280]"
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

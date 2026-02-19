import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type AuthUser } from '@/lib/auth';
import { type Enrollment, createEnrollment, getActiveEnrollment } from '@/lib/enrollment';
import { isTeacher } from '@/lib/teacher';
import { LoginScreen } from '@/components/LoginScreen';
// ProgramSelectScreen removed - users are now auto-enrolled
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { CoursesScreen } from '@/components/CoursesScreen';
import { GamesScreen } from '@/components/GamesScreen';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { TeacherPortal } from '@/components/teacher';
import { Loader2, Home, GraduationCap, Gamepad2, Trophy, User, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logo } from '@/assets';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

type ActiveTab = 'dashboard' | 'courses' | 'games' | 'leaderboard' | 'profile' | 'teacher';
type EnrollmentState = 'checking' | 'needs_program' | 'needs_onboarding' | 'ready' | 'error';

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}


function AppContent() {
  const { t } = useLanguage();
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

  // Teacher state
  const [isUserTeacher, setIsUserTeacher] = useState(false);

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);

  // Track initialization
  // const initRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FAST initialization - localStorage first, database in background
  useEffect(() => {
    let mounted = true;
    console.log('App: useEffect mounted', { hash: window.location.hash });

    const initializeAuth = async () => {
      console.log('App: initializeAuth started');
      // STEP 1: Check localStorage INSTANTLY for cached enrollment
      const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
      if (cachedEnrollment) {
        try {
          const parsed = JSON.parse(cachedEnrollment);
          setEnrollment(parsed);
          setEnrollmentState('ready');
        } catch {
          // Invalid cache, will handle below
        }
      }

      try {
        // STEP 1.5: Manually handle OAuth redirect tokens from URL hash
        // Supabase's internal _getSessionFromURL can crash on some deployments
        // We manually extract and set the session to bypass that issue
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          console.log('App: Found access_token in URL hash, manually setting session');
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            console.log('App: Manual setSession result:', {
              hasSession: !!data.session,
              error: error?.message
            });
            // Clear the hash from the URL to prevent stale token issues
            if (data.session) {
              window.location.hash = '';
            }
          }
        }

        // STEP 2: Check auth session (will now find the session we just set)
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            isNewUser: false,
          };
          setUser(authUser);
          setIsLoggedIn(true);

          // If we already have cached enrollment, we're done loading
          // Just sync with database in background
          if (cachedEnrollment) {
            setAuthLoading(false);
            // Background sync - don't await
            syncEnrollmentInBackground(authUser.id);
          } else {
            // No cache - need to check enrollment (but fast)
            await checkEnrollment(authUser.id);
            if (mounted) setAuthLoading(false);
          }

          // These are all non-blocking background operations
          supabase
            .from('users')
            .select('avatar_url, display_name')
            .eq('id', authUser.id)
            .single()
            .then(({ data: userProfile }) => {
              if (mounted && userProfile) {
                setUserAvatarUrl(userProfile.avatar_url);
                setUserDisplayName(userProfile.display_name);
              }
            });

          isTeacher().then(res => {
            if (mounted) setIsUserTeacher(res);
          }).catch(() => {
            if (mounted) setIsUserTeacher(false);
          });
        } else if (mounted) {
          // No session - show login
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Auth init failed:', error);
        if (mounted) setAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: onAuthStateChange', event, session?.user?.id);
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          isNewUser: false,
        };
        setUser(authUser);
        setIsLoggedIn(true);

        // Check localStorage first for instant loading
        const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
        if (cachedEnrollment) {
          try {
            setEnrollment(JSON.parse(cachedEnrollment));
            setEnrollmentState('ready');
            setAuthLoading(false);
            syncEnrollmentInBackground(authUser.id);
          } catch {
            await checkEnrollment(authUser.id);
            if (mounted) setAuthLoading(false);
          }
        } else {
          await checkEnrollment(authUser.id);
          if (mounted) setAuthLoading(false);
        }

        // Non-blocking background operations
        supabase
          .from('users')
          .select('avatar_url, display_name')
          .eq('id', authUser.id)
          .single()
          .then(({ data: userProfile }) => {
            if (mounted && userProfile) {
              setUserAvatarUrl(userProfile.avatar_url);
              setUserDisplayName(userProfile.display_name);
            }
          });

        isTeacher().then(res => {
          if (mounted) setIsUserTeacher(res);
        }).catch(() => {
          if (mounted) setIsUserTeacher(false);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        setEnrollment(null);
        setEnrollmentState('checking');
        setActiveTab('dashboard');
        setUserAvatarUrl(null);
        setUserDisplayName(null);
        setIsUserTeacher(false);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Failsafe for enrollment check - reduced to 1.5 seconds
  useEffect(() => {
    if (enrollmentState !== 'checking') return;

    const failsafe = setTimeout(() => {
      const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
      if (cachedEnrollment) {
        try {
          const parsed = JSON.parse(cachedEnrollment);
          setEnrollment(parsed);
          setEnrollmentState('ready');
          return;
        } catch {
          // Ignore parse errors
        }
      }
      setEnrollmentState('needs_program');
    }, 1500);

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

  // Background sync - updates localStorage from database without blocking UI
  const syncEnrollmentInBackground = (userId: string) => {
    getActiveEnrollment().then((dbEnrollment) => {
      if (dbEnrollment && dbEnrollment.user_id === userId) {
        setEnrollment(dbEnrollment);
        localStorage.setItem('btg_local_enrollment', JSON.stringify(dbEnrollment));
      }
    }).catch(() => {
      // Ignore background sync errors - we already have cached data
    });
  };

  // Check enrollment - localStorage FIRST for speed, then database
  const checkEnrollment = async (userId: string) => {
    // ALWAYS check localStorage first - it's instant
    const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
    if (cachedEnrollment) {
      try {
        const parsed = JSON.parse(cachedEnrollment);
        if (parsed.user_id === userId) {
          setEnrollment(parsed);
          setEnrollmentState('ready');
          // Sync with database in background
          syncEnrollmentInBackground(userId);
          return;
        }
      } catch {
        // Invalid cache, continue to database
      }
    }

    // No valid cache - try database with short timeout
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const enrollmentPromise = getActiveEnrollment();

      const existingEnrollment = await Promise.race([enrollmentPromise, timeoutPromise]);

      if (existingEnrollment) {
        setEnrollment(existingEnrollment);
        setEnrollmentState('ready');
        return;
      }

      // No enrollment found - needs auto-enrollment
      setEnrollmentState('needs_program');
    } catch (error) {
      console.error('Enrollment check failed:', error);
      setEnrollmentState('needs_program');
    }
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

  // Build nav items based on user role
  const navItems = [
    { id: 'dashboard' as const, label: t('nav.dashboard'), icon: Home },
    { id: 'courses' as const, label: t('nav.courses'), icon: GraduationCap },
    { id: 'games' as const, label: t('nav.games'), icon: Gamepad2 },
    { id: 'leaderboard' as const, label: t('nav.leaderboard'), icon: Trophy },
    { id: 'profile' as const, label: t('nav.profile'), icon: User },
    // Teacher portal tab - only shown for teachers
    ...(isUserTeacher ? [{ id: 'teacher' as const, label: t('nav.teacher'), icon: BookOpen }] : []),
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#6366F1] animate-spin" />
          <p className="text-[#9CA3AF]">{t('common.loading')}</p>
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
            <h1 className="text-xl md:text-2xl font-bold text-white capitalize">
              {activeTab === 'teacher' ? 'Teacher Portal' : activeTab === 'leaderboard' ? 'Leaderboard' : t(`nav.${activeTab}`)}
            </h1>
            <p className="text-sm md:text-base text-[#9CA3AF]">
              {activeTab === 'dashboard' && t('dashboard.welcome')}
              {activeTab === 'courses' && 'Continue your financial literacy journey.'}
              {activeTab === 'games' && 'Learn through interactive games.'}
              {activeTab === 'leaderboard' && 'See how you rank against other students.'}
              {activeTab === 'profile' && 'Manage your account and settings.'}
              {activeTab === 'teacher' && 'Manage your classes, students, and grading.'}
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

          {activeTab === 'leaderboard' && (
            <LeaderboardScreen />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              enrollment={enrollment}
              onSignOut={handleSignOut}
              onAvatarUpdate={(avatarUrl) => setUserAvatarUrl(avatarUrl)}
            />
          )}

          {activeTab === 'teacher' && isUserTeacher && (
            <TeacherPortal />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#12162F] border-t border-white/10 z-50"
        style={{ height: '64px' }}
      >
        <div className={cn(
          "grid h-full",
          navItems.length === 6 ? "grid-cols-6" : navItems.length === 5 ? "grid-cols-5" : "grid-cols-4"
        )}>
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

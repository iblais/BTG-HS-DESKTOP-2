import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type AuthUser } from '@/lib/auth';
import { type Enrollment, createEnrollment, getActiveEnrollment } from '@/lib/enrollment';
import { isTeacher } from '@/lib/teacher';
import { initDataGuard, onSyncStatusChange, type SyncHealth } from '@/lib/dataGuard';
import { LoginScreen } from '@/components/LoginScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { DashboardScreen } from '@/components/DashboardScreen';
import { CoursesScreen } from '@/components/CoursesScreen';
import { GamesScreen } from '@/components/GamesScreen';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { TeacherPortal, TeacherRegistration } from '@/components/teacher';
import { Loader2, Home, GraduationCap, Gamepad2, Trophy, User, ChevronLeft, ChevronRight, BookOpen, Wifi, WifiOff, CloudOff } from 'lucide-react';
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

  // Sync health state
  const [syncHealth, setSyncHealth] = useState<SyncHealth>('online');
  const [pendingWrites, setPendingWrites] = useState(0);

  // Initialize DataGuard
  useEffect(() => {
    const cleanup = initDataGuard();
    const unsubscribe = onSyncStatusChange((health, pending) => {
      setSyncHealth(health);
      setPendingWrites(pending);
    });
    return () => {
      cleanup();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FAST initialization - localStorage first, database in background
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
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
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          const expires_in = params.get('expires_in');
          const expires_at = params.get('expires_at');

          if (access_token && refresh_token) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) throw error;
              if (data.session) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            } catch (setSessionError) {
              console.warn('setSession failed, storing session manually:', setSessionError);
              const projRef = (import.meta.env.VITE_SUPABASE_URL || '').split('//')[1]?.split('.')[0] || 'unknown';
              const storageKey = `sb-${projRef}-auth-token`;
              const sessionData = {
                access_token,
                refresh_token,
                expires_in: Number(expires_in) || 3600,
                expires_at: Number(expires_at) || Math.floor(Date.now() / 1000) + 3600,
                token_type: 'bearer',
              };
              localStorage.setItem(storageKey, JSON.stringify(sessionData));
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }

        // STEP 2: Check auth session (with timeout so broken API doesn't block app)
        let session = null;
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result?.data?.session ?? null;
        } catch {
          console.warn('[App] getSession failed, continuing without session');
        }

        // Also check for demo user in localStorage
        if (!session && mounted) {
          const demoUser = localStorage.getItem('btg_demo_user');
          if (demoUser) {
            try {
              const parsed = JSON.parse(demoUser);
              const authUser: AuthUser = { id: parsed.id, email: parsed.email, isNewUser: false };
              setUser(authUser);
              setIsLoggedIn(true);
              setEnrollmentState('needs_program');
              setAuthLoading(false);

              isTeacher().then(res => {
                if (mounted) setIsUserTeacher(res);
              }).catch(() => {
                if (mounted) setIsUserTeacher(false);
              });
              return;
            } catch {
              // Invalid demo session
            }
          }
        }

        if (mounted && session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            isNewUser: false,
          };
          setUser(authUser);
          setIsLoggedIn(true);

          if (cachedEnrollment) {
            setAuthLoading(false);
            syncEnrollmentInBackground(authUser.id);
          } else {
            await checkEnrollment(authUser.id);
            if (mounted) setAuthLoading(false);
          }

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
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Auth init failed:', error);
        if (mounted) setAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          isNewUser: false,
        };
        setUser(authUser);
        setIsLoggedIn(true);

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

  // Failsafe for enrollment check
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

  // Auto-enroll new users
  useEffect(() => {
    if (enrollmentState !== 'needs_program' || !user) return;

    const autoEnroll = async () => {
      // For demo users, create a local-only enrollment
      if (user.id.startsWith('demo-') || user.id.startsWith('fallback-')) {
        const demoEnrollment = {
          id: `demo-enrollment-${user.id}`,
          user_id: user.id,
          program_id: 'HS',
          track_level: 'beginner',
          language: 'en',
          enrolled_at: new Date().toISOString(),
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEnrollment(demoEnrollment as Enrollment);
        localStorage.setItem('btg_local_enrollment', JSON.stringify(demoEnrollment));
        localStorage.setItem('btg-onboarding-complete', 'true');
        setEnrollmentState('ready');
        return;
      }

      try {
        const newEnrollment = await createEnrollment('HS', 'beginner', 'en');
        setEnrollment(newEnrollment);
        localStorage.setItem('btg-onboarding-complete', 'true');
        setEnrollmentState('ready');
      } catch (err) {
        console.error('Auto-enrollment failed:', err);
        setEnrollmentState('ready');
      }
    };

    autoEnroll();
  }, [enrollmentState, user]);

  const syncEnrollmentInBackground = (userId: string) => {
    getActiveEnrollment().then((dbEnrollment) => {
      if (dbEnrollment && dbEnrollment.user_id === userId) {
        setEnrollment(dbEnrollment);
        localStorage.setItem('btg_local_enrollment', JSON.stringify(dbEnrollment));
      }
    }).catch(() => {});
  };

  const checkEnrollment = async (userId: string) => {
    const cachedEnrollment = localStorage.getItem('btg_local_enrollment');
    if (cachedEnrollment) {
      try {
        const parsed = JSON.parse(cachedEnrollment);
        if (parsed.user_id === userId) {
          setEnrollment(parsed);
          setEnrollmentState('ready');
          syncEnrollmentInBackground(userId);
          return;
        }
      } catch {
        // Invalid cache, continue to database
      }
    }

    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const enrollmentPromise = getActiveEnrollment();
      const existingEnrollment = await Promise.race([enrollmentPromise, timeoutPromise]);

      if (existingEnrollment) {
        setEnrollment(existingEnrollment);
        setEnrollmentState('ready');
        return;
      }

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

  // Nav items
  const navItems = [
    { id: 'dashboard' as const, label: t('nav.dashboard'), icon: Home },
    { id: 'courses' as const, label: t('nav.courses'), icon: GraduationCap },
    { id: 'games' as const, label: t('nav.games'), icon: Gamepad2 },
    { id: 'leaderboard' as const, label: t('nav.leaderboard'), icon: Trophy },
    { id: 'profile' as const, label: t('nav.profile'), icon: User },
    { id: 'teacher' as const, label: isUserTeacher ? t('nav.teacher') : 'Teacher', icon: BookOpen },
  ];

  // Sync status display
  const getSyncIcon = () => {
    if (syncHealth === 'offline') return <WifiOff className="w-3 h-3" />;
    if (syncHealth === 'degraded' || pendingWrites > 0) return <CloudOff className="w-3 h-3" />;
    return <Wifi className="w-3 h-3" />;
  };

  const getSyncLabel = () => {
    if (syncHealth === 'offline') return 'Offline';
    if (pendingWrites > 0) return `Syncing ${pendingWrites}`;
    if (syncHealth === 'degraded') return 'Reconnecting';
    return 'Synced';
  };

  const getSyncColor = () => {
    if (syncHealth === 'offline') return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
    if (pendingWrites > 0 || syncHealth === 'degraded') return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20';
    return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20';
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--primary-500)]/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-[var(--primary-500)] animate-spin relative" />
          </div>
          <p className="text-[var(--text-tertiary)] text-sm font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = async (authUser: AuthUser) => {
    setUser(authUser);
    setIsLoggedIn(true);

    // For demo users, skip Supabase enrollment check — go straight to ready
    if (authUser.id.startsWith('demo-') || authUser.id.startsWith('fallback-')) {
      setEnrollmentState('needs_program'); // auto-enroll effect will handle it
      // Check teacher status for demo users (uses hardcoded email list)
      isTeacher().then(res => setIsUserTeacher(res)).catch(() => setIsUserTeacher(false));
      return;
    }

    try {
      await checkEnrollment(authUser.id);
    } catch {
      // If enrollment check fails, just proceed
      setEnrollmentState('needs_program');
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (enrollmentState === 'needs_program') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--primary-500)]/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-[var(--primary-500)] animate-spin relative" />
          </div>
          <p className="text-[var(--text-tertiary)] text-sm font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (enrollmentState === 'needs_onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (enrollmentState === 'checking') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--primary-500)]/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-[var(--primary-500)] animate-spin relative" />
          </div>
          <p className="text-[var(--text-tertiary)] text-sm font-medium">Checking enrollment...</p>
        </div>
      </div>
    );
  }

  if (enrollmentState === 'error') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
        <div className="frost-card p-8 text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--danger)]/15 flex items-center justify-center">
            <CloudOff className="w-6 h-6 text-[var(--danger)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Connection Error</h2>
          <p className="text-[var(--text-tertiary)] mb-6 text-sm">Failed to load your enrollment. Please try again.</p>
          <button
            onClick={() => user && checkEnrollment(user.id)}
            className="px-6 py-2.5 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-700)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-full z-50 flex-col sidebar-transition",
        )}
        style={{
          width: `${sidebarWidth}px`,
          background: 'linear-gradient(180deg, #151515 0%, #111111 50%, #0D0D0D 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.4), 1px 0 0 rgba(255, 255, 255, 0.03) inset',
        }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="Beyond The Game"
              className={cn("object-contain transition-all duration-300", sidebarCollapsed ? "h-10 w-10" : "h-14")}
            />
          </div>
        </div>

        {/* Sync Status */}
        <div className="px-3 pt-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors",
            getSyncColor(),
            sidebarCollapsed && "justify-center px-2"
          )}>
            {getSyncIcon()}
            {!sidebarCollapsed && <span className="uppercase tracking-wider">{getSyncLabel()}</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 mt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "nav-item-active text-[var(--primary-400)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)]/50 hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[var(--primary-400)]")} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="Profile"
                className="w-9 h-9 rounded-xl object-cover border border-[var(--border-default)] ring-2 ring-[var(--primary-500)]/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {(userDisplayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {userDisplayName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  High School
                </p>
              </div>
            )}
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]/50 hover:text-[var(--text-secondary)] transition-all"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-xs font-medium">Collapse</span>
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
        <div className="p-4 md:p-6 lg:p-8">
          {/* Mobile Top Bar with Logo */}
          {isMobile && (
            <div className="flex items-center justify-between mb-4 -mt-1">
              <div className="flex items-center gap-2.5">
                <img
                  src={logo}
                  alt="Beyond The Game"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0",
                getSyncColor()
              )}>
                {getSyncIcon()}
                <span className="uppercase tracking-wider">{getSyncLabel()}</span>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-6 md:mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] capitalize tracking-tight">
                {activeTab === 'teacher' ? 'Teacher Portal' : activeTab === 'leaderboard' ? 'Leaderboard' : t(`nav.${activeTab}`)}
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {activeTab === 'dashboard' && t('dashboard.welcome')}
                {activeTab === 'courses' && 'Continue your financial literacy journey.'}
                {activeTab === 'games' && 'Learn through interactive games.'}
                {activeTab === 'leaderboard' && 'See how you rank against other students.'}
                {activeTab === 'profile' && 'Manage your account and settings.'}
                {activeTab === 'teacher' && 'Manage your classes, students, and grading.'}
              </p>
            </div>
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

          {activeTab === 'teacher' && (
            isUserTeacher ? (
              <TeacherPortal />
            ) : (
              <TeacherRegistration
                onSuccess={() => {
                  setIsUserTeacher(true);
                }}
                onBack={() => setActiveTab('dashboard')}
              />
            )
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ height: '68px' }}
      >
        {/* 3D elevated background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(0deg, #0D0D0D 0%, #141414 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.5), 0 -1px 0 rgba(255, 255, 255, 0.04) inset',
          }}
        />

        <div className={cn(
          "relative grid h-full",
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
                  "relative flex flex-col items-center justify-center gap-1 transition-all duration-200",
                  isActive
                    ? "text-[var(--primary-400)]"
                    : "text-[var(--text-muted)] active:text-[var(--text-tertiary)]"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
                    isActive && "bg-[var(--primary-500)]/10"
                  )}
                  style={isActive ? {
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.15), 0 0 4px rgba(16, 185, 129, 0.1)',
                  } : undefined}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary-500)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;

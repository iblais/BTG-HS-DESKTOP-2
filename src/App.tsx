import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type AuthUser, getCurrentUser } from '@/lib/auth';
import { type Enrollment } from '@/lib/enrollment';
import { LoginScreen } from '@/components/LoginScreen';
import { ProgramSelectScreen } from '@/components/ProgramSelectScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Loader2, Home, GraduationCap, Gamepad2, User } from 'lucide-react';

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

  // Debug state
  const [errors, setErrors] = useState<string[]>([]);

  // Capture console errors on screen
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      setErrors(prev => [...prev.slice(-5), args.map(a => String(a)).join(' ')]);
      originalError(...args);
    };
    return () => { console.error = originalError; };
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
        // Skip onboarding - go straight to dashboard
        localStorage.setItem('btg-onboarding-complete', 'true');
        setEnrollmentState('ready');
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

  // Debug overlay component
  const DebugOverlay = () => (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-[10px] z-[99999] font-mono" style={{ minHeight: '80px' }}>
      <div>User: {user ? '✓ ' + user.email : '✗ NULL'}</div>
      <div>LoggedIn: {isLoggedIn ? 'TRUE' : 'FALSE'}</div>
      <div>AuthLoading: {authLoading ? 'TRUE' : 'FALSE'}</div>
      <div>EnrollState: {enrollmentState}</div>
      <div>Enrollment: {enrollment ? '✓ ' + enrollment.program_id : '✗ NULL'}</div>
      <div>Window: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</div>
      {errors.length > 0 && (
        <div className="mt-1 bg-black/50 p-1">
          <div className="text-yellow-300">ERRORS:</div>
          {errors.map((e, i) => <div key={i} className="truncate">{e}</div>)}
        </div>
      )}
    </div>
  );

  // Loading state
  if (authLoading) {
    return (
      <>
        <DebugOverlay />
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
          <div className="particle-bg" />
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
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
    return (
      <>
        <DebugOverlay />
        <div className="pt-20"><LoginScreen onLoginSuccess={handleLoginSuccess} /></div>
      </>
    );
  }

  // Program selection
  if (enrollmentState === 'needs_program') {
    return (
      <>
        <DebugOverlay />
        <div className="pt-20">
          <ProgramSelectScreen
            onEnrollmentCreated={handleEnrollmentCreated}
            userEmail={user?.email}
          />
        </div>
      </>
    );
  }

  // Onboarding
  if (enrollmentState === 'needs_onboarding') {
    return (
      <>
        <DebugOverlay />
        <div className="pt-20"><OnboardingScreen onComplete={handleOnboardingComplete} /></div>
      </>
    );
  }

  // Checking enrollment state
  if (enrollmentState === 'checking') {
    return (
      <>
        <DebugOverlay />
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
          <div className="particle-bg" />
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Checking enrollment...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (enrollmentState === 'error') {
    return (
      <>
        <DebugOverlay />
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
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
      </>
    );
  }

  // Main app - FIXED LAYOUT FOR MOBILE
  return (
    <>
      {/* Debug overlay - RED - 48px height */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        backgroundColor: '#DC2626',
        color: 'white',
        padding: '4px 8px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 99999,
        lineHeight: 1.3,
        overflow: 'hidden',
      }}>
        <div>User: {user ? '✓ ' + user.email : '✗ NULL'}</div>
        <div>Enrollment: {enrollment ? '✓ ' + enrollment.program_id : '✗ NULL'}</div>
        <div>Tab: {activeTab} | {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</div>
      </div>

      {/* Main content area - FIXED positioning between header and nav */}
      <div style={{
        position: 'fixed',
        top: '48px',
        left: 0,
        right: 0,
        bottom: '64px',
        backgroundColor: '#0A0E27',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Content wrapper with padding */}
        <div style={{ padding: '16px', paddingBottom: '32px' }}>
          {/* Page Header */}
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'capitalize' }}>
            {activeTab}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '20px' }}>
            {activeTab === 'dashboard' && 'Welcome back! Here\'s your progress.'}
            {activeTab === 'courses' && 'Continue your financial literacy journey.'}
            {activeTab === 'games' && 'Learn through interactive games.'}
            {activeTab === 'profile' && 'Manage your account and settings.'}
          </p>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Welcome card */}
              <div style={{
                backgroundColor: '#12162F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <p style={{ color: '#E5E7EB', fontSize: '14px' }}>
                  Welcome back, {user?.email}!
                </p>
                <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '8px' }}>
                  Program: {enrollment?.program_id === 'HS' ? 'High School' : 'College'}
                </p>
              </div>

              {/* Stats grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{
                  backgroundColor: '#12162F',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ color: '#6366F1', fontSize: '24px', fontWeight: 'bold' }}>0</div>
                  <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Total XP</div>
                </div>
                <div style={{
                  backgroundColor: '#12162F',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ color: '#F59E0B', fontSize: '24px', fontWeight: 'bold' }}>1</div>
                  <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Level</div>
                </div>
                <div style={{
                  backgroundColor: '#12162F',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ color: '#10B981', fontSize: '24px', fontWeight: 'bold' }}>0</div>
                  <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Day Streak</div>
                </div>
                <div style={{
                  backgroundColor: '#12162F',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ color: '#EC4899', fontSize: '24px', fontWeight: 'bold' }}>0/12</div>
                  <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Weeks Done</div>
                </div>
              </div>

              {/* Success message */}
              <div style={{
                backgroundColor: '#065F46',
                border: '1px solid #10B981',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{ color: '#A7F3D0', fontSize: '14px', fontWeight: '500' }}>
                  Content is rendering correctly!
                </p>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <div style={{
                backgroundColor: '#12162F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
              }}>
                <div style={{ color: '#6366F1', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Week 1</div>
                <div style={{ color: '#E5E7EB', fontSize: '16px', fontWeight: '500' }}>Introduction to Financial Literacy</div>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>0% Complete</div>
              </div>
              <div style={{
                backgroundColor: '#12162F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                opacity: 0.6,
              }}>
                <div style={{ color: '#6366F1', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Week 2</div>
                <div style={{ color: '#E5E7EB', fontSize: '16px', fontWeight: '500' }}>Budgeting Basics</div>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Locked</div>
              </div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div>
              <div style={{
                backgroundColor: '#12162F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
              }}>
                <div style={{ color: '#F59E0B', fontSize: '24px', marginBottom: '8px' }}>🎮</div>
                <div style={{ color: '#E5E7EB', fontSize: '16px', fontWeight: '500' }}>Budget Builder</div>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Practice budgeting skills</div>
              </div>
              <div style={{
                backgroundColor: '#12162F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
              }}>
                <div style={{ color: '#10B981', fontSize: '24px', marginBottom: '8px' }}>📈</div>
                <div style={{ color: '#E5E7EB', fontSize: '16px', fontWeight: '500' }}>Stock Simulator</div>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Learn investing basics</div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div style={{
                backgroundColor: '#12162F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{ color: '#E5E7EB', fontSize: '16px', fontWeight: '500' }}>{user?.email}</div>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>
                  {enrollment?.program_id === 'HS' ? 'High School Program' : 'College Program'}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav - 64px height */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#12162F',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        zIndex: 99998,
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: isActive ? '#6366F1' : '#6B7280',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '500',
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default App;

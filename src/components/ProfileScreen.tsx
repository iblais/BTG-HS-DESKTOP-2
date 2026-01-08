import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { type Enrollment, resetEnrollment } from '@/lib/enrollment';
import {
  Mail, Calendar, Trophy, Star, Flame, BookOpen,
  LogOut, ChevronRight, Edit2, Shield, Bell,
  Download, Trash2, Loader2, Check, Settings, Camera, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountSettingsScreen } from './AccountSettingsScreen';

interface ProfileScreenProps {
  enrollment: Enrollment | null;
  onSignOut: () => void;
  onAvatarUpdate?: (avatarUrl: string | null) => void;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
  created_at: string;
}

export function ProfileScreen({ enrollment, onSignOut, onAvatarUpdate }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: displayName || null })
        .eq('id', profile.id);

      if (!error) {
        setProfile({ ...profile, display_name: displayName || null });
        setEditing(false);
      }
    } catch (err) {
      console.error('Failed to save display name:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const handleProfileUpdate = (updates: { displayName?: string; avatarUrl?: string | null }) => {
    if (!profile) return;

    const newProfile = { ...profile };
    if (updates.displayName !== undefined) {
      newProfile.display_name = updates.displayName;
      setDisplayName(updates.displayName);
    }
    if (updates.avatarUrl !== undefined) {
      newProfile.avatar_url = updates.avatarUrl;
      onAvatarUpdate?.(updates.avatarUrl);
    }
    setProfile(newProfile);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show Account Settings Screen
  if (showAccountSettings && profile) {
    return (
      <AccountSettingsScreen
        onBack={() => setShowAccountSettings(false)}
        userId={profile.id}
        initialDisplayName={profile.display_name || ''}
        initialEmail={profile.email}
        initialAvatarUrl={profile.avatar_url}
        onProfileUpdate={handleProfileUpdate}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total XP', value: profile?.xp?.toLocaleString() || '0', icon: Star, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/20' },
    { label: 'Level', value: profile?.level || 1, icon: Trophy, color: 'text-[#4A5FFF]', bg: 'bg-[#4A5FFF]/20' },
    { label: 'Day Streak', value: profile?.streak_days || 0, icon: Flame, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/20' },
    { label: 'Courses', value: 0, icon: BookOpen, color: 'text-[#50D890]', bg: 'bg-[#50D890]/20' },
  ];

  const settingsSections: Array<{
    title: string;
    items: Array<{
      icon: typeof Settings;
      label: string;
      description: string;
      action?: () => void;
      danger?: boolean;
    }>;
  }> = [
    {
      title: 'Account',
      items: [
        { icon: Settings, label: 'Account Settings', description: 'Profile, password, and security', action: () => setShowAccountSettings(true) },
        { icon: Bell, label: 'Notifications', description: 'Manage notification preferences', action: () => alert('Notification settings coming soon!') },
        { icon: Shield, label: 'Privacy & Security', description: 'Password and security settings', action: () => setShowAccountSettings(true) },
      ]
    },
    {
      title: 'Data',
      items: [
        { icon: Download, label: 'Download Data', description: 'Export your progress and data', action: () => alert('Data export coming soon! You\'ll be able to download all your progress.') },
        { icon: Trash2, label: 'Clear Cache', description: 'Clear offline data cache', danger: true, action: () => {
          if (confirm('Clear all cached data? This will not affect your saved progress.')) {
            localStorage.removeItem('btg_quiz_attempts');
            localStorage.removeItem('btg_current_quiz_attempt');
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
              });
            }
            alert('Cache cleared successfully!');
          }
        } },
        {
          icon: RotateCcw,
          label: 'Reset Onboarding',
          description: 'Start fresh with program selection',
          danger: true,
          action: async () => {
            if (confirm('This will reset your program selection and start you over. Your progress data will be kept. Continue?')) {
              await resetEnrollment(false);
              window.location.reload();
            }
          }
        },
      ]
    }
  ];

  // Get display initial for avatar fallback
  const displayInitial = (profile?.display_name || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="w-full space-y-8 pb-6 md:pb-0">
      {/* Profile Header */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Edit Overlay */}
          <div
            onClick={() => setShowAccountSettings(true)}
            className="relative group cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowAccountSettings(true)}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10 group-hover:border-[#4A5FFF]/50 transition-colors"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8E53] flex items-center justify-center group-hover:opacity-90 transition-opacity">
                <span className="text-white font-bold text-3xl">
                  {displayInitial}
                </span>
              </div>
            )}
            {/* Camera overlay on hover */}
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="w-8 h-8 text-white" />
            </div>
            {/* Edit badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#4A5FFF] flex items-center justify-center border-2 border-[#0A0E27]">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            {/* Level badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center border-2 border-[#0A0E27]">
              <span className="text-white text-[10px] font-bold">{profile?.level || 1}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={saving}
                    className="p-2 rounded-lg bg-[#50D890]/20 text-[#50D890] hover:bg-[#50D890]/30 transition-colors"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDisplayName(profile?.display_name || '');
                    }}
                    className="p-2 rounded-lg bg-white/[0.05] text-white/60 hover:bg-white/[0.1] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">
                    {profile?.display_name || profile?.email?.split('@')[0] || 'User'}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.1] transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-white/60 mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{profile?.email}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {enrollment?.program_id === 'HS' ? 'High School Program' : 'College Program'}
              </span>
            </div>

            {/* Edit Profile Button - Always visible */}
            <button
              onClick={() => setShowAccountSettings(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#4A5FFF] hover:bg-[#3A4FEF] rounded-xl text-white font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", stat.bg)}>
                <Icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Enrollment Details */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Program Details</h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-white/40 text-sm mb-1">Program</p>
            <p className="text-white font-medium">
              {enrollment?.program_id === 'HS' ? 'High School (18 weeks)' : 'College (16 weeks)'}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-sm mb-1">Difficulty Level</p>
            <p className="text-white font-medium capitalize">{enrollment?.track_level || 'Beginner'}</p>
          </div>
          <div>
            <p className="text-white/40 text-sm mb-1">Language</p>
            <p className="text-white font-medium">
              {enrollment?.language === 'es' ? 'Español' : 'English'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      {settingsSections.map((section) => (
        <div key={section.title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <h3 className="text-lg font-bold text-white px-6 pt-6 pb-4">{section.title}</h3>

          <div className="divide-y divide-white/[0.06]">
            {section.items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    item.danger ? "bg-red-500/20" : "bg-white/[0.05]"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      item.danger ? "text-red-400" : "text-white/60"
                    )} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn(
                      "font-medium",
                      item.danger ? "text-red-400" : "text-white"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-white/40 text-sm">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Sign Out */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-500/10 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-red-400">Sign Out</p>
            <p className="text-white/40 text-sm">Sign out of your account</p>
          </div>
        </button>
      </div>

      {/* App Version */}
      <div className="text-center pb-8">
        <p className="text-white/30 text-sm">Beyond The Game Desktop v1.0.0</p>
        <p className="text-white/20 text-xs mt-1">Made with love for financial literacy</p>
      </div>
    </div>
  );
}

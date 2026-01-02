import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { type Enrollment } from '@/lib/enrollment';
import {
  Mail, Calendar, Trophy, Star, Flame, BookOpen,
  LogOut, ChevronRight, Edit2, Shield, Bell,
  Download, Trash2, Loader2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileScreenProps {
  enrollment: Enrollment | null;
  onSignOut: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  xp: number;
  level: number;
  streak_days: number;
  created_at: string;
}

export function ProfileScreen({ enrollment, onSignOut }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Manage notification preferences' },
        { icon: Shield, label: 'Privacy & Security', description: 'Password and security settings' },
      ]
    },
    {
      title: 'Data',
      items: [
        { icon: Download, label: 'Download Data', description: 'Export your progress and data' },
        { icon: Trash2, label: 'Clear Cache', description: 'Clear offline data cache', danger: true },
      ]
    }
  ];

  return (
    <div className="w-full space-y-8">
      {/* Profile Header */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8E53] flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {(profile?.display_name || profile?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center border-2 border-[#0A0E27]">
              <span className="text-white text-xs font-bold">{profile?.level || 1}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
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

            <div className="flex items-center gap-2 text-white/60 mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{profile?.email}</span>
            </div>

            <div className="flex items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {enrollment?.program_id === 'HS' ? 'High School Program' : 'College Program'}
              </span>
            </div>
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

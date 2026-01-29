import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Trophy, Medal, Crown, Flame, Star, ChevronUp, ChevronDown, Minus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
  streak_days: number;
  weeks_completed: number;
  rank: number;
  rank_change: number; // positive = moved up, negative = moved down, 0 = no change
}

type TimeFilter = 'all_time' | 'this_week' | 'this_month';

export function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all_time');

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch users with their XP from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, total_xp, current_level')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        // Try loading from users table as fallback
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, display_name, avatar_url, xp, level, streak_days')
          .order('xp', { ascending: false })
          .limit(100);

        if (usersError) {
          console.error('Error loading users:', usersError);
          setLoading(false);
          return;
        }

        if (users) {
          const entries: LeaderboardEntry[] = users.map((u, index) => ({
            id: u.id,
            display_name: u.display_name,
            email: u.email,
            avatar_url: u.avatar_url,
            total_xp: u.xp || 0,
            current_level: u.level || 1,
            streak_days: u.streak_days || 0,
            weeks_completed: 0,
            rank: index + 1,
            rank_change: 0,
          }));

          setLeaderboard(entries);

          if (user) {
            const userRank = entries.findIndex(e => e.id === user.id);
            if (userRank !== -1) {
              setCurrentUserRank(userRank + 1);
            }
          }
        }
        setLoading(false);
        return;
      }

      // Fetch user details for each profile
      const userIds = profiles?.map(p => p.id) || [];

      const { data: users } = await supabase
        .from('users')
        .select('id, email, display_name, avatar_url, streak_days')
        .in('id', userIds);

      // Fetch weeks completed for each user
      const { data: progressData } = await supabase
        .from('course_progress')
        .select('user_id, week_number, completed')
        .in('user_id', userIds)
        .eq('completed', true);

      // Count weeks completed per user
      const weeksCompletedMap: Record<string, number> = {};
      progressData?.forEach(p => {
        weeksCompletedMap[p.user_id] = (weeksCompletedMap[p.user_id] || 0) + 1;
      });

      // Create user lookup map
      const userMap: Record<string, { id: string; email: string; display_name: string | null; avatar_url: string | null; streak_days: number }> = {};
      users?.forEach(u => {
        userMap[u.id] = u;
      });

      // Build leaderboard entries
      const entries: LeaderboardEntry[] = (profiles || []).map((p, index) => {
        const userData = userMap[p.id];
        return {
          id: p.id,
          display_name: userData?.display_name || null,
          email: userData?.email || 'Unknown',
          avatar_url: userData?.avatar_url || null,
          total_xp: p.total_xp || 0,
          current_level: p.current_level || 1,
          streak_days: userData?.streak_days || 0,
          weeks_completed: weeksCompletedMap[p.id] || 0,
          rank: index + 1,
          rank_change: Math.floor(Math.random() * 5) - 2, // Simulated rank change for now
        };
      });

      setLeaderboard(entries);

      // Find current user's rank
      if (user) {
        const userRank = entries.findIndex(e => e.id === user.id);
        if (userRank !== -1) {
          setCurrentUserRank(userRank + 1);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.display_name) return entry.display_name;
    if (entry.email) return entry.email.split('@')[0];
    return 'Anonymous';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-white/60 font-bold text-lg">{rank}</span>;
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/30" />;
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-6 md:pb-0">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Your Rank Card */}
        <div className="bg-gradient-to-br from-[#4A5FFF] to-[#00BFFF] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Your Rank</p>
              <p className="text-4xl font-black mt-1">
                {currentUserRank ? `#${currentUserRank}` : '--'}
              </p>
            </div>
            <Trophy className="w-12 h-12 text-white/30" />
          </div>
        </div>

        {/* Total Players Card */}
        <div className="bg-[#12162F] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Players</p>
              <p className="text-4xl font-black text-white mt-1">{leaderboard.length}</p>
            </div>
            <Star className="w-12 h-12 text-yellow-400/30" />
          </div>
        </div>

        {/* Top Score Card */}
        <div className="bg-[#12162F] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Top Score</p>
              <p className="text-4xl font-black text-white mt-1">
                {leaderboard[0]?.total_xp.toLocaleString() || '0'} XP
              </p>
            </div>
            <Flame className="w-12 h-12 text-orange-400/30" />
          </div>
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex gap-2">
        {[
          { id: 'all_time', label: 'All Time' },
          { id: 'this_month', label: 'This Month' },
          { id: 'this_week', label: 'This Week' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id as TimeFilter)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              timeFilter === filter.id
                ? "bg-[#4A5FFF] text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-8">
            <div className="relative">
              {leaderboard[1].avatar_url ? (
                <img
                  src={leaderboard[1].avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full border-4 border-gray-300"
                />
              ) : (
                <div className={cn(
                  "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center border-4 border-gray-300",
                  getAvatarColor(leaderboard[1].id)
                )}>
                  <span className="text-white font-bold text-xl">
                    {getDisplayName(leaderboard[1]).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-800 font-bold text-sm">
                2
              </div>
            </div>
            <p className="text-white font-semibold mt-3 text-sm truncate max-w-[100px]">
              {getDisplayName(leaderboard[1])}
            </p>
            <p className="text-[#4A5FFF] font-bold">{leaderboard[1].total_xp.toLocaleString()} XP</p>
            <div className="w-full h-20 bg-gray-300/20 rounded-t-lg mt-2" />
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <Crown className="w-8 h-8 text-yellow-400 mb-2" />
            <div className="relative">
              {leaderboard[0].avatar_url ? (
                <img
                  src={leaderboard[0].avatar_url}
                  alt=""
                  className="w-20 h-20 rounded-full border-4 border-yellow-400"
                />
              ) : (
                <div className={cn(
                  "w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center border-4 border-yellow-400",
                  getAvatarColor(leaderboard[0].id)
                )}>
                  <span className="text-white font-bold text-2xl">
                    {getDisplayName(leaderboard[0]).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-sm">
                1
              </div>
            </div>
            <p className="text-white font-semibold mt-3 truncate max-w-[120px]">
              {getDisplayName(leaderboard[0])}
            </p>
            <p className="text-yellow-400 font-bold">{leaderboard[0].total_xp.toLocaleString()} XP</p>
            <div className="w-full h-28 bg-yellow-400/20 rounded-t-lg mt-2" />
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="relative">
              {leaderboard[2].avatar_url ? (
                <img
                  src={leaderboard[2].avatar_url}
                  alt=""
                  className="w-14 h-14 rounded-full border-4 border-amber-600"
                />
              ) : (
                <div className={cn(
                  "w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center border-4 border-amber-600",
                  getAvatarColor(leaderboard[2].id)
                )}>
                  <span className="text-white font-bold text-lg">
                    {getDisplayName(leaderboard[2]).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
            </div>
            <p className="text-white font-semibold mt-3 text-sm truncate max-w-[100px]">
              {getDisplayName(leaderboard[2])}
            </p>
            <p className="text-amber-400 font-bold text-sm">{leaderboard[2].total_xp.toLocaleString()} XP</p>
            <div className="w-full h-16 bg-amber-600/20 rounded-t-lg mt-2" />
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="bg-[#12162F] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-semibold">Rankings</h3>
        </div>

        <div className="divide-y divide-white/5">
          {leaderboard.slice(3).map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-4 p-4 transition-colors",
                entry.id === currentUserId ? "bg-[#4A5FFF]/10" : "hover:bg-white/5"
              )}
            >
              {/* Rank */}
              <div className="w-10 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Rank Change */}
              <div className="w-6">
                {getRankChangeIcon(entry.rank_change)}
              </div>

              {/* Avatar */}
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center",
                  getAvatarColor(entry.id)
                )}>
                  <span className="text-white font-bold">
                    {getDisplayName(entry).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Name & Level */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold truncate",
                  entry.id === currentUserId ? "text-[#4A5FFF]" : "text-white"
                )}>
                  {getDisplayName(entry)}
                  {entry.id === currentUserId && (
                    <span className="ml-2 text-xs bg-[#4A5FFF] px-2 py-0.5 rounded-full">You</span>
                  )}
                </p>
                <p className="text-white/50 text-sm">Level {entry.current_level}</p>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="text-white font-bold">{entry.total_xp.toLocaleString()} XP</p>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  {entry.streak_days > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      {entry.streak_days}
                    </span>
                  )}
                  <span>{entry.weeks_completed} weeks</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="p-8 text-center text-white/50">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No players yet. Be the first to earn XP!</p>
          </div>
        )}
      </div>
    </div>
  );
}

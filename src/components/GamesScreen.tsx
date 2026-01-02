import { useState } from 'react';
import {
  Gamepad2, TrendingUp, PiggyBank, CreditCard, Briefcase,
  Trophy, Star, Play, Lock, Clock, Zap, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: typeof Gamepad2;
  color: string;
  gradient: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  highScore: number | null;
  plays: number;
  locked: boolean;
  category: string;
  image?: string; // Optional - will use gradient placeholder if not provided
}

export function GamesScreen() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games: Game[] = [
    {
      id: 'budget-builder',
      name: 'Budget Builder',
      description: 'Create and manage a virtual budget. Make decisions on income allocation and see the impact of your choices.',
      icon: PiggyBank,
      color: 'text-[#50D890]',
      gradient: 'from-[#50D890] to-[#4ECDC4]',
      duration: '10-15 min',
      difficulty: 'Easy',
      highScore: null,
      plays: 0,
      locked: false,
      category: 'Budgeting'
    },
    {
      id: 'needs-vs-wants',
      name: 'Needs vs Wants',
      description: 'Quick-fire challenge to categorize expenses. Learn to distinguish between necessities and luxuries.',
      icon: CreditCard,
      color: 'text-[#FF6B35]',
      gradient: 'from-[#FF6B35] to-[#FF8E53]',
      duration: '5-10 min',
      difficulty: 'Easy',
      highScore: null,
      plays: 0,
      locked: false,
      category: 'Spending'
    },
    {
      id: 'stock-simulator',
      name: 'Stock Market Simulator',
      description: 'Experience the excitement of the stock market. Buy, sell, and track virtual stocks in real-time.',
      icon: TrendingUp,
      color: 'text-[#4A5FFF]',
      gradient: 'from-[#4A5FFF] to-[#00BFFF]',
      duration: '15-20 min',
      difficulty: 'Medium',
      highScore: null,
      plays: 0,
      locked: false,
      category: 'Investing'
    },
    {
      id: 'banking-flashcards',
      name: 'Banking Terms',
      description: 'Master essential banking terminology with interactive flashcards and quizzes.',
      icon: Briefcase,
      color: 'text-[#9D4EDD]',
      gradient: 'from-[#9D4EDD] to-[#C77DFF]',
      duration: '5-10 min',
      difficulty: 'Easy',
      highScore: null,
      plays: 0,
      locked: false,
      category: 'Knowledge'
    },
    {
      id: 'road-to-legacy',
      name: 'Road to Legacy',
      description: 'Build generational wealth in this strategy game. Make life decisions that impact your financial future.',
      icon: Trophy,
      color: 'text-[#FFD700]',
      gradient: 'from-[#FFD700] to-[#FFA500]',
      duration: '20-30 min',
      difficulty: 'Hard',
      highScore: null,
      plays: 0,
      locked: true,
      category: 'Strategy'
    },
  ];

  const categories = [...new Set(games.map(g => g.category))];

  return (
    <div className="w-full space-y-8">
      {/* Header Stats - EXCITING VERSION */}
      <div className="grid grid-cols-3 gap-5">
        <div className="stat-glow bg-[var(--bg-elevated)] border border-[var(--primary-500)]/20 rounded-xl p-6 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--primary-500)]/30">
            <Gamepad2 className="w-7 h-7 text-white float-icon" />
          </div>
          <p className="text-[40px] font-black gradient-text-primary leading-none">{games.filter(g => !g.locked).length}</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2 uppercase tracking-wider font-semibold">Games Ready</p>
        </div>

        <div className="stat-glow fire-glow bg-[var(--bg-elevated)] border border-[var(--secondary-500)]/20 rounded-xl p-6 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--secondary-400)] to-[#F97316] flex items-center justify-center mb-4 shadow-lg shadow-[var(--secondary-500)]/30">
            <Trophy className="w-7 h-7 text-white float-icon" />
          </div>
          <p className="text-[40px] font-black gradient-text-fire leading-none">0</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2 uppercase tracking-wider font-semibold">High Scores</p>
        </div>

        <div className="stat-glow success-glow bg-[var(--bg-elevated)] border border-[var(--success)]/20 rounded-xl p-6 cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--success)] to-[var(--success-dark)] flex items-center justify-center mb-4 shadow-lg shadow-[var(--success)]/30">
            <Target className="w-7 h-7 text-white float-icon" />
          </div>
          <p className="text-[40px] font-black gradient-text-success leading-none">0</p>
          <p className="text-[var(--text-tertiary)] text-sm mt-2 uppercase tracking-wider font-semibold">Total XP</p>
        </div>
      </div>

      {/* Featured Game - HERO VERSION WITH IMAGE */}
      <div className="hero-card rounded-2xl overflow-hidden">
        {/* Featured Game Image / Placeholder - Full Width on Top */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)]">
          {/* Placeholder with animated icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <TrendingUp className="w-24 h-24 text-white/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-16 h-16 text-white float-icon" />
              </div>
            </div>
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
          {/* Featured badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--secondary-400)] to-[var(--secondary-500)] text-black text-xs font-bold uppercase tracking-wider shadow-lg">
              <Star className="w-3 h-3" />
              Featured
            </span>
          </div>
          {/* Difficulty badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full bg-[var(--secondary-500)]/90 text-white text-xs font-bold backdrop-blur-sm">
              Medium
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 relative">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-[var(--primary-500)]/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[var(--success)] text-sm font-semibold uppercase tracking-wider">Ready to Play</span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">Stock Market Simulator</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Put your investing knowledge to the test! Trade virtual stocks with real market dynamics.
            </p>

            <div className="flex items-center gap-6 mb-5">
              <span className="flex items-center gap-2 text-[var(--text-tertiary)]">
                <Clock className="w-4 h-4" />
                15-20 min
              </span>
              <span className="flex items-center gap-2 text-[var(--secondary-500)] font-bold">
                <Zap className="w-4 h-4" />
                +500 XP
              </span>
            </div>

            <button
              onClick={() => setSelectedGame('stock-simulator')}
              className="cta-pulse inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white font-bold hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--primary-500)]/40 transition-all duration-200"
            >
              <Play className="w-5 h-5" />
              Play Now
            </button>
          </div>
        </div>
      </div>

      {/* Games by Category - EXCITING VERSION */}
      {categories.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-xl font-black text-white">{category}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--border-default)] to-transparent" />
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {games
              .filter(game => game.category === category)
              .map((game) => {
                const Icon = game.icon;
                return (
                  <div
                    key={game.id}
                    onClick={() => !game.locked && setSelectedGame(game.id)}
                    className={cn(
                      "course-card-lift rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group",
                      game.locked
                        ? "bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] opacity-60"
                        : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-white/20"
                    )}
                  >
                    {/* Game Image / Placeholder */}
                    <div className={cn(
                      "relative h-36 overflow-hidden",
                      !game.image && `bg-gradient-to-br ${game.gradient}`
                    )}>
                      {game.image ? (
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        /* Gradient Placeholder with Icon */
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <Icon className="w-16 h-16 text-white/30" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Icon className="w-12 h-12 text-white float-icon" />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />

                      {/* Game Icon Badge */}
                      <div className="absolute top-3 left-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm",
                          game.locked ? "bg-black/50" : "bg-white/20"
                        )}>
                          {game.locked ? (
                            <Lock className="w-5 h-5 text-white/60" />
                          ) : (
                            <Icon className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm",
                          game.difficulty === 'Easy' ? "bg-[var(--success)]/90 text-white" :
                          game.difficulty === 'Medium' ? "bg-[var(--secondary-500)]/90 text-white" :
                          "bg-[var(--danger)]/90 text-white"
                        )}>
                          {game.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h4 className={cn(
                        "font-bold text-lg mb-2 transition-colors",
                        game.locked ? "text-[var(--text-muted)]" : "text-white group-hover:text-[var(--primary-500)]"
                      )}>
                        {game.name}
                      </h4>
                      <p className={cn(
                        "text-sm mb-4 line-clamp-2",
                        game.locked ? "text-[var(--text-muted)]" : "text-[var(--text-tertiary)]"
                      )}>
                        {game.description}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {game.duration}
                          </span>
                        </div>
                        {game.highScore !== null ? (
                          <span className="flex items-center gap-1 text-[var(--secondary-500)] font-bold">
                            <Trophy className="w-3.5 h-3.5" />
                            {game.highScore.toLocaleString()}
                          </span>
                        ) : !game.locked && (
                          <span className="flex items-center gap-1 text-[var(--secondary-500)] font-bold">
                            <Zap className="w-3.5 h-3.5" />
                            +200 XP
                          </span>
                        )}
                      </div>

                      {game.locked && (
                        <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mt-4 pt-4 border-t border-[var(--border-subtle)]">
                          <Lock className="w-3.5 h-3.5" />
                          Complete Week 8 to unlock
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {/* Game Launch Modal */}
      {selectedGame && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedGame(null)}
        >
          <div
            className="bg-[#0A0E27] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const game = games.find(g => g.id === selectedGame)!;
              const Icon = game.icon;
              return (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br",
                      game.gradient
                    )}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{game.name}</h3>
                      <p className="text-white/60">{game.category}</p>
                    </div>
                  </div>

                  <p className="text-white/70 mb-6">{game.description}</p>

                  <div className="flex items-center gap-6 mb-6 py-4 border-y border-white/[0.06]">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Duration</p>
                      <p className="text-white font-medium">{game.duration}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Difficulty</p>
                      <p className={cn(
                        "font-medium",
                        game.difficulty === 'Easy' ? "text-[#50D890]" :
                        game.difficulty === 'Medium' ? "text-[#FF6B35]" :
                        "text-[#FF4757]"
                      )}>
                        {game.difficulty}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">High Score</p>
                      <p className="text-[#FFD700] font-medium">
                        {game.highScore?.toLocaleString() || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/[0.1] text-white hover:bg-white/[0.05] transition-colors"
                    >
                      Cancel
                    </button>
                    <button className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity bg-gradient-to-r",
                      game.gradient
                    )}>
                      <Play className="w-5 h-5" />
                      Start Game
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

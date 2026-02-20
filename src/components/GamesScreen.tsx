import { useState } from 'react';
import {
  Gamepad2, TrendingUp, PiggyBank, CreditCard, Briefcase,
  Trophy, Star, Play, Lock, Clock, Zap, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { BudgetBuilderGame } from './BudgetBuilderGame';
import { NeedsVsWantsChallenge } from './NeedsVsWantsChallenge';
import { BitcoinTradingSimulator } from './BitcoinTradingSimulator';
import BankingTermsFlashCards from './BankingTermsFlashCards';
import { RoadToLegacyGame } from './RoadToLegacyGame';

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
  const [activeGame, setActiveGame] = useState<string | null>(null);

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
      id: 'bitcoin-simulator',
      name: 'Bitcoin Trading Simulator',
      description: 'Trade Bitcoin with real-time market data! Practice buying and selling with a $10,000 virtual portfolio.',
      icon: TrendingUp,
      color: 'text-[#FFD700]',
      gradient: 'from-[#FFD700] to-[#FF6B35]',
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
      locked: false,
      category: 'Strategy'
    },
  ];

  const categories = [...new Set(games.map(g => g.category))];

  // Save game score to database
  const saveGameScore = async (gameType: string, score: number, completed: boolean = true, sessionData?: unknown) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          game_type: gameType,
          score: score,
          completed: completed,
          session_data: sessionData || null
        });

    } catch (err) {
      console.error('Failed to save game score:', err);
    }
  };

  // Handle back from game with optional score saving
  const handleGameBack = (gameType?: string, score?: number, sessionData?: unknown) => {
    if (gameType && score !== undefined) {
      saveGameScore(gameType, score, true, sessionData);
    }
    setActiveGame(null);
  };

  // Render active game
  if (activeGame) {
    switch (activeGame) {
      case 'budget-builder':
        return <BudgetBuilderGame
          onBack={() => handleGameBack()}
          onSaveProgress={(progress) => saveGameScore('budget-builder', progress.score || 0, true, progress)}
        />;
      case 'needs-vs-wants':
        return <NeedsVsWantsChallenge
          onBack={() => handleGameBack()}
          onSaveProgress={(progress) => saveGameScore('needs-vs-wants', typeof progress === 'object' && progress !== null && 'score' in progress ? (progress as { score?: number }).score || 0 : 0, true, progress)}
        />;
      case 'bitcoin-simulator':
        return <BitcoinTradingSimulator
          onBack={() => handleGameBack()}
          onSaveProgress={(progress: { totalProfit?: number }) => saveGameScore('bitcoin-simulator', progress?.totalProfit || 0, true, progress)}
        />;
      case 'banking-flashcards':
        return <BankingTermsFlashCards
          onBack={() => handleGameBack()}
          onSaveProgress={(progress: { score?: number }) => saveGameScore('banking-flashcards', progress?.score || 0, true, progress)}
        />;
      case 'road-to-legacy':
        return <RoadToLegacyGame
          onBack={() => handleGameBack()}
          onSaveProgress={(progress) => saveGameScore('road-to-legacy', progress.playerStats?.money || 0, true, progress)}
        />;
      default:
        setActiveGame(null);
    }
  }

  return (
    <div className="w-full space-y-4 md:space-y-8 pb-6 md:pb-0">
      {/* Header Stats - EXCITING VERSION */}
      <div className="grid grid-cols-3 gap-2 md:gap-5">
        <div className="stat-glow bg-[var(--bg-elevated)] border border-[var(--primary-500)]/20 rounded-xl p-3 md:p-6 cursor-pointer">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center mb-2 md:mb-4 shadow-lg shadow-[var(--primary-500)]/30">
            <Gamepad2 className="w-5 h-5 md:w-7 md:h-7 text-white float-icon" />
          </div>
          <p className="text-2xl md:text-[40px] font-black gradient-text-primary leading-none">{games.filter(g => !g.locked).length}</p>
          <p className="text-[var(--text-tertiary)] text-[10px] md:text-sm mt-1 md:mt-2 uppercase tracking-wider font-semibold">Games</p>
        </div>

        <div className="stat-glow fire-glow bg-[var(--bg-elevated)] border border-[var(--secondary-500)]/20 rounded-xl p-3 md:p-6 cursor-pointer">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[var(--secondary-400)] to-[#F97316] flex items-center justify-center mb-2 md:mb-4 shadow-lg shadow-[var(--secondary-500)]/30">
            <Trophy className="w-5 h-5 md:w-7 md:h-7 text-white float-icon" />
          </div>
          <p className="text-2xl md:text-[40px] font-black gradient-text-fire leading-none">0</p>
          <p className="text-[var(--text-tertiary)] text-[10px] md:text-sm mt-1 md:mt-2 uppercase tracking-wider font-semibold">Scores</p>
        </div>

        <div className="stat-glow success-glow bg-[var(--bg-elevated)] border border-[var(--success)]/20 rounded-xl p-3 md:p-6 cursor-pointer">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[var(--success)] to-[var(--success-dark)] flex items-center justify-center mb-2 md:mb-4 shadow-lg shadow-[var(--success)]/30">
            <Target className="w-5 h-5 md:w-7 md:h-7 text-white float-icon" />
          </div>
          <p className="text-2xl md:text-[40px] font-black gradient-text-success leading-none">0</p>
          <p className="text-[var(--text-tertiary)] text-[10px] md:text-sm mt-1 md:mt-2 uppercase tracking-wider font-semibold">XP</p>
        </div>
      </div>

      {/* Featured Game - HERO VERSION WITH IMAGE */}
      <div className="hero-card rounded-xl md:rounded-2xl overflow-hidden">
        {/* Featured Game Image / Placeholder - Full Width on Top */}
        <div className="relative h-32 md:h-44 overflow-hidden bg-gradient-to-br from-[#FFD700] to-[#FF6B35]">
          {/* Placeholder with animated icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <span className="text-[80px] md:text-[120px] text-white/20">₿</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[50px] md:text-[80px] text-white float-icon">₿</span>
              </div>
            </div>
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
          {/* Featured badge */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4">
            <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FF6B35] text-black text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
              <Star className="w-2.5 h-2.5 md:w-3 md:h-3" />
              Featured
            </span>
          </div>
          {/* Live Data badge */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4">
            <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-[#50D890]/90 text-white text-[10px] md:text-xs font-bold backdrop-blur-sm flex items-center gap-1 md:gap-1.5">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 relative">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 md:w-60 h-40 md:h-60 bg-gradient-to-br from-[#FFD700]/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[var(--success)] text-xs md:text-sm font-semibold uppercase tracking-wider">Ready to Play</span>
            </div>

            <h3 className="text-lg md:text-2xl font-black text-white mb-1 md:mb-2">Bitcoin Trading Simulator</h3>
            <p className="text-[var(--text-secondary)] text-sm md:text-base mb-3 md:mb-4 line-clamp-2">
              Trade Bitcoin with real-time market data! Practice with a $10,000 virtual portfolio.
            </p>

            <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-5 text-xs md:text-sm">
              <span className="flex items-center gap-1 md:gap-2 text-[var(--text-tertiary)]">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                15-20 min
              </span>
              <span className="flex items-center gap-1 md:gap-2 text-[#FFD700] font-bold">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                +500 XP
              </span>
            </div>

            <button
              onClick={() => setActiveGame('bitcoin-simulator')}
              className="cta-pulse w-full md:w-auto inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FF6B35] text-black text-sm md:text-base font-bold hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FFD700]/40 transition-all duration-200"
            >
              <Play className="w-4 h-4 md:w-5 md:h-5" />
              Start Trading
            </button>
          </div>
        </div>
      </div>

      {/* Games by Category - EXCITING VERSION */}
      {categories.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
            <h3 className="text-base md:text-xl font-black text-white">{category}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--border-default)] to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
            {games
              .filter(game => game.category === category)
              .map((game) => {
                const Icon = game.icon;
                return (
                  <div
                    key={game.id}
                    onClick={() => !game.locked && setSelectedGame(game.id)}
                    className={cn(
                      "course-card-lift rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group",
                      game.locked
                        ? "bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] opacity-60"
                        : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-white/20"
                    )}
                  >
                    {/* Game Image / Placeholder */}
                    <div className={cn(
                      "relative h-28 md:h-36 overflow-hidden",
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
                            <Icon className="w-12 h-12 md:w-16 md:h-16 text-white/30" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Icon className="w-8 h-8 md:w-12 md:h-12 text-white float-icon" />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />

                      {/* Game Icon Badge */}
                      <div className="absolute top-2 left-2 md:top-3 md:left-3">
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm",
                          game.locked ? "bg-black/50" : "bg-white/20"
                        )}>
                          {game.locked ? (
                            <Lock className="w-4 h-4 md:w-5 md:h-5 text-white/60" />
                          ) : (
                            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className="absolute top-2 right-2 md:top-3 md:right-3">
                        <span className={cn(
                          "px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold backdrop-blur-sm",
                          game.difficulty === 'Easy' ? "bg-[var(--success)]/90 text-white" :
                          game.difficulty === 'Medium' ? "bg-[var(--secondary-500)]/90 text-white" :
                          "bg-[var(--danger)]/90 text-white"
                        )}>
                          {game.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 md:p-5">
                      <h4 className={cn(
                        "font-bold text-base md:text-lg mb-1 md:mb-2 transition-colors",
                        game.locked ? "text-[var(--text-muted)]" : "text-white group-hover:text-[var(--primary-500)]"
                      )}>
                        {game.name}
                      </h4>
                      <p className={cn(
                        "text-xs md:text-sm mb-3 md:mb-4 line-clamp-2",
                        game.locked ? "text-[var(--text-muted)]" : "text-[var(--text-tertiary)]"
                      )}>
                        {game.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] md:text-xs">
                        <div className="flex items-center gap-2 md:gap-3 text-[var(--text-tertiary)]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {game.duration}
                          </span>
                        </div>
                        {game.highScore !== null ? (
                          <span className="flex items-center gap-1 text-[var(--secondary-500)] font-bold">
                            <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {game.highScore.toLocaleString()}
                          </span>
                        ) : !game.locked && (
                          <span className="flex items-center gap-1 text-[var(--secondary-500)] font-bold">
                            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            +200 XP
                          </span>
                        )}
                      </div>

                      {game.locked && (
                        <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] md:text-xs mt-3 md:mt-4 pt-3 md:pt-4 border-t border-[var(--border-subtle)]">
                          <Lock className="w-3 h-3 md:w-3.5 md:h-3.5" />
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setSelectedGame(null)}
        >
          <div
            className="bg-[#0A0E27] border-t md:border border-white/[0.1] rounded-t-2xl md:rounded-2xl max-w-lg w-full p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const game = games.find(g => g.id === selectedGame)!;
              const Icon = game.icon;
              return (
                <>
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className={cn(
                      "w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                      game.gradient
                    )}>
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-white truncate">{game.name}</h3>
                      <p className="text-white/60 text-sm">{game.category}</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm md:text-base mb-4 md:mb-6">{game.description}</p>

                  <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6 py-3 md:py-4 border-y border-white/[0.06]">
                    <div>
                      <p className="text-white/40 text-[10px] md:text-xs mb-1">Duration</p>
                      <p className="text-white text-sm md:text-base font-medium">{game.duration}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] md:text-xs mb-1">Difficulty</p>
                      <p className={cn(
                        "text-sm md:text-base font-medium",
                        game.difficulty === 'Easy' ? "text-[#50D890]" :
                        game.difficulty === 'Medium' ? "text-[#FF6B35]" :
                        "text-[#FF4757]"
                      )}>
                        {game.difficulty}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] md:text-xs mb-1">High Score</p>
                      <p className="text-[#FFD700] text-sm md:text-base font-medium">
                        {game.highScore?.toLocaleString() || 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border border-white/[0.1] text-white text-sm md:text-base hover:bg-white/[0.05] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setActiveGame(selectedGame);
                        setSelectedGame(null);
                      }}
                      className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-white text-sm md:text-base font-semibold hover:opacity-90 transition-opacity bg-gradient-to-r",
                      game.gradient
                    )}>
                      <Play className="w-4 h-4 md:w-5 md:h-5" />
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

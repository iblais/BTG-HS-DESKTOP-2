/**
 * Cloud Storage System with Supabase
 * Syncs data across devices with localStorage fallback for offline support
 */

import { supabase } from './supabase';

const STORAGE_KEYS = {
  QUIZ_STATE: 'btg_quiz_state',
  GAME_STATE: 'btg_game_state',
  BITCOIN_TRADES: 'btg_bitcoin_trades',
  COURSE_PROGRESS: 'btg_course_progress',
  ACTIVE_TAB: 'btg_active_tab',
  ACTIVE_SCREEN: 'btg_active_screen',
  SYNC_QUEUE: 'btg_sync_queue',
} as const;

// Type definitions
export interface QuizState {
  weekNumber: number;
  currentQuestionIndex: number;
  answers: Record<number, number>;
  startedAt: number;
  timeSpent: number;
}

export interface GameState {
  gameId: string;
  gameData: unknown;
  startedAt: number;
  lastPlayedAt: number;
  completed: boolean;
}

export interface BitcoinTrade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
}

export interface BitcoinSimulatorState {
  balance: number;
  btcHoldings: number;
  trades: BitcoinTrade[];
  startingBalance: number;
  totalProfit: number;
  totalLoss: number;
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// Check if online
function isOnline(): boolean {
  return navigator.onLine;
}

// Local storage helpers (for offline fallback)
const localStore = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Local storage set error:', error);
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Local storage remove error:', error);
    }
  },
};

// ============================================
// BITCOIN SIMULATOR - Cloud Storage
// ============================================

export const bitcoinStorage = {
  async getState(): Promise<BitcoinSimulatorState | null> {
    // Always try local first for fast loading
    const localState = localStore.get<BitcoinSimulatorState>(STORAGE_KEYS.BITCOIN_TRADES);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return localState;

    try {
      // Fetch from Supabase
      const { data: simulator, error: simError } = await supabase
        .from('bitcoin_simulator')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If table doesn't exist or other error, use local storage
      if (simError) {
        console.warn('Bitcoin simulator fetch failed, using local:', simError.message);
        return localState;
      }

      if (!simulator) {
        return localState;
      }

      // Fetch trades
      const { data: trades, error: tradesError } = await supabase
        .from('bitcoin_trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (tradesError) {
        console.warn('Bitcoin trades fetch failed:', tradesError.message);
      }

      const state: BitcoinSimulatorState = {
        balance: Number(simulator.balance),
        btcHoldings: Number(simulator.btc_holdings),
        startingBalance: Number(simulator.starting_balance),
        totalProfit: Number(simulator.total_profit),
        totalLoss: Number(simulator.total_loss),
        trades: (trades || []).map(t => ({
          id: t.id,
          type: t.trade_type as 'buy' | 'sell',
          amount: Number(t.btc_amount),
          price: Number(t.price_per_btc),
          total: Number(t.total_usd),
          timestamp: new Date(t.created_at).getTime(),
        })),
      };

      // Cache locally
      localStore.set(STORAGE_KEYS.BITCOIN_TRADES, state);
      return state;
    } catch (error) {
      console.warn('Error in bitcoinStorage.getState, using local:', error);
      return localState;
    }
  },

  async setState(state: BitcoinSimulatorState): Promise<void> {
    // Always save locally first
    localStore.set(STORAGE_KEYS.BITCOIN_TRADES, state);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    try {
      // Upsert simulator state
      await supabase
        .from('bitcoin_simulator')
        .upsert({
          user_id: userId,
          balance: state.balance,
          btc_holdings: state.btcHoldings,
          starting_balance: state.startingBalance,
          total_profit: state.totalProfit,
          total_loss: state.totalLoss,
        }, {
          onConflict: 'user_id',
        });
    } catch (error) {
      console.warn('Cloud save failed, data saved locally:', error);
    }
  },

  async addTrade(trade: Omit<BitcoinTrade, 'id' | 'timestamp'>): Promise<BitcoinSimulatorState> {
    // Get current state (local first for speed)
    const localState = localStore.get<BitcoinSimulatorState>(STORAGE_KEYS.BITCOIN_TRADES);
    const state = localState || {
      balance: 10000,
      btcHoldings: 0,
      trades: [],
      startingBalance: 10000,
      totalProfit: 0,
      totalLoss: 0,
    };

    const newTrade: BitcoinTrade = {
      ...trade,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Update state
    if (trade.type === 'buy') {
      state.balance -= trade.total;
      state.btcHoldings += trade.amount;
    } else {
      state.balance += trade.total;
      state.btcHoldings -= trade.amount;
    }
    state.trades.push(newTrade);

    // Save locally first (always)
    localStore.set(STORAGE_KEYS.BITCOIN_TRADES, state);

    // Try to sync to cloud (non-blocking)
    const userId = await getCurrentUserId();
    if (userId && isOnline()) {
      try {
        await supabase
          .from('bitcoin_simulator')
          .upsert({
            user_id: userId,
            balance: state.balance,
            btc_holdings: state.btcHoldings,
            starting_balance: state.startingBalance,
            total_profit: state.totalProfit,
            total_loss: state.totalLoss,
          }, {
            onConflict: 'user_id',
          });

        const { data: sim } = await supabase
          .from('bitcoin_simulator')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (sim) {
          await supabase
            .from('bitcoin_trades')
            .insert({
              user_id: userId,
              simulator_id: sim.id,
              trade_type: trade.type,
              btc_amount: trade.amount,
              price_per_btc: trade.price,
              total_usd: trade.total,
            });
        }
      } catch (error) {
        console.warn('Cloud sync failed, trade saved locally:', error);
      }
    }

    return state;
  },

  async clear(): Promise<void> {
    // Clear local first
    localStore.remove(STORAGE_KEYS.BITCOIN_TRADES);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    try {
      await supabase.from('bitcoin_trades').delete().eq('user_id', userId);
      await supabase.from('bitcoin_simulator').delete().eq('user_id', userId);
    } catch (error) {
      console.warn('Cloud clear failed:', error);
    }
  },
};

// ============================================
// QUIZ PROGRESS - Cloud Storage
// ============================================

export const quizStorage = {
  async getState(weekNumber: number): Promise<QuizState | null> {
    const localKey = `${STORAGE_KEYS.QUIZ_STATE}_${weekNumber}`;
    const localState = localStore.get<QuizState>(localKey);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return localState;

    try {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('week_number', weekNumber)
        .single();

      if (error || !data) return localState;

      const state: QuizState = {
        weekNumber: data.week_number,
        currentQuestionIndex: data.current_question_index,
        answers: data.answers as Record<number, number>,
        startedAt: new Date(data.started_at).getTime(),
        timeSpent: data.time_spent_seconds,
      };

      localStore.set(localKey, state);
      return state;
    } catch (error) {
      console.warn('Quiz cloud fetch failed, using local:', error);
      return localState;
    }
  },

  async setState(weekNumber: number, state: QuizState): Promise<void> {
    const localKey = `${STORAGE_KEYS.QUIZ_STATE}_${weekNumber}`;
    localStore.set(localKey, state);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    try {
      await supabase
        .from('quiz_progress')
        .upsert({
          user_id: userId,
          week_number: weekNumber,
          current_question_index: state.currentQuestionIndex,
          answers: state.answers,
          started_at: new Date(state.startedAt).toISOString(),
          time_spent_seconds: state.timeSpent,
        }, {
          onConflict: 'user_id,week_number',
        });
    } catch (error) {
      console.warn('Quiz cloud save failed:', error);
    }
  },

  async clear(weekNumber: number): Promise<void> {
    const localKey = `${STORAGE_KEYS.QUIZ_STATE}_${weekNumber}`;
    localStore.remove(localKey);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    try {
      await supabase
        .from('quiz_progress')
        .delete()
        .eq('user_id', userId)
        .eq('week_number', weekNumber);
    } catch (error) {
      console.warn('Quiz cloud clear failed:', error);
    }
  },
};

// ============================================
// GAME PROGRESS - Cloud Storage
// ============================================

export const gameStorage = {
  async getState(gameId: string): Promise<GameState | null> {
    const localKey = `${STORAGE_KEYS.GAME_STATE}_${gameId}`;
    const localState = localStore.get<GameState>(localKey);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return localState;

    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (error || !data) return localState;

      const state: GameState = {
        gameId: data.game_id,
        gameData: data.game_data,
        startedAt: new Date(data.started_at).getTime(),
        lastPlayedAt: new Date(data.last_played_at).getTime(),
        completed: data.completed,
      };

      localStore.set(localKey, state);
      return state;
    } catch (error) {
      console.warn('Game cloud fetch failed, using local:', error);
      return localState;
    }
  },

  async setState(gameId: string, state: GameState): Promise<void> {
    const localKey = `${STORAGE_KEYS.GAME_STATE}_${gameId}`;
    localStore.set(localKey, state);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    try {
      await supabase
        .from('game_progress')
        .upsert({
          user_id: userId,
          game_id: gameId,
          game_data: state.gameData,
          started_at: new Date(state.startedAt).toISOString(),
          last_played_at: new Date(state.lastPlayedAt).toISOString(),
          completed: state.completed,
        }, {
          onConflict: 'user_id,game_id',
        });
    } catch (error) {
      console.warn('Game cloud save failed:', error);
    }
  },

  async clear(gameId: string): Promise<void> {
    const localKey = `${STORAGE_KEYS.GAME_STATE}_${gameId}`;
    localStore.remove(localKey);

    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    try {
      await supabase
        .from('game_progress')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);
    } catch (error) {
      console.warn('Game cloud clear failed:', error);
    }
  },
};

// ============================================
// LEGACY STORAGE (for backward compatibility)
// ============================================

export const storage = {
  // Generic get/set (local only)
  get<T>(key: string): T | null {
    return localStore.get<T>(key);
  },

  set<T>(key: string, value: T): void {
    localStore.set(key, value);
  },

  remove(key: string): void {
    localStore.remove(key);
  },

  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStore.remove(key);
    });
  },

  // Quiz state - legacy sync methods (use quizStorage instead)
  getQuizState(weekNumber: number): QuizState | null {
    const allQuizzes = this.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE);
    return allQuizzes?.[weekNumber] || null;
  },

  setQuizState(weekNumber: number, state: QuizState): void {
    const allQuizzes = this.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE) || {};
    allQuizzes[weekNumber] = state;
    this.set(STORAGE_KEYS.QUIZ_STATE, allQuizzes);
    // Also sync to cloud
    quizStorage.setState(weekNumber, state).catch(console.error);
  },

  clearQuizState(weekNumber: number): void {
    const allQuizzes = this.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE) || {};
    delete allQuizzes[weekNumber];
    this.set(STORAGE_KEYS.QUIZ_STATE, allQuizzes);
    quizStorage.clear(weekNumber).catch(console.error);
  },

  // Game state - legacy sync methods (use gameStorage instead)
  getGameState(gameId: string): GameState | null {
    const allGames = this.get<Record<string, GameState>>(STORAGE_KEYS.GAME_STATE);
    return allGames?.[gameId] || null;
  },

  setGameState(gameId: string, state: GameState): void {
    const allGames = this.get<Record<string, GameState>>(STORAGE_KEYS.GAME_STATE) || {};
    allGames[gameId] = {
      ...state,
      lastPlayedAt: Date.now(),
    };
    this.set(STORAGE_KEYS.GAME_STATE, allGames);
    gameStorage.setState(gameId, state).catch(console.error);
  },

  clearGameState(gameId: string): void {
    const allGames = this.get<Record<string, GameState>>(STORAGE_KEYS.GAME_STATE) || {};
    delete allGames[gameId];
    this.set(STORAGE_KEYS.GAME_STATE, allGames);
    gameStorage.clear(gameId).catch(console.error);
  },

  // Bitcoin simulator - legacy sync methods (use bitcoinStorage instead)
  getBitcoinState(): BitcoinSimulatorState | null {
    return this.get<BitcoinSimulatorState>(STORAGE_KEYS.BITCOIN_TRADES);
  },

  setBitcoinState(state: BitcoinSimulatorState): void {
    this.set(STORAGE_KEYS.BITCOIN_TRADES, state);
    bitcoinStorage.setState(state).catch(console.error);
  },

  addBitcoinTrade(trade: Omit<BitcoinTrade, 'id' | 'timestamp'>): void {
    bitcoinStorage.addTrade(trade).then(state => {
      this.set(STORAGE_KEYS.BITCOIN_TRADES, state);
    }).catch(console.error);
  },

  clearBitcoinState(): void {
    this.remove(STORAGE_KEYS.BITCOIN_TRADES);
    bitcoinStorage.clear().catch(console.error);
  },

  // Active navigation state (local only)
  getActiveTab(): string | null {
    return this.get<string>(STORAGE_KEYS.ACTIVE_TAB);
  },

  setActiveTab(tab: string): void {
    this.set(STORAGE_KEYS.ACTIVE_TAB, tab);
  },

  getActiveScreen(): { tab: string; screen?: string } | null {
    return this.get(STORAGE_KEYS.ACTIVE_SCREEN);
  },

  setActiveScreen(tab: string, screen?: string): void {
    this.set(STORAGE_KEYS.ACTIVE_SCREEN, { tab, screen });
  },
};

// ============================================
// SYNC UTILITIES
// ============================================

export const syncUtils = {
  // Force sync all local data to cloud
  async syncAllToCloud(): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    console.log('Syncing all local data to cloud...');

    // Sync bitcoin state
    const bitcoinState = localStore.get<BitcoinSimulatorState>(STORAGE_KEYS.BITCOIN_TRADES);
    if (bitcoinState) {
      await bitcoinStorage.setState(bitcoinState);
    }

    // Sync quiz states
    const allQuizzes = localStore.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE);
    if (allQuizzes) {
      for (const [weekNum, state] of Object.entries(allQuizzes)) {
        await quizStorage.setState(Number(weekNum), state);
      }
    }

    // Sync game states
    const allGames = localStore.get<Record<string, GameState>>(STORAGE_KEYS.GAME_STATE);
    if (allGames) {
      for (const [gameId, state] of Object.entries(allGames)) {
        await gameStorage.setState(gameId, state);
      }
    }

    console.log('Sync complete!');
  },

  // Force fetch all data from cloud
  async syncAllFromCloud(): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId || !isOnline()) return;

    console.log('Fetching all data from cloud...');

    // Fetch bitcoin state
    await bitcoinStorage.getState();

    console.log('Cloud data fetched!');
  },
};

/**
 * Central storage system for persisting app state
 * Uses localStorage for simplicity and immediate availability
 */

const STORAGE_KEYS = {
  QUIZ_STATE: 'btg_quiz_state',
  GAME_STATE: 'btg_game_state',
  BITCOIN_TRADES: 'btg_bitcoin_trades',
  COURSE_PROGRESS: 'btg_course_progress',
  ACTIVE_TAB: 'btg_active_tab',
  ACTIVE_SCREEN: 'btg_active_screen',
} as const;

// Type definitions
interface QuizState {
  weekNumber: number;
  currentQuestionIndex: number;
  answers: Record<number, number>;
  startedAt: number;
  timeSpent: number;
}

interface GameState {
  gameId: string;
  gameData: unknown;
  startedAt: number;
  lastPlayedAt: number;
  completed: boolean;
}

interface BitcoinTrade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
}

interface BitcoinSimulatorState {
  balance: number;
  btcHoldings: number;
  trades: BitcoinTrade[];
  startingBalance: number;
  totalProfit: number;
  totalLoss: number;
}

// Storage helpers
export const storage = {
  // Generic get/set
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },

  // Quiz state
  getQuizState(weekNumber: number): QuizState | null {
    const allQuizzes = this.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE);
    return allQuizzes?.[weekNumber] || null;
  },

  setQuizState(weekNumber: number, state: QuizState): void {
    const allQuizzes = this.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE) || {};
    allQuizzes[weekNumber] = state;
    this.set(STORAGE_KEYS.QUIZ_STATE, allQuizzes);
  },

  clearQuizState(weekNumber: number): void {
    const allQuizzes = this.get<Record<number, QuizState>>(STORAGE_KEYS.QUIZ_STATE) || {};
    delete allQuizzes[weekNumber];
    this.set(STORAGE_KEYS.QUIZ_STATE, allQuizzes);
  },

  // Game state
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
  },

  clearGameState(gameId: string): void {
    const allGames = this.get<Record<string, GameState>>(STORAGE_KEYS.GAME_STATE) || {};
    delete allGames[gameId];
    this.set(STORAGE_KEYS.GAME_STATE, allGames);
  },

  // Bitcoin simulator specific
  getBitcoinState(): BitcoinSimulatorState | null {
    return this.get<BitcoinSimulatorState>(STORAGE_KEYS.BITCOIN_TRADES);
  },

  setBitcoinState(state: BitcoinSimulatorState): void {
    this.set(STORAGE_KEYS.BITCOIN_TRADES, state);
  },

  addBitcoinTrade(trade: Omit<BitcoinTrade, 'id' | 'timestamp'>): void {
    const state = this.getBitcoinState() || {
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

    state.trades.push(newTrade);

    if (trade.type === 'buy') {
      state.balance -= trade.total;
      state.btcHoldings += trade.amount;
    } else {
      state.balance += trade.total;
      state.btcHoldings -= trade.amount;
    }

    this.setBitcoinState(state);
  },

  clearBitcoinState(): void {
    this.remove(STORAGE_KEYS.BITCOIN_TRADES);
  },

  // Active navigation state
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

export type {
  QuizState,
  GameState,
  BitcoinTrade,
  BitcoinSimulatorState,
};

import { useState, useEffect } from 'react';
import { BitcoinChart } from './BitcoinChart';
import { bitcoinStorage } from '@/lib/storage';
import type { BitcoinSimulatorState } from '@/lib/storage';
import { ArrowLeft, Wallet, DollarSign, TrendingUp, TrendingDown, RotateCcw, ArrowUpRight, ArrowDownRight, History, Loader2, Cloud, CloudOff } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface BitcoinTradingSimulatorProps {
  onBack: () => void;
  onSaveProgress?: (progress: { totalProfit: number; balance: number; btcHoldings: number }) => void;
}

const DEFAULT_STATE: BitcoinSimulatorState = {
  balance: 10000,
  btcHoldings: 0,
  trades: [],
  startingBalance: 10000,
  totalProfit: 0,
  totalLoss: 0,
};

export function BitcoinTradingSimulator({ onBack, onSaveProgress }: BitcoinTradingSimulatorProps) {
  // Initialize with default state, will load from cloud
  const [state, setState] = useState<BitcoinSimulatorState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [currentPrice, setCurrentPrice] = useState(0);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1W');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'usd' | 'btc'>('usd');
  const [error, setError] = useState<string | null>(null);

  // Load state from cloud on mount
  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        const cloudState = await bitcoinStorage.getState();
        if (cloudState) {
          setState(cloudState);
        }
      } catch (error) {
        console.error('Failed to load bitcoin state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);


  // Calculate current portfolio value
  const portfolioValue = state.balance + (state.btcHoldings * currentPrice);
  const totalReturn = portfolioValue - state.startingBalance;
  const returnPercentage = state.startingBalance > 0 ? (totalReturn / state.startingBalance) * 100 : 0;

  const handleBuy = async () => {
    setError(null);
    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0 || !currentPrice) {
      setError('Enter a valid amount');
      return;
    }

    let btcAmount: number;
    let usdTotal: number;

    if (tradeType === 'usd') {
      usdTotal = amount;
      btcAmount = usdTotal / currentPrice;

      if (usdTotal > state.balance) {
        setError('Insufficient USD balance');
        return;
      }
    } else {
      btcAmount = amount;
      usdTotal = btcAmount * currentPrice;

      if (usdTotal > state.balance) {
        setError('Insufficient USD balance');
        return;
      }
    }

    // Execute trade via cloud storage
    setIsSyncing(true);
    try {
      const updatedState = await bitcoinStorage.addTrade({
        type: 'buy',
        amount: btcAmount,
        price: currentPrice,
        total: usdTotal,
      });
      setState(updatedState);
      setTradeAmount('');
      // Save progress to game_scores
      if (onSaveProgress) {
        onSaveProgress({
          totalProfit: updatedState.totalProfit,
          balance: updatedState.balance,
          btcHoldings: updatedState.btcHoldings
        });
      }
    } catch (error) {
      console.error('Failed to execute buy:', error);
      setError('Failed to execute trade');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSell = async () => {
    setError(null);
    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0 || !currentPrice) {
      setError('Enter a valid amount');
      return;
    }

    let btcAmount: number;
    let usdTotal: number;

    if (tradeType === 'btc') {
      btcAmount = amount;

      if (btcAmount > state.btcHoldings) {
        setError('Insufficient BTC holdings');
        return;
      }

      usdTotal = btcAmount * currentPrice;
    } else {
      usdTotal = amount;
      btcAmount = usdTotal / currentPrice;

      if (btcAmount > state.btcHoldings) {
        setError('Insufficient BTC holdings');
        return;
      }
    }

    // Execute trade via cloud storage
    setIsSyncing(true);
    try {
      const updatedState = await bitcoinStorage.addTrade({
        type: 'sell',
        amount: btcAmount,
        price: currentPrice,
        total: usdTotal,
      });
      setState(updatedState);
      setTradeAmount('');
      // Save progress to game_scores
      if (onSaveProgress) {
        onSaveProgress({
          totalProfit: updatedState.totalProfit,
          balance: updatedState.balance,
          btcHoldings: updatedState.btcHoldings
        });
      }
    } catch (error) {
      console.error('Failed to execute sell:', error);
      setError('Failed to execute trade');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset your trading simulator? This will erase all trades and progress.')) {
      setIsSyncing(true);
      try {
        await bitcoinStorage.clear();
        setState(DEFAULT_STATE);
      } catch (error) {
        console.error('Failed to reset simulator:', error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleQuickAmount = (amount: number) => {
    setTradeType('usd');
    setTradeAmount(amount.toString());
    setError(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#4A5FFF] animate-spin" />
          <p className="text-white/60">Loading your trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-white">Bitcoin Trading Simulator</h2>
              <span className="px-3 py-1 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-full text-xs font-bold text-[#FFD700] uppercase tracking-wider">
                Live Data
              </span>
              {/* Cloud sync indicator */}
              {isSyncing ? (
                <span className="px-2 py-1 bg-[#4A5FFF]/20 border border-[#4A5FFF]/30 rounded-full flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 text-[#4A5FFF] animate-spin" />
                  <span className="text-[10px] font-medium text-[#4A5FFF]">Syncing</span>
                </span>
              ) : navigator.onLine ? (
                <span className="px-2 py-1 bg-[#50D890]/20 border border-[#50D890]/30 rounded-full flex items-center gap-1.5">
                  <Cloud className="w-3 h-3 text-[#50D890]" />
                  <span className="text-[10px] font-medium text-[#50D890]">Synced</span>
                </span>
              ) : (
                <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center gap-1.5">
                  <CloudOff className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-medium text-orange-500">Offline</span>
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm">
              Practice trading Bitcoin with real market data. Starting balance: $10,000
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-red-400 border border-white/20 hover:border-red-500/50 rounded-xl transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Value */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-[#4A5FFF]" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
              Portfolio Value
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-sm font-semibold mt-2 flex items-center gap-1 ${totalReturn >= 0 ? 'text-[#50D890]' : 'text-[#FF6B35]'}`}>
            {totalReturn >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)} ({returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%)
          </div>
        </GlassCard>

        {/* USD Balance */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-[#50D890]" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
              USD Balance
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            ${state.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-white/40 mt-2">Available to trade</div>
        </GlassCard>

        {/* BTC Holdings */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#FFD700] text-lg font-bold">₿</span>
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
              BTC Holdings
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {state.btcHoldings.toFixed(8)}
          </div>
          <div className="text-sm text-white/40 mt-2">
            ≈ ${(state.btcHoldings * currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </GlassCard>

        {/* Total Trades */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-[#9B59B6]" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
              Total Trades
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {state.trades.length}
          </div>
          <div className="text-sm text-white/40 mt-2">
            {state.trades.filter(t => t.type === 'buy').length} buys, {state.trades.filter(t => t.type === 'sell').length} sells
          </div>
        </GlassCard>
      </div>

      {/* Chart + Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            {/* Timeframe selector */}
            <div className="flex items-center gap-2 mb-6">
              {(['1D', '1W', '1M', '3M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    timeframe === tf
                      ? 'bg-[#4A5FFF] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <BitcoinChart
              timeframe={timeframe}
              onPriceUpdate={setCurrentPrice}
            />
          </GlassCard>
        </div>

        {/* Trading Panel */}
        <GlassCard className="p-6 space-y-6">
          <h3 className="text-xl font-bold text-white">Place Trade</h3>

          {/* Trade type toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => { setTradeType('usd'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tradeType === 'usd'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60'
              }`}
            >
              USD Amount
            </button>
            <button
              onClick={() => { setTradeType('btc'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tradeType === 'btc'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60'
              }`}
            >
              BTC Amount
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              {tradeType === 'usd' ? 'Amount (USD)' : 'Amount (BTC)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                {tradeType === 'usd' ? '$' : '₿'}
              </span>
              <input
                type="number"
                step={tradeType === 'usd' ? '100' : '0.001'}
                value={tradeAmount}
                onChange={(e) => { setTradeAmount(e.target.value); setError(null); }}
                placeholder={tradeType === 'usd' ? '1000.00' : '0.01'}
                className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none focus:ring-2 focus:ring-[#4A5FFF]/20 transition-all"
              />
            </div>
            {tradeAmount && currentPrice > 0 && (
              <p className="mt-2 text-xs text-white/60">
                {tradeType === 'usd'
                  ? `≈ ${(parseFloat(tradeAmount) / currentPrice).toFixed(8)} BTC`
                  : `≈ $${(parseFloat(tradeAmount) * currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                }
              </p>
            )}
            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Buy/Sell buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBuy}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || !currentPrice || isSyncing}
              className="py-4 bg-gradient-to-r from-[#50D890] to-[#4ECDC4] text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
              Buy BTC
            </button>
            <button
              onClick={handleSell}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || state.btcHoldings === 0 || !currentPrice || isSyncing}
              className="py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8E53] text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownRight className="w-5 h-5" />}
              Sell BTC
            </button>
          </div>

          {/* Quick trade buttons */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs font-medium text-white/60 mb-3 uppercase tracking-wider">
              Quick Trade
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 2500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className="py-2 text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all"
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Current price display */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Current BTC Price</span>
              <span className="text-lg font-bold text-white">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Trade History */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <History className="w-6 h-6 text-[#9B59B6]" />
          Trade History
        </h3>

        {state.trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/60">No trades yet. Start trading to see your history.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {[...state.trades].reverse().map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    trade.type === 'buy'
                      ? 'bg-[#50D890]/20 text-[#50D890]'
                      : 'bg-[#FF6B35]/20 text-[#FF6B35]'
                  }`}>
                    {trade.type === 'buy' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold uppercase text-sm ${
                        trade.type === 'buy' ? 'text-[#50D890]' : 'text-[#FF6B35]'
                      }`}>
                        {trade.type}
                      </span>
                      <span className="text-sm text-white font-semibold">
                        {trade.amount.toFixed(8)} BTC
                      </span>
                    </div>
                    <span className="text-xs text-white/60">
                      {new Date(trade.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    ${trade.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-white/60">
                    @ ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

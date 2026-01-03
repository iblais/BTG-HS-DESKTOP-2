import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Clock, BarChart3, Wallet, RefreshCw, Info, AlertTriangle } from 'lucide-react';

interface StockMarketSimulatorProps {
  onBack: () => void;
  onSaveProgress?: (progress: unknown) => void;
  savedProgress?: unknown;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  previousPrice: number;
  sector: string;
  volatility: 'low' | 'medium' | 'high';
  description: string;
}

interface Portfolio {
  cash: number;
  holdings: { [symbol: string]: number };
}

interface NewsEvent {
  headline: string;
  impact: { [symbol: string]: number };
  type: 'positive' | 'negative' | 'neutral';
}

const initialStocks: Stock[] = [
  { symbol: 'SAFE', name: 'SafeBank Corp', price: 100, previousPrice: 100, sector: 'Finance', volatility: 'low', description: 'Stable banking company with consistent dividends' },
  { symbol: 'TECH', name: 'TechGrow Inc', price: 150, previousPrice: 150, sector: 'Technology', volatility: 'high', description: 'Fast-growing tech startup with high risk/reward' },
  { symbol: 'HLTH', name: 'HealthFirst', price: 80, previousPrice: 80, sector: 'Healthcare', volatility: 'medium', description: 'Healthcare company with steady growth' },
  { symbol: 'ENER', name: 'GreenEnergy Co', price: 60, previousPrice: 60, sector: 'Energy', volatility: 'high', description: 'Renewable energy company - volatile but future-focused' },
  { symbol: 'FOOD', name: 'FoodBasics Ltd', price: 45, previousPrice: 45, sector: 'Consumer', volatility: 'low', description: 'Essential goods company - defensive stock' },
  { symbol: 'GAME', name: 'GameWorld', price: 120, previousPrice: 120, sector: 'Entertainment', volatility: 'high', description: 'Gaming company - trendy but unpredictable' },
];

const newsEvents: NewsEvent[] = [
  { headline: 'Fed Raises Interest Rates', impact: { SAFE: 5, TECH: -8, HLTH: -2, ENER: -5, FOOD: 2, GAME: -6 }, type: 'neutral' },
  { headline: 'New Tech Breakthrough Announced', impact: { SAFE: 0, TECH: 15, HLTH: 3, ENER: 5, FOOD: 0, GAME: 8 }, type: 'positive' },
  { headline: 'Economic Recession Fears', impact: { SAFE: -3, TECH: -12, HLTH: 5, ENER: -8, FOOD: 8, GAME: -10 }, type: 'negative' },
  { headline: 'Healthcare Reform Passes', impact: { SAFE: 2, TECH: 0, HLTH: 12, ENER: 0, FOOD: 3, GAME: 0 }, type: 'positive' },
  { headline: 'Oil Prices Surge', impact: { SAFE: -2, TECH: -3, HLTH: -2, ENER: 18, FOOD: -5, GAME: -2 }, type: 'neutral' },
  { headline: 'Consumer Spending Up', impact: { SAFE: 3, TECH: 5, HLTH: 2, ENER: 2, FOOD: 8, GAME: 10 }, type: 'positive' },
  { headline: 'Major Data Breach Reported', impact: { SAFE: -5, TECH: -15, HLTH: -3, ENER: 0, FOOD: 0, GAME: -8 }, type: 'negative' },
  { headline: 'Green Energy Bill Signed', impact: { SAFE: 0, TECH: 3, HLTH: 0, ENER: 20, FOOD: 0, GAME: 0 }, type: 'positive' },
  { headline: 'Market Hits All-Time High', impact: { SAFE: 5, TECH: 10, HLTH: 5, ENER: 5, FOOD: 5, GAME: 12 }, type: 'positive' },
  { headline: 'Unemployment Rate Drops', impact: { SAFE: 4, TECH: 6, HLTH: 3, ENER: 4, FOOD: 5, GAME: 7 }, type: 'positive' },
];

export const StockMarketSimulator: React.FC<StockMarketSimulatorProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [portfolio, setPortfolio] = useState<Portfolio>({ cash: 10000, holdings: {} });
  const [day, setDay] = useState(1);
  const [maxDays] = useState(10);
  const [currentNews, setCurrentNews] = useState<NewsEvent | null>(null);
  const [showNews, setShowNews] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [, setPriceHistory] = useState<{ [symbol: string]: number[] }>({});

  useEffect(() => {
    // Initialize price history
    const history: { [symbol: string]: number[] } = {};
    stocks.forEach(stock => {
      history[stock.symbol] = [stock.price];
    });
    setPriceHistory(history);
  }, []);

  const startGame = (selectedDifficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setDifficulty(selectedDifficulty);

    let startingCash = 10000;
    if (selectedDifficulty === 'intermediate') startingCash = 7500;
    if (selectedDifficulty === 'advanced') startingCash = 5000;

    setPortfolio({ cash: startingCash, holdings: {} });
    setStocks(initialStocks.map(s => ({ ...s, price: s.price, previousPrice: s.price })));
    setDay(1);
    setCurrentNews(null);
    setGameState('playing');

    const history: { [symbol: string]: number[] } = {};
    initialStocks.forEach(stock => {
      history[stock.symbol] = [stock.price];
    });
    setPriceHistory(history);
  };

  const advanceDay = () => {
    if (day >= maxDays) {
      setGameState('results');
      return;
    }

    // Generate news event
    const randomNews = newsEvents[Math.floor(Math.random() * newsEvents.length)];
    setCurrentNews(randomNews);
    setShowNews(true);

    // Update stock prices based on news and random fluctuation
    setStocks(prevStocks => {
      return prevStocks.map(stock => {
        const newsImpact = randomNews.impact[stock.symbol] || 0;
        let volatilityFactor = 1;
        if (stock.volatility === 'medium') volatilityFactor = 1.5;
        if (stock.volatility === 'high') volatilityFactor = 2;

        // Add random fluctuation based on volatility
        const randomChange = (Math.random() - 0.5) * 10 * volatilityFactor;
        const totalChange = newsImpact + randomChange;
        const percentChange = totalChange / 100;
        const newPrice = Math.max(1, stock.price * (1 + percentChange));

        return {
          ...stock,
          previousPrice: stock.price,
          price: Math.round(newPrice * 100) / 100
        };
      });
    });

    // Update price history
    setPriceHistory(prev => {
      const updated = { ...prev };
      stocks.forEach(stock => {
        const newsImpact = randomNews.impact[stock.symbol] || 0;
        let volatilityFactor = 1;
        if (stock.volatility === 'medium') volatilityFactor = 1.5;
        if (stock.volatility === 'high') volatilityFactor = 2;
        const randomChange = (Math.random() - 0.5) * 10 * volatilityFactor;
        const totalChange = newsImpact + randomChange;
        const percentChange = totalChange / 100;
        const newPrice = Math.max(1, stock.price * (1 + percentChange));
        updated[stock.symbol] = [...(prev[stock.symbol] || []), Math.round(newPrice * 100) / 100];
      });
      return updated;
    });

    setDay(prev => prev + 1);
  };

  const buyStock = (stock: Stock, shares: number) => {
    const cost = stock.price * shares;
    if (cost > portfolio.cash) return;

    setPortfolio(prev => ({
      cash: prev.cash - cost,
      holdings: {
        ...prev.holdings,
        [stock.symbol]: (prev.holdings[stock.symbol] || 0) + shares
      }
    }));
    setSelectedStock(null);
  };

  const sellStock = (stock: Stock, shares: number) => {
    const currentHoldings = portfolio.holdings[stock.symbol] || 0;
    if (shares > currentHoldings) return;

    const revenue = stock.price * shares;
    setPortfolio(prev => ({
      cash: prev.cash + revenue,
      holdings: {
        ...prev.holdings,
        [stock.symbol]: currentHoldings - shares
      }
    }));
    setSelectedStock(null);
  };

  const getPortfolioValue = () => {
    let stockValue = 0;
    Object.entries(portfolio.holdings).forEach(([symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) stockValue += stock.price * shares;
    });
    return portfolio.cash + stockValue;
  };

  const getPercentChange = (stock: Stock) => {
    const change = ((stock.price - stock.previousPrice) / stock.previousPrice) * 100;
    return change;
  };

  const renderIntro = () => (
    <div className="min-h-screen bg-[#0A0E27] p-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/10">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white font-bold text-xl">Stock Simulator</h1>
        <div className="w-10"></div>
      </div>

      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-white text-2xl font-bold mb-2">Learn to Invest</h2>
        <p className="text-white/70">
          Trade virtual stocks, react to market news, and grow your portfolio!
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-white font-bold mb-4">How It Works:</h3>
        <div className="space-y-3 text-white/80 text-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span>Start with virtual cash to invest</span>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Buy and sell stocks over 10 trading days</span>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span>React to news events that move the market</span>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span>Goal: Grow your portfolio value!</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => startGame('beginner')}
          className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-bold text-lg"
        >
          <div className="flex items-center justify-between">
            <span>Beginner</span>
            <span className="text-sm opacity-80">$10,000 starting cash</span>
          </div>
        </button>

        <button
          onClick={() => startGame('intermediate')}
          className="w-full p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold text-lg"
        >
          <div className="flex items-center justify-between">
            <span>Intermediate</span>
            <span className="text-sm opacity-80">$7,500 starting cash</span>
          </div>
        </button>

        <button
          onClick={() => startGame('advanced')}
          className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-bold text-lg"
        >
          <div className="flex items-center justify-between">
            <span>Advanced</span>
            <span className="text-sm opacity-80">$5,000 starting cash</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderPlaying = () => (
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Header */}
      <div className="bg-[#0A0E27] border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="text-white font-medium">Day {day}/{maxDays}</span>
          </div>
          <button
            onClick={advanceDay}
            className="px-4 py-2 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] rounded-lg text-white text-sm font-bold"
          >
            {day >= maxDays ? 'End Game' : 'Next Day'}
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <Wallet className="w-4 h-4" />
              <span>Cash</span>
            </div>
            <div className="text-white font-bold text-lg">${portfolio.cash.toFixed(2)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Total Value</span>
            </div>
            <div className="text-green-400 font-bold text-lg">${getPortfolioValue().toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* News Banner */}
      {showNews && currentNews && (
        <div className={`p-4 ${
          currentNews.type === 'positive' ? 'bg-green-500/20 border-green-500/30' :
          currentNews.type === 'negative' ? 'bg-red-500/20 border-red-500/30' :
          'bg-yellow-500/20 border-yellow-500/30'
        } border-y`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-sm">{currentNews.headline}</span>
            </div>
            <button onClick={() => setShowNews(false)} className="text-white/60 text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Holdings */}
      {Object.keys(portfolio.holdings).some(k => portfolio.holdings[k] > 0) && (
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white/60 text-sm mb-2">Your Holdings</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(portfolio.holdings).map(([symbol, shares]) => {
              if (shares === 0) return null;
              const stock = stocks.find(s => s.symbol === symbol);
              if (!stock) return null;
              const value = stock.price * shares;
              return (
                <div key={symbol} className="bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white font-medium">{symbol}</span>
                  <span className="text-white/60 ml-2">{shares} @ ${stock.price.toFixed(2)}</span>
                  <span className="text-green-400 ml-2">${value.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock List */}
      <div className="p-4 space-y-3 pb-24">
        <h3 className="text-white/60 text-sm">Market</h3>
        {stocks.map(stock => {
          const change = getPercentChange(stock);
          const isUp = change >= 0;

          return (
            <button
              key={stock.symbol}
              onClick={() => setSelectedStock(stock)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white font-bold">{stock.symbol}</div>
                  <div className="text-white/60 text-sm">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">${stock.price.toFixed(2)}</div>
                  <div className={`flex items-center justify-end gap-1 text-sm ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{isUp ? '+' : ''}{change.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>{stock.sector}</span>
                <span className={`px-2 py-0.5 rounded ${
                  stock.volatility === 'low' ? 'bg-green-500/20 text-green-400' :
                  stock.volatility === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {stock.volatility} risk
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trade Modal */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end z-50">
          <div className="bg-[#1a1f3a] rounded-t-3xl p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-xl">{selectedStock.symbol}</h3>
              <button onClick={() => setSelectedStock(null)} className="text-white/60">Close</button>
            </div>

            <p className="text-white/60 text-sm mb-4">{selectedStock.description}</p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60">Current Price:</span>
              <span className="text-white font-bold text-xl">${selectedStock.price.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60">You own:</span>
              <span className="text-white font-medium">{portfolio.holdings[selectedStock.symbol] || 0} shares</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setTradeAmount(Math.max(1, tradeAmount - 1))}
                className="w-10 h-10 rounded-full bg-white/10 text-white font-bold"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <div className="text-white font-bold text-2xl">{tradeAmount}</div>
                <div className="text-white/60 text-sm">shares = ${(tradeAmount * selectedStock.price).toFixed(2)}</div>
              </div>
              <button
                onClick={() => setTradeAmount(tradeAmount + 1)}
                className="w-10 h-10 rounded-full bg-white/10 text-white font-bold"
              >
                +
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => buyStock(selectedStock, tradeAmount)}
                disabled={selectedStock.price * tradeAmount > portfolio.cash}
                className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-bold disabled:opacity-50"
              >
                Buy
              </button>
              <button
                onClick={() => sellStock(selectedStock, tradeAmount)}
                disabled={(portfolio.holdings[selectedStock.symbol] || 0) < tradeAmount}
                className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white font-bold disabled:opacity-50"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResults = () => {
    const finalValue = getPortfolioValue();
    const startingCash = difficulty === 'beginner' ? 10000 : difficulty === 'intermediate' ? 7500 : 5000;
    const returnPercent = ((finalValue - startingCash) / startingCash) * 100;
    const isProfit = returnPercent >= 0;

    let grade = 'F';
    let message = '';
    if (returnPercent >= 50) { grade = 'A+'; message = 'Warren Buffett would be proud!'; }
    else if (returnPercent >= 30) { grade = 'A'; message = 'Excellent investing skills!'; }
    else if (returnPercent >= 15) { grade = 'B'; message = 'Solid returns - you beat the market!'; }
    else if (returnPercent >= 5) { grade = 'C'; message = 'Modest gains - keep learning!'; }
    else if (returnPercent >= 0) { grade = 'D'; message = 'At least you didn\'t lose money!'; }
    else { grade = 'F'; message = 'Investing is risky - but you learned something!'; }

    return (
      <div className="min-h-screen bg-[#0A0E27] p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/10">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-xl">Game Over</h1>
          <div className="w-10"></div>
        </div>

        <div className="text-center mb-8">
          <div className={`text-8xl font-black ${isProfit ? 'text-green-400' : 'text-red-400'} mb-2`}>
            {grade}
          </div>
          <p className="text-white/70">{message}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="text-center">
            <div className="text-white/60 mb-2">Final Portfolio Value</div>
            <div className="text-4xl font-bold text-white mb-2">${finalValue.toFixed(2)}</div>
            <div className={`text-lg font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{returnPercent.toFixed(2)}% return
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <h3 className="text-white font-bold mb-3">What You Learned:</h3>
          <ul className="space-y-2 text-white/70 text-sm">
            <li>• Diversification helps reduce risk</li>
            <li>• News events can move stock prices dramatically</li>
            <li>• High-volatility stocks can gain OR lose big</li>
            <li>• Long-term thinking often beats short-term trading</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setGameState('intro')}
            className="w-full p-4 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] rounded-xl text-white font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full p-4 bg-white/10 rounded-xl text-white font-bold"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  };

  switch (gameState) {
    case 'intro':
      return renderIntro();
    case 'playing':
      return renderPlaying();
    case 'results':
      return renderResults();
    default:
      return renderIntro();
  }
};

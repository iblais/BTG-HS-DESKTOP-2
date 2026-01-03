import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { bitcoinApi } from '@/lib/bitcoinApi';
import type { BitcoinHistoricalData } from '@/lib/bitcoinApi';
import { Loader2 } from 'lucide-react';

interface BitcoinChartProps {
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
  onPriceUpdate?: (price: number) => void;
}

interface ChartDataPoint {
  time: number;
  price: number;
}

export function BitcoinChart({ timeframe, onPriceUpdate }: BitcoinChartProps) {
  const [data, setData] = useState<BitcoinHistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let chartData: BitcoinHistoricalData[];

      switch (timeframe) {
        case '1D':
          chartData = await bitcoinApi.getIntradayData();
          break;
        case '1W':
          chartData = await bitcoinApi.getHistoricalData(7);
          break;
        case '1M':
          chartData = await bitcoinApi.getHistoricalData(30);
          break;
        case '3M':
          chartData = await bitcoinApi.getHistoricalData(90);
          break;
        case '1Y':
          chartData = await bitcoinApi.getHistoricalData(365);
          break;
        default:
          chartData = await bitcoinApi.getHistoricalData(7);
      }

      setData(chartData);

      // Get current price
      const price = await bitcoinApi.getCurrentPrice();
      setCurrentPrice(price);
      onPriceUpdate?.(price);
    } catch (error) {
      console.error('Chart data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe, onPriceUpdate]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds for 1D view
    const interval = timeframe === '1D'
      ? setInterval(fetchData, 30000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, timeframe]);

  // Calculate price change
  const priceChange = data.length > 1
    ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100
    : 0;
  const isPositive = priceChange >= 0;

  // Format data for chart
  const chartData: ChartDataPoint[] = data.map(point => ({
    time: point.timestamp,
    price: point.price,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="glass-card rounded-lg p-3 shadow-xl border border-white/10">
          <p className="text-xs text-white/60 mb-1">
            {new Date(dataPoint.time).toLocaleString()}
          </p>
          <p className="text-lg font-bold text-white">
            ${dataPoint.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price header - Robinhood style */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black text-white">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-lg font-bold ${isPositive ? 'text-[#50D890]' : 'text-[#FF6B35]'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
        <p className="text-sm text-white/60 mt-1">
          Bitcoin (BTC) - {timeframe === '1D' ? 'Today' : `Last ${timeframe.replace('1', '').replace('3', '3 ')}`}
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? '#50D890' : '#FF6B35'}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? '#50D890' : '#FF6B35'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
            tickFormatter={(timestamp: number) => {
              const date = new Date(timestamp);
              if (timeframe === '1D') {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}
            tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
            domain={['dataMin - 500', 'dataMax + 500']}
            tickLine={false}
            axisLine={false}
            width={60}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#50D890' : '#FF6B35'}
            strokeWidth={2}
            fill="url(#colorPrice)"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Bitcoin price data integration
 * Uses CoinGecko API (free, no auth required)
 */

export interface BitcoinPrice {
  usd: number;
  timestamp: number;
}

export interface BitcoinHistoricalData {
  timestamp: number;
  price: number;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache for current price
let priceCache: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export const bitcoinApi = {
  /**
   * Get current Bitcoin price in USD
   */
  async getCurrentPrice(): Promise<number> {
    // Return cached price if fresh
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return priceCache.price;
    }

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
      );
      const data = await response.json();
      const price = data.bitcoin.usd;

      // Update cache
      priceCache = { price, timestamp: Date.now() };

      return price;
    } catch (error) {
      console.error('Failed to fetch Bitcoin price:', error);
      // Return cached or fallback price
      return priceCache?.price || 45000;
    }
  },

  /**
   * Get historical price data for charting
   * @param days Number of days of history (1, 7, 30, 90, 365)
   */
  async getHistoricalData(days: number = 7): Promise<BitcoinHistoricalData[]> {
    try {
      const response = await fetch(
        `${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
      );
      const data = await response.json();

      // Transform to our format
      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price: Math.round(price * 100) / 100,
      }));
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      return this.getMockHistoricalData(days);
    }
  },

  /**
   * Get intraday data for detailed chart (hourly for last 24h)
   */
  async getIntradayData(): Promise<BitcoinHistoricalData[]> {
    try {
      const response = await fetch(
        `${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=usd&days=1`
      );
      const data = await response.json();

      return data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price: Math.round(price * 100) / 100,
      }));
    } catch (error) {
      console.error('Failed to fetch intraday data:', error);
      return this.getMockIntradayData();
    }
  },

  /**
   * Mock data generator for fallback
   */
  getMockHistoricalData(days: number): BitcoinHistoricalData[] {
    const now = Date.now();
    const basePrice = 95000;
    const data: BitcoinHistoricalData[] = [];

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const variance = (Math.random() - 0.5) * 4000;
      const trend = (days - i) * 50; // Slight upward trend
      const price = basePrice + variance + trend;
      data.push({ timestamp, price: Math.round(price * 100) / 100 });
    }

    return data;
  },

  getMockIntradayData(): BitcoinHistoricalData[] {
    const now = Date.now();
    const basePrice = 95000;
    const data: BitcoinHistoricalData[] = [];

    for (let i = 24; i >= 0; i--) {
      const timestamp = now - i * 60 * 60 * 1000;
      const variance = (Math.random() - 0.5) * 1000;
      const price = basePrice + variance;
      data.push({ timestamp, price: Math.round(price * 100) / 100 });
    }

    return data;
  },
};

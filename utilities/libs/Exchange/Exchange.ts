import ccxt from 'ccxt';
import moment from 'moment';

export interface ExchangeConfig {
  name: string;
  key?: string;
  secret?: string;
}

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Exchange class
 * @export
 * @class Exchange
 */
export class Exchange {
  exchange: ccxt.Exchange;
  private marketsInfo: ccxt.Market[];

  constructor(public config: ExchangeConfig) {
    this.exchange = <ccxt.Exchange>new (<any>ccxt)[this.config.name]({
      apiKey: this.config.key || '',
      secret: this.config.secret || '',
      timeout: 30000,
      enableRateLimit: true,
    });
  }

  /**
   * Get exchange info for a given symbol
   * @param {string} symbol
   * @returns {Promise<Market>}
   * @memberof Exchange
   */
  public async getExchangeInfo(
    symbol: string
  ): Promise<ccxt.Market | undefined> {
    if (!this.marketsInfo)
      this.marketsInfo = await this.exchange.fetchMarkets();
    const markets = this.marketsInfo.filter(market => market.symbol === symbol);
    if (markets.length !== 1) return undefined;
    return markets[0];
  }

  /**
   * Fetch candle history
   * @param {string} symbol (BTC/USDT, ETH/BTC, ...)
   * @param {{ limit: number; since?: number }} opts
   *           limit: number of candle to fetch since the given timestamp
   * @returns {Promise<OHLCV[]>}
   * @memberof Exchange
   */
  public async getCandles(
    symbol: string,
    opts: { limit: number; since?: number }
  ): Promise<OHLCV[]> {
    const limit = opts.limit || 1;
    const since =
      opts.since || moment().subtract(limit, 'm').toDate().getTime();
    return await this.exchange
      .fetchOHLCV(symbol, '1m', since, limit)
      .then(candles =>
        candles.map<OHLCV>(([T, O, H, L, C, V]) => ({
          time: T,
          open: O,
          high: H,
          low: L,
          close: C,
          volume: V,
        }))
      )
      .catch(error => {
        throw new Error(
          `[Exchange] ${this.config.name} doesn't have fetchOHLCV method`
        );
      });
  }
}

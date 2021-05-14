import moment from 'moment';
import { sleep } from '../../../helpers';
import { IWatcherConfig, Watcher } from '../base';
import { Exchange, OHLCV } from '../../../Exchange/Exchange';
import { logger } from '../../../../logger';

export interface IMarketWatcherConfig extends IWatcherConfig {
  exchange: string;
  base: string;
  quote: string;
  extra?: {
    refreshInterval?: number;
    maxHistory?: string;
  };
}

/**
 * Market watcher class
 * Monitor the specified market:
 *    - get OHLC data and write it to InfluxDB
 * @extends {Watcher}
 */
export class MarketWatcher extends Watcher {
  public symbol: string;
  public conf: IMarketWatcherConfig;
  private exchange: Exchange;
  private shouldStop: boolean = false;
  private interval: { id: NodeJS.Timeout | undefined } = { id: undefined };

  constructor(conf: IMarketWatcherConfig) {
    super(conf);
    this.conf = Object.assign(
      {
        type: 'MarketWatcher',
        extra: {
          refreshInterval: 100000,
          maxHistory: '2018-01-01T00:00:00Z',
        },
      },
      conf
    );
    this.checkConfig(this.conf);

    // TODO: validation check chars case
    this.symbol = `${this.conf.base}/${this.conf.quote}`;
    this.exchange = new Exchange({ name: this.conf.exchange });
  }

  public async init(): Promise<void> {
    if (!(await this.exchange.getExchangeInfo(this.symbol))) {
      throw new Error(
        `[WATCHER] symbol ${this.symbol} doesn't exist on ${this.conf.exchange}`
      );
    }
  }

  /**
   * Run the watcher
   * @returns {Promise<void>}
   * @memberof MarketWatcher
   */
  public async runWatcher(): Promise<void> {
    logger.info(
      `[WATCHER] Watcher started on ${this.conf.exchange}: ${this.symbol}`
    );
    this.shouldStop = false;

    let discard: boolean = false; // flag to avoid writing new data (use to prevent corrupt data)
    let lastDataInserted: OHLCV | null = null;
    // Watcher running loop
    while (!this.shouldStop) {
      try {
        const data: OHLCV[] = await this.exchange.getCandles(this.symbol, {
          limit: 10,
        });
        if (!discard) {
          this.getInflux().writeOHLC(
            {
              base: this.conf.base,
              quote: this.conf.quote,
              exchange: this.conf.exchange,
            },
            data
          );
          lastDataInserted = data.slice(-1)[0];
        }
      } catch (error) {
        logger.error(error);
        throw new Error(
          `Error while running market watcher loop ${this.conf.exchange} (${this.symbol})`
        );
      }
      await sleep(this.conf.extra.refreshInterval, this.interval);
    }
  }

  /**
   * Stop the watcher
   *
   * @memberof MarketWatcher
   */
  public async stopWatcher(flushData: boolean): Promise<void> {
    logger.info(
      `[WATCHER] Watcher stopped on ${this.conf.exchange}: ${this.symbol}`
    );
    this.shouldStop = true;
    if (this.interval.id) {
      clearTimeout(this.interval.id);
      this.interval.id = undefined;
    }
    // TODO: if(flushData)
  }

  /**
   * Check if config allow the watcher creation
   * @private
   * @param {IMarketWatcherConfig} config
   * @memberof MarketWatcher
   */
  private checkConfig(conf: IMarketWatcherConfig) {
    // Can't create MarketWatcher with refreshInterval < 1 second
    if (conf.extra.refreshInterval < 1000) {
      throw new Error(
        '[WATCHER] Cannot create market watcher with refreshInterval < 1000 (1 seconde)'
      );
    }
  }
}

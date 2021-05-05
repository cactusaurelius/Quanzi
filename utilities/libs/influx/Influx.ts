import moment from 'moment';
import {
  InfluxDB,
  WriteApi,
  QueryApi,
  HttpError,
  Point,
  flux,
  FluxTableMetaData,
} from '@influxdata/influxdb-client';
import { BucketsAPI, OrgsAPI } from '@influxdata/influxdb-client-apis';
import { tagsToString } from './helpers';

import { OHLCV } from '../Exchange/Exchange';
import { MEASUREMENT_OHLC, MEASUREMENT_OHLC_FILLED } from './constants';

export class Influx {
  private influx: InfluxDB;
  private influxWrite: WriteApi;
  private influxQuery: QueryApi;
  private buckets: BucketsAPI;
  // config: any;

  constructor(
    public config = {
      org: process.env.INFLUX_ORG,
      url: process.env.INFLUX_URL,
      token: process.env.INFLUX_TOKEN,
      bucket: process.env.INFLUX_BUCKET,
      events_bucket: process.env.INFLUX_BUCKET_EVENTS,
    }
  ) {
    this.config = config;
    this.influx = new InfluxDB({
      url: this.config.url,
      token: this.config.token,
    });
    this.influxWrite = this.influx.getWriteApi(
      this.config.org,
      this.config.bucket,
      'ms'
    );
    this.influxQuery = this.influx.getQueryApi(this.config.org);
    this.buckets = new BucketsAPI(this.influx);
  }

  public async init() {
    try {
      await this.upsertBucket(this.config.bucket);
      await this.upsertBucket(this.config.events_bucket);
      console.log(`[INFLUXDB] Connection successful: ${this.config.url}`);
    } catch (error) {
      console.log(new Error(`[INFLUXDB] Connection error: ${this.config.url}`));
      throw error;
    }
  }

  /**
   * Write OHLCV points to influxdb
   * @param {{symbol: string}} tags Tag of the serie (currently just the symbol, maybe more later)
   * @param {OHLCV[]} data
   * @memberof Influx
   */
  public writeOHLC(
    tags: { base: string; quote: string; exchange: string },
    data: OHLCV[],
    measurement = 'OHLCV'
  ): void {
    this.influxWrite.writePoints(
      data.map(({ time, ...ohlcv }) => {
        const point = new Point(measurement);
        Object.entries(tags).map(tag => point.tag(...tag));
        Object.entries(ohlcv).map(ent => point.floatField(...ent));
        point.timestamp(moment(time).toDate().getTime());
        return point;
      })
    );
  }

  /**
   * Get OHLC from influx db group by the specified aggregation time (minutes by default)
   *
   * @param {{ symbol: string }} tags
   * @param {string} [aggregatedTime='1m'] // influxdb units: s(seconds), m (minutes), d (days)
   * @memberof Influx
   */
  public async getOHLC(
    tags: { base: string; quote: string; exchange: string },
    aggregatedTime: string = '1m'
  ) {}

  /**
   * Create bucket if it doesn't exist
   *
   * @private
   * @param {string} name
   * @memberof Influx
   */
  private async upsertBucket(name: string) {
    const { org } = this.config;
    const orgsAPI = new OrgsAPI(this.influx);
    const organizations = await orgsAPI.getOrgs({ org });
    if (!organizations || !organizations.orgs || !organizations.orgs.length) {
      throw `No organization named "${org}" found!`;
    }
    const orgID = organizations.orgs[0].id;
    try {
      const buckets = await this.buckets.getBuckets({ orgID, name });
      if (buckets && buckets.buckets && buckets.buckets.length) {
        console.log(`Bucket named "${name}" already exists"`);
      }
    } catch (e) {
      if (e instanceof HttpError && e.statusCode == 404) {
      } else {
        throw e;
      }
    }
    const bucket = await this.buckets.postBuckets({
      body: {
        orgID,
        name,
        retentionRules: [
          {
            type: 'expire',
            everySeconds: 10000000,
          },
        ],
      },
    });
    return bucket;
  }
}

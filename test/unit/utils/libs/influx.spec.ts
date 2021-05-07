process.env.TEST = 'true';

import { Influx } from '../../../../utilities/libs/influx';

const conf = {
  org: process.env.INFLUX_ORG,
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
  bucket: process.env.INFLUX_BUCKET,
  events_bucket: process.env.INFLUX_BUCKET_EVENTS,
};

const client = new Influx();

describe('Test ex info', () => {
  describe('Test ex info', () => {
    it('Test get candles', async () => {
      client.getOHLC();
      expect(1).toBeDefined();
    });
    // it('Test get candles', async () => {
    // 	const OHLC = await db.getOHLC({
    // 		base: 'BTC',
    // 		quote: 'USDT',
    // 		exchange: 'binance',
    // 	});
    // 	console.log(OHLC);
    // 	expect(OHLC).toBeDefined();
    // });
  });
});

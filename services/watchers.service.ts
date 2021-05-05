import { Service as DService, Action, Method } from 'moleculer-decorators';
import { Service, Errors, Context } from 'moleculer';
import { Watchers } from '../utilities/libs/Watchers/Watchers';
import { Influx } from '../utilities/libs/Influx';
const { MoleculerError } = Errors;

Watchers.influx = new Influx({
  org: process.env.INFLUX_ORG,
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
  bucket: process.env.INFLUX_BUCKET,
  events_bucket: process.env.INFLUX_BUCKET_EVENTS,
});

@DService({
  name: 'watchers',
  settings: { rest: '/watchers' },
})
export default class WatchersService extends Service {
  /**
   * Create A New Watcher
   * @returns { id }
   */
  @Action({
    params: {
      type: { type: 'string', optional: false },
      base: { type: 'string', optional: false },
      quote: { type: 'string', optional: false },
      exchange: { type: 'string', optional: false },
      extra: { type: 'object', optional: true },
    },
  })
  createWatcher(
    ctx: Context<{
      type: string;
      base: string;
      quote: string;
      exchange: string;
      extra: any;
    }>
  ) {
    return Watchers.createWatcher({ watcherConfig: ctx.params });
  }

  /**
   * Get All Registered Watchers
   * @returns { Watcher[] }
   */
  @Action()
  getWatchers() {
    return Watchers.getWatchers();
  }

  /**
   * Restarts All Registered Watchers
   */
  @Action()
  restartWatchers() {
    return Watchers.restartAllWatchers();
  }

  /**
   * Stops All Registered Watchers
   */
  @Action()
  stopWatchers() {
    return Watchers.stopAllWatchers();
  }

  /**
   * Deletes All Registered Watchers
   */
  @Action()
  deleteWatchers() {
    return Watchers.deleteWatchers();
  }

  /**
   * Starts A Watcher
   * @param { id:string }
   * @returns { msg:string }
   */
  @Action({
    params: { id: { type: 'string', optional: false } },
  })
  startWatcher(ctx: Context<{ id: string }>) {
    const { id } = ctx.params;
    return Watchers.startWatcher({ id });
  }

  /**
   * Stops A Watcher
   * @param { id:string }
   */
  @Action({
    params: { id: { type: 'string', optional: false } },
  })
  stopWatcher(ctx: Context<{ id: string }>) {
    const { id } = ctx.params;
    return Watchers.stopWatcher({ id });
  }

  /**
   * Get A Watcher
   * @param { id:string }
   * @returns { watcher:IWatcherConfig }
   */
  @Action({
    params: { id: { type: 'string', optional: false } },
  })
  getWatcher(ctx: Context<{ id: string }>) {
    const { id } = ctx.params;
    return Watchers.getWatcher({ id });
  }

  /**
   * Stops A Watcher
   * @param { id:string }
   */
  @Action({
    params: {
      id: { type: 'string', optional: false },
      flush: { type: 'boolean', optional: true },
    },
  })
  deleteWatcher(ctx: Context<{ id: string; flush: boolean }>) {
    const { id, flush = false } = ctx.params;
    return Watchers.deleteWatcher({ id, flush });
  }
}

import {
	IWatcherConfig,
	Watcher,
	watcherClasses,
	WatcherModel,
	IWatcherModel,
} from './Watcher';
import {
	restartWatchers,
	watcherConfigurationExist,
	stopWatchers,
} from './helpers';
import {Influx} from '../influx';
const MEASUREMENT_OHLC = 'OHLC';

/**
 * Handle endpoints to manage multiple watchers
 *
 * @export
 * @class Watchers
 */
export class Watchers {
	public static runningWatchers: Watcher[] = [];
	public static influx: Influx;

  public static async createWatcher({
    watcherConfig,
  }: {
    watcherConfig: IWatcherConfig;
  }): Promise<{ id: string } | string> {
    try {
      if (watcherConfig.id) {
        return 'Cannot create a new watcher with an id';
      }

      if (!(<any>watcherClasses)[watcherConfig.type]) {
        return `Watcher type ${watcherConfig.type} doesn't exists`;
      }

      if (await watcherConfigurationExist(watcherConfig)) {
        return `Watcher configuration already exist`;
      }

      const watcher: Watcher = new (<any>watcherClasses)[watcherConfig.type](
        watcherConfig
      );

      try {
        await watcher.init();
      } catch (error) {
        return error;
      }
      watcher.setInflux(this.influx);
      watcher.run().catch(error => {
        throw error;
      });

      Watchers.runningWatchers.push(watcher);
      return { id: watcher.id };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

}

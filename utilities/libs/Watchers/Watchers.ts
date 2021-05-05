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
import { Influx } from '../influx';
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
  /**
   * Restart every watcher
   *
   * @static
   * @param {Request} request
   * @returns {Promise<any>}
   * @memberof Watchers
   */
  public static async restartAllWatchers(): Promise<any> {
    try {
      await restartWatchers(this.influx);
      return { msg: 'Watcher Started' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async stopAllWatchers(): Promise<any> {
    try {
      await stopWatchers();
      return { msg: 'Watcher Stopped' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async getWatchers(): Promise<IWatcherConfig[]> {
    try {
      const watchers: IWatcherModel[] = await WatcherModel.find();
      return watchers.map((w: any) => <IWatcherConfig>w._doc);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async deleteWatchers(): Promise<any> {
    try {
      for (const watcher of Watchers.runningWatchers) {
        await watcher.stop();
      }
      await WatcherModel.collection.drop();
      Watchers.runningWatchers = [];
      return { msg: 'Watcher Deleted' };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async getWatcher({
    id,
  }: {
    id: string;
  }): Promise<IWatcherConfig> {
    try {
      const watcher = await WatcherModel.findOne({ id });
      if (!watcher) {
        throw `Watcher ${id} not found`;
      }
      return watcher;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

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

  public static async startWatcher({ id }: { id: string }): Promise<any> {
    try {
      const running = Watchers.runningWatchers.find(w => w.id === id);
      if (running) return { msg: 'Watcher already running' };
      const watcher = await WatcherModel.findOne({ id });
      if (!watcher) return `Watcher ${id} not found`;

      const instance = <Watcher>(
        new (<any>watcherClasses)[watcher.type]((<any>watcher)._doc)
      );
      await instance.init();
      instance.setInflux(this.influx);
      instance.run().catch(error => {
        throw error;
      });

      Watchers.runningWatchers.push(instance);
      return { msg: `Watcher ${id} started` };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public static async stopWatcher({ id }: { id: string }): Promise<any> {
    try {
      const running = Watchers.runningWatchers.find(w => w.id === id);
      if (running) {
        await running.stop();
        const runningIdx = Watchers.runningWatchers
          .map(w => w.id)
          .indexOf(running.id);
        Watchers.runningWatchers.splice(runningIdx, 1);
      }
      return { msg: `Watcher ${id} stopped` };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  public static async deleteWatcher({
    id,
    flush,
  }: {
    id: string;
    flush: boolean;
  }): Promise<any> {
    try {
      const running = Watchers.runningWatchers.find(w => w.id === id);
      if (running) {
        await running.stop(Boolean(flush) === true ? true : false);
        const runningIdx = Watchers.runningWatchers
          .map(w => w.id)
          .indexOf(running.id);
        Watchers.runningWatchers.splice(runningIdx, 1);
      }
      await WatcherModel.findOneAndDelete({ id });
      return { msg: `Watcher ${id} stopped` };
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}

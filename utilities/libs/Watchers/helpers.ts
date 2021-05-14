import { Influx } from '../influx';
import { Watcher, watcherClasses } from './Watcher';
import { Watchers } from './Watchers';

/**
 * Restart every watcher stored in mongodb
 * @export
 * @param {Influx} influx
 * @returns {Promise<any>}
 */
export async function restartWatchers(influx: Influx): Promise<any> {
  let instance: Watcher | null = null;
  return await Watchers.getWatchers()
    .then(async watchers => {
      for (const watcher of watchers) {
        if (!Watchers.runningWatchers.find(w => w.id === watcher.id)) {
          // Create and configure the watcher
          instance = <Watcher>(
            new (<any>watcherClasses)[watcher.type]({ ...watcher })
          );
          await instance.init();
          instance.setInflux(influx);
          instance.run().catch(error => {
            throw error;
          });
          // Push the watcher instance in the array of running watchers
          Watchers.runningWatchers.push(instance);
        }
      }
      return '';
    })
    .catch(error => {
      if (instance && Watchers.runningWatchers.indexOf(instance) > -1) {
        Watchers.runningWatchers.splice(
          Watchers.runningWatchers.indexOf(instance),
          1
        );
      }
      console.error(error);
      throw new Error('Error while restarting watchers');
    });
}

/**
 * Stop watchers
 * @export
 * @returns {Promise<any>}
 */
export async function stopWatchers(): Promise<any> {
  try {
    Watchers.runningWatchers.forEach(watcher => watcher.stop());
    Watchers.runningWatchers = [];
  } catch (error) {
    console.error(error);
    throw new Error('Error while stopping watchers');
  }
}

/**
 * Check if the given watcher configuration already exist in mongodb
 * @export
 * @param {*} config
 * @returns
 */
export async function watcherConfigurationExist(config: any) {
  const watchers: any[] = await Watchers.getWatchers();
  const keys: string[] = Object.keys(config);
  if (keys.indexOf('extra') !== -1) {
    keys.splice(keys.indexOf('extra'), 1);
  }
  for (const watcher of watchers) {
    let sameKeys = 0;
    keys.forEach(key => (watcher[key] === config[key] ? sameKeys++ : sameKeys));
    if (sameKeys === keys.length) return true;
  }
  return false;
}

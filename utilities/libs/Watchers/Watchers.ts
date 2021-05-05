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
}

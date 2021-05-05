import { Schema, model, Document } from 'mongoose';

const WatcherSchema = new Schema<IWatcherModel>(
  {
    id: String,
    type: String,
    status: String,
  },
  { strict: false }
);

export interface IWatcherModel extends Document {
  id?: string;
  type: string;
  status: string;
}

export const WatcherModel = model<IWatcherModel>('Watcher', WatcherSchema);

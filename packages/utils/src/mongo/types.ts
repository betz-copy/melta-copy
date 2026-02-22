import { CallbackError, Require_id } from 'mongoose';

export type leanOf<T> = Require_id<T>;

export type MongoError = CallbackError & { code?: number; name?: string };

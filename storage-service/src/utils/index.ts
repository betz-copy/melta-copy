import { pipeline } from 'stream';
import { promisify } from 'util';

export * from './rabbit';

export const promisePipe = promisify(pipeline);

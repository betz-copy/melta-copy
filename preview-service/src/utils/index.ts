import { pipeline } from 'stream';
import { promisify } from 'util';

export const promisePipe = promisify(pipeline);

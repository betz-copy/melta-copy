/* eslint-disable import/prefer-default-export */
import { pipeline } from 'stream';
import { promisify } from 'util';

export const promisePipe = promisify(pipeline);

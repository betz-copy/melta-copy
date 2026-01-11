import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

const promisePipe = promisify(pipeline);

export default promisePipe;

import { pipeline } from 'stream';
import { promisify } from 'util';

const promisePipe = promisify(pipeline);

export default promisePipe;

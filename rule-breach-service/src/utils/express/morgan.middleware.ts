import * as morgan from 'morgan';
import logger from '../logger/logsLogger';

const stream: morgan.StreamOptions = { write: (message) => logger.info(message) };
const morganMiddleware = morgan('combined', { stream });

export default morganMiddleware;

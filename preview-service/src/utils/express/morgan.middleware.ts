import * as morgan from 'morgan';
import logger from '../logger';

const stream: morgan.StreamOptions = { write: (message) => logger.info(message) };
const morganMiddleware = morgan('combined', { stream });

export default morganMiddleware;

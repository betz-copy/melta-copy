import morgan, { StreamOptions } from 'morgan';
import logger from '../logger';

const stream: StreamOptions = { write: (message) => logger.info(message) };
const morganMiddleware = morgan('combined', { stream });

export default morganMiddleware;

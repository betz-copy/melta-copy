import morgan, { StreamOptions } from 'morgan';
import logger from '../logger';

const stream: StreamOptions = {
    // Use the http severity
    write: (message) => logger.info(message),
};

// const skip = () => {
// const env = process.env.NODE_ENV || 'development';
// logger.info(`aaaaaaaaaaaaaaaaaaaaaaa: ${env !== 'development'}`);
// return env !== 'development';
// };

const morganMiddleware = morgan('combined', { stream });

export default morganMiddleware;

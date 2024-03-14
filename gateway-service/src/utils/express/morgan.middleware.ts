import morgan, { StreamOptions } from 'morgan';
import logger from '../logger';
import config from '../../config';

const stream: StreamOptions = { write: (message) => logger.info(message) };
morgan.token('logging-id', (req) => req.headers['logging-id'] as string);
morgan.format('jsonFormat', (tokens: any, req: any, res) => {
    const logObject = {
        loggingId: tokens['logging-id'](req, res),
        userId: req?.user?.id,
        serviceName: config.logs.extraDefault.serviceName,
        request: req.path,
    };

    return JSON.stringify(logObject);
});
const morganMiddleware = morgan('jsonFormat', { stream });

export default morganMiddleware;

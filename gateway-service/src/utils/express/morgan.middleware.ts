import morgan, { StreamOptions } from 'morgan';
import logger from '../logger';
import config from '../../config';

const stream: StreamOptions = {
    write: (message) => {
        const logObject = JSON.parse(message);

        logger.info('morgan-log', logObject);
    },
};
morgan.format('jsonFormat', (_tokens: any, req: any, _res: any) => {
    const logObject = {
        userId: req?.user?.id,
        serviceName: config.logs.extraDefault.serviceName,
        request: req.path,
        method: req.method,
        data: req.body,
    };

    return JSON.stringify(logObject);
});
const morganMiddleware = morgan('jsonFormat', { stream });

export default morganMiddleware;

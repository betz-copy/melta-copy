import morgan, { StreamOptions } from 'morgan';
import logger from '../logger/logsLogger';

const stream: StreamOptions = {
    write: (message) => {
        const logObject = JSON.parse(message);

        logger.info('morgan-log', logObject);
    },
};
morgan.format('jsonFormat', (_tokens: any, req: any, _res: any) => {
    const logObject = {
        userId: req?.user?.id,
        path: req.path,
        method: req.method,
        body: req.body,
    };

    return JSON.stringify(logObject);
});
const morganMiddleware = morgan('jsonFormat', { stream });

export default morganMiddleware;

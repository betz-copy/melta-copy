import morgan, { StreamOptions } from 'morgan';
import logger from '../logger/logsLogger';

const stream: StreamOptions = {
    write: (message) => {
        const logObject = JSON.parse(message);

        logger.info('morgan-log', logObject);
    },
};
morgan.format('jsonFormat', (tokens: any, req: any, res: any) => {
    const logObject = {
        userId: req?.user?.id,
        path: req.path,
        method: req.method,
        body: req.body,
        status: tokens.status(req, res),
        responseTime: `${tokens['response-time'](req, res)} ms`,
        workspaceId: req.workspaceId,
        host: req.host,
    };

    return JSON.stringify(logObject);
});
const morganMiddleware = morgan('jsonFormat', { stream });

export default morganMiddleware;

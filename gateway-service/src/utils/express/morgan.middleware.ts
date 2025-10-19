import morgan, { StreamOptions } from 'morgan';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@microservices/shared';

const stream: StreamOptions = {
    write: (message) => {
        const logObject = JSON.parse(message);

        logger.info('morgan-log', logObject);
    },
};
morgan.format('jsonFormat', (tokens: any, req: any, res: any) => {
    const status = tokens.status(req, res);

    const logObject = {
        userId: req?.user?.id,
        path: req.path,
        method: req.method,
        body: req.body,
        status,
        responseTime: `${tokens['response-time'](req, res)} ms`,
        workspaceId: req.workspaceId,
        host: req.host,
    };

    if (status >= StatusCodes.OK && status < StatusCodes.BAD_REQUEST) return undefined;

    return JSON.stringify(logObject);
});
const morganMiddleware = morgan('jsonFormat', { stream });

export default morganMiddleware;

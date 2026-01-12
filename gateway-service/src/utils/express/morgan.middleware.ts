import { logger } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';
import morgan, { StreamOptions, TokenIndexer } from 'morgan';

const stream: StreamOptions = {
    write: (message) => {
        const logObject = JSON.parse(message);

        logger.info('morgan-log', logObject);
    },
};
// biome-ignore lint/suspicious/noExplicitAny: lol
morgan.format('jsonFormat', (tokens: TokenIndexer<Request, Response>, req: any, res: Response) => {
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

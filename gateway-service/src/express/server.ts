import http from 'http';
import { once } from 'events';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import { initPassport } from '../utils/express/passport';
import { errorMiddleware } from './error';
import appRouter from './router';
import morganMiddleware from '../utils/express/morgan.middleware';
import config from '../config';
// import dataLogger from '../utils/logger/dataLogger';

// const logRequestResponse = async (req: Request, res: Response, next: NextFunction) => {
//     // eslint-disable-next-line no-console
//     console.log('start logging middleware');

//     const allowedMethods = ['POST', 'DELETE', 'PUT', 'PATCH'];
//     if (allowedMethods.includes(req.method)) {
//         const originalSend = res.send.bind(res);
//         res.send = (body) => {
//             // eslint-disable-next-line no-console
//             console.log('permissions2', {
//                 userId: req.headers['user-id'],
//                 requestParams: req.params,
//                 requestQuery: req.query,
//                 requestURL: req.originalUrl,
//                 responseBody: body,
//                 action: req.method,
//             });

//             dataLogger.info('permissions2', {
//                 userId: req.headers['user-id'],
//                 requestParams: req.params,
//                 requestQuery: req.query,
//                 requestURL: req.originalUrl,
//                 responseBody: body,
//                 action: req.method,
//             });
//             return originalSend(body);
//         };
//     }
//     next();
// };

class Server {
    private app: express.Application;

    private http: http.Server;

    private port: number;

    constructor(port: number) {
        this.app = Server.createExpressApp();
        this.port = port;
    }

    static createExpressApp() {
        const app = express();

        app.use(helmet());
        app.use(express.json({ limit: config.service.maxRequestSize }));
        app.use(express.urlencoded({ extended: true, limit: config.service.maxRequestSize }));
        app.use(cookieParser());

        app.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
            res.status(200).send('alive');
        });

        app.use(passport.initialize());
        initPassport();

        app.use(morganMiddleware);

        app.use(appRouter);
        // app.use('/', (req, res, next) => {
        //     // eslint-disable-next-line no-console
        //     console.log('applyLoggingMiddlewareToRouter');

        //     logRequestResponse(req, res, next);
        // });

        app.use('*', (_req, res) => {
            res.status(404).send('Invalid Route');
        });

        app.use(errorMiddleware);

        return app;
    }

    async start() {
        this.http = this.app.listen(this.port);
        await once(this.http, 'listening');
    }
}

export default Server;

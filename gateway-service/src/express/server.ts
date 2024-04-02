import http from 'http';
import { once } from 'events';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import { initPassport } from '../utils/express/passport';
import { errorMiddleware } from './error';
import appRouter from './router';
import morganMiddleware from '../utils/express/morgan.middleware';
import config from '../config';

const loggerMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.headers['logging-id']) {
        req.headers['logging-id'] = uuidv4();
    }

    axios.defaults.headers.common = {
        'logging-id': req.headers['logging-id'] as string,
    };

    res.setHeader('logging-id', req.headers['logging-id']);

    next();
};

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
        app.use(loggerMiddleware);
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

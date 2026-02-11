import { once } from 'node:events';
import http from 'node:http';
import { errorMiddleware } from '@packages/utils';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import config from '../config';
import morganMiddleware from '../utils/express/morgan.middleware';
import { initPassport } from '../utils/express/passport';
import appRouter from './router';

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

        app.get(['/isAlive', '/isalive', '/health'], (_req, res) => {
            res.status(StatusCodes.OK).send('alive');
        });

        app.use(passport.initialize());
        initPassport();

        app.use(morganMiddleware);

        app.use(appRouter);

        appRouter.all(/(.*)/, (_req, res) => {
            res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
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

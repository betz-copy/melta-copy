import http from 'http';
import express from 'express';
import helmet from 'helmet';
import logger from 'morgan';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { once } from 'events';

import { initPassport } from '../utils/express/passport';
import { errorMiddleware } from './error';
import appRouter from './router';
import config from '../config';

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
        app.use(express.json({ limit: config.service.maxFileSize }));
        app.use(express.urlencoded({ extended: true, limit: config.service.maxFileSize }));
        app.use(cookieParser());

        app.use(logger('dev'));

        app.use(
            session({
                secret: config.authentication.sessionSecret,
                resave: false,
                saveUninitialized: true,
            }),
        );

        app.use(passport.initialize());
        app.use(passport.session());
        initPassport();

        app.use(appRouter);

        app.use(errorMiddleware);

        return app;
    }

    async start() {
        this.http = this.app.listen(this.port);
        await once(this.http, 'listening');
    }
}

export default Server;

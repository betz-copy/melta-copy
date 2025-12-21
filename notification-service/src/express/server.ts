import { errorMiddleware } from '@packages/utils';
import { once } from 'events';
import express from 'express';
import helmet from 'helmet';
import * as http from 'http';
import config from '../config';
import appRouter from './router';

class Server {
    private app: express.Application;

    private http: http.Server;

    private port: number;

    /* istanbul ignore next */
    constructor(port: number) {
        this.app = Server.createExpressApp();
        this.port = port;
    }

    static createExpressApp() {
        const app = express();

        app.use(helmet());
        app.use(express.json({ limit: config.service.maxRequestSize }));
        app.use(express.urlencoded({ extended: true, limit: config.service.maxRequestSize }));

        app.use(appRouter);

        app.use(errorMiddleware);

        return app;
    }

    /* istanbul ignore next */
    async start() {
        this.http = this.app.listen(this.port);
        await once(this.http, 'listening');
    }
}

export default Server;

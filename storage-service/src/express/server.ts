import * as http from 'http';
import express from 'express';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';

import { once } from 'events';
import { errorMiddleware } from '@microservices/shared';
import appRouter from './router';
import config from '../config';

class Server {
    private app: express.Application;

    private http: http.Server;

    constructor(private port: number) {
        this.app = this.createExpressApp();
    }

    createExpressApp() {
        const app = express();
        app.use(helmet());
        app.use(bodyParser.json({ limit: config.service.maxFileSize }));
        app.use(bodyParser.urlencoded({ extended: true, limit: config.service.maxFileSize }));

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

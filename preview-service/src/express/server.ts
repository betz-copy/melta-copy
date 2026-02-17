import { once } from 'node:events';
import * as http from 'node:http';
import { errorMiddleware } from '@packages/utils';
import * as bodyParser from 'body-parser';
import express from 'express';
import helmet from 'helmet';
import config from '../config';
import appRouter from './router';

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
        app.use(
            bodyParser.urlencoded({
                extended: true,
                limit: config.service.maxFileSize,
            }),
        );

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

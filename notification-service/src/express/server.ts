import * as http from 'http';
import * as express from 'express';
import * as helmet from 'helmet';

import { once } from 'events';
import { errorMiddleware } from './error';
import appRouter from './router';
import morganMiddleware from '../utils/express/morgan.middleware';
import config from '../config';

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

        app.use(morganMiddleware);
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

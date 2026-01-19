import { once } from 'node:events';
import http from 'node:http';
import { logger } from '@microservices/shared';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import appRouter from './router';

// Local error middleware to avoid type conflicts with shared library
const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    logger.error('Error:', { error: err });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: err.message || 'Internal server error',
    });
};

class Server {
    private app: express.Application;

    private http: http.Server | undefined;

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

        // Health check
        app.get(['/health', '/isAlive', '/isalive'], (_req: Request, res: Response) => {
            res.status(StatusCodes.OK).json({
                status: 'ok',
                model: config.openai.model,
                provider: config.openai.baseUrl ? 'Local/Custom' : 'OpenAI',
                apiConfigured: !!config.openai.apiKey,
            });
        });

        app.use(appRouter);

        // Catch-all for invalid routes
        app.all('*', (_req: Request, res: Response) => {
            res.status(StatusCodes.NOT_FOUND).send('Invalid Route');
        });

        app.use(errorMiddleware);

        return app;
    }

    async start() {
        this.http = this.app.listen(this.port);
        await once(this.http, 'listening');
        logger.info(`Server started on port: ${this.port}`);
    }
}

export default Server;

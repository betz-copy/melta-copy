import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import config from '../../config';

const {
    requestHeaders: { correlationIdHeader, contentLengthHeader },
} = config;

@Injectable()
class MorganInterceptor implements NestInterceptor {
    private readonly logger = new Logger(MorganInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl: url } = request;
        const now = Date.now();

        return next.handle().pipe(
            tap((res: Response) => {
                const response = context.switchToHttp().getResponse();
                const { statusCode } = response;
                const contentLength = response.get(contentLengthHeader);
                const correlationId = request.headers[correlationIdHeader] as string | undefined;
                const objectsNum = Array.isArray(res) ? res.length : 1;
                const toLog = {
                    method,
                    url,
                    statusCode,
                    objectsNum: `${objectsNum} objects`,
                    contentLength,
                    time: `${Date.now() - now}ms`,
                    correlationId,
                };

                this.logger.log(Object.values(toLog).filter(Boolean).join(' '));
            }),
            catchError((err) => {
                this.logger.error(`${method} ${url} - ${err}`);
                return throwError(() => err);
            }),
        );
    }
}

export default MorganInterceptor;

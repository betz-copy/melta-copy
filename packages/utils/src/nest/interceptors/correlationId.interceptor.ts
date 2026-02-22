import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import config from '../../config';

const { correlationIdHeader } = config.requestHeaders;

@Injectable()
class CorrelationIdInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const correlationId = (request.headers[correlationIdHeader] as string) || uuid();
        request.headers[correlationIdHeader] = correlationId;
        response.setHeader(correlationIdHeader, correlationId);

        return next.handle();
    }
}

export default CorrelationIdInterceptor;

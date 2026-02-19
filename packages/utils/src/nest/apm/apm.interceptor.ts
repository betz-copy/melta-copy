import { CallHandler, ExecutionContext, HttpException, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { APM_AGENT, type ApmAgent } from './apm.provider';

interface ApmRequest extends Request {
    payload?: {
        clientName?: string;
    };
    entityType?: string;
    destServiceUrl?: string;
    response?: {
        data?: {
            message?: string;
        };
        statusText?: string;
    };
}

@Injectable()
export class ApmInterceptor implements NestInterceptor {
    constructor(@Inject(APM_AGENT) private readonly apmAgent: ApmAgent) {}
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response> {
        const request = context.switchToHttp().getRequest<ApmRequest>();

        return next.handle().pipe(
            tap((_res: Response) => {
                if (this.apmAgent.isStarted()) this.setCommonLabels(request);
            }),
            catchError((err) => {
                if (this.apmAgent.isStarted()) {
                    const message =
                        err instanceof HttpException
                            ? err.message
                            : (err?.message ?? request.response?.data?.message ?? request.response?.statusText ?? 'Internal Server Error');
                    this.setCommonLabels(request);
                    this.apmAgent.setLabel('errorMessage', message);
                }
                return throwError(() => err);
            }),
        );
    }

    private setCommonLabels(request: ApmRequest): void {
        const clientName = request.payload?.clientName;
        this.apmAgent.setLabel('clientName', clientName);
        this.apmAgent.setLabel('entityType', request.entityType);
        this.apmAgent.setLabel('destServiceUrl', request.destServiceUrl);
    }
}

import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import config from '../../config';

const { workspaceIdHeader } = config.requestHeaders;

@Injectable()
export class WorkspaceInterceptor implements NestInterceptor {
    private readonly ignoredPaths: string[];

    constructor(
        private readonly cls: ClsService,
        ignoredPaths: string[] = [],
    ) {
        this.ignoredPaths = ignoredPaths;
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        if (this.isPublicPath(request)) return next.handle();

        this.getWorkspaceId(request, this.cls);

        return next.handle();
    }

    private isPublicPath(request: Request): boolean {
        return this.ignoredPaths.some((ignoredPath) => request.path === ignoredPath || (request.path as string).startsWith(`${ignoredPath}/`));
    }

    private getWorkspaceId(request: Request, cls: ClsService): void {
        const workspaceId = request.headers[workspaceIdHeader] as string | undefined;

        if (!workspaceId) {
            throw new BadRequestException('Workspace Id is required');
        }

        cls.set(workspaceIdHeader, workspaceId);
    }
}

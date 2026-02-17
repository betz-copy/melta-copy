import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
    RequestTimeoutException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError, ZodIssue } from 'zod';
import config from '../../config';

interface ValidationErrorDetail {
    field: string;
    message: string;
    code?: string;
    kind?: string;
}

interface DuplicateKeyDetail {
    field: string;
    value: unknown;
}

interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    details?: ValidationErrorDetail[] | DuplicateKeyDetail | Record<string, unknown>;
    timestamp: string;
    path: string;
    correlationId?: string;
}

class ErrorResponseBuilder {
    private errorResponse: ErrorResponse;

    constructor(path: string, correlationId?: string) {
        this.errorResponse = {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred',
            error: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path,
            correlationId,
        };
    }

    setStatusCode(statusCode: number): this {
        this.errorResponse.statusCode = statusCode;

        return this;
    }

    setMessage(message: string): this {
        this.errorResponse.message = message;

        return this;
    }

    setError(error: string): this {
        this.errorResponse.error = error;
        return this;
    }

    setDetails(details: ValidationErrorDetail[] | DuplicateKeyDetail | Record<string, unknown>): this {
        this.errorResponse.details = details;
        return this;
    }

    build(): ErrorResponse {
        return this.errorResponse;
    }
}

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const correlationId = request.headers[config.requestHeaders.correlationIdHeader] as string | undefined;
        const errorResponse = this.buildErrorResponse(exception, request.url, correlationId);

        this.logError(exception, errorResponse, request);

        response.status(errorResponse.statusCode).json(errorResponse);
    }

    private extractMessage(exceptionResponse: string | object): string {
        if (typeof exceptionResponse === 'string') return exceptionResponse;

        if ('message' in exceptionResponse)
            return Array.isArray(exceptionResponse.message) ? exceptionResponse.message.join(', ') : String(exceptionResponse.message);

        return 'An error occurred';
    }

    private buildErrorResponse(exception: unknown, path: string, correlationId?: string): ErrorResponse {
        const errorResponseBuilder = new ErrorResponseBuilder(path, correlationId);

        if (exception instanceof ZodValidationException || exception instanceof ZodError) {
            const zodError = exception instanceof ZodValidationException ? exception.getZodError() : exception;
            const issues = zodError instanceof ZodError ? zodError.issues : [];

            return errorResponseBuilder
                .setStatusCode(HttpStatus.BAD_REQUEST)
                .setMessage('Validation failed')
                .setError('Bad Request')
                .setDetails(
                    issues.map((err: ZodIssue) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                )
                .build();
        }

        if (exception instanceof MongooseError.ValidationError) {
            const details = Object.values(exception.errors).map((err) => ({
                field: err.path,
                message: err.message,
                kind: err.kind,
            }));

            return errorResponseBuilder
                .setStatusCode(HttpStatus.BAD_REQUEST)
                .setMessage('Validation failed')
                .setError('Bad Request')
                .setDetails(details)
                .build();
        }

        if (exception instanceof MongooseError.CastError) {
            return errorResponseBuilder
                .setStatusCode(HttpStatus.BAD_REQUEST)
                .setMessage(`Invalid ${exception.kind}: ${String(exception.value)}`)
                .setError('Bad Request')
                .build();
        }

        if (exception instanceof ServiceUnavailableException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message = this.extractMessage(exceptionResponse);

            return errorResponseBuilder
                .setStatusCode(status)
                .setMessage(Array.isArray(message) ? message.join(', ') : String(message))
                .setError(HttpStatus[status] || 'Service Unavailable')
                .build();
        }

        if (exception instanceof RequestTimeoutException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message = this.extractMessage(exceptionResponse);

            return errorResponseBuilder
                .setStatusCode(status)
                .setMessage(Array.isArray(message) ? message.join(', ') : String(message))
                .setError(HttpStatus[status] || 'Request Timeout')
                .build();
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message = this.extractMessage(exceptionResponse);

            return errorResponseBuilder
                .setStatusCode(status)
                .setMessage(Array.isArray(message) ? message.join(', ') : String(message))
                .setError(HttpStatus[status] || 'Error')
                .build();
        }

        if (this.isMongoServerError(exception) && exception.code === config.mongo.mongoDuplicateKeyErrorCode) {
            const keyValue = exception.keyValue || {};
            const field = Object.keys(keyValue)[0] || 'field';

            return errorResponseBuilder
                .setStatusCode(HttpStatus.CONFLICT)
                .setMessage(`Duplicate value for ${field}`)
                .setError('Conflict')
                .setDetails({ field, value: keyValue[field] })
                .build();
        }

        return errorResponseBuilder.build();
    }

    private isMongoServerError(error: unknown): error is { code: number; keyValue?: Record<string, unknown> } {
        return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'number';
    }

    private logError(exception: unknown, errorResponse: ErrorResponse, request: Request) {
        const logContext = {
            correlationId: errorResponse.correlationId,
            statusCode: errorResponse.statusCode,
            path: request.url,
            method: request.method,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
        };

        if (errorResponse.statusCode >= 500) {
            this.logger.error(
                `${request.method} ${request.url} - ${errorResponse.statusCode}`,
                exception instanceof Error ? exception.stack : String(exception),
                logContext,
            );
        } else {
            this.logger.warn(`${request.method} ${request.url} - ${errorResponse.statusCode}: ${errorResponse.message}`, logContext);
        }
    }
}

export default GlobalExceptionFilter;

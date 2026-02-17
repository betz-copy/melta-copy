import { Inject, Injectable, Scope } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
    private context: string = "Application";

    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly winston: Logger) {}

    public setContext(context: string) {
        this.context = context;
    }

    public log(message: string, meta?: Record<string, unknown>) {
        this.winston.info(message, { context: this.context, ...meta });
    }

    public info(message: string, meta?: Record<string, unknown>) {
        this.log(message, meta);
    }

    public error(message: string, trace?: string, meta?: Record<string, unknown>) {
        this.winston.error(message, {
            context: this.context,
            stack: trace,
            ...meta,
        });
    }

    public warn(message: string, meta?: Record<string, unknown>) {
        this.winston.warn(message, { context: this.context, ...meta });
    }

    public debug(message: string, meta?: Record<string, unknown>) {
        this.winston.debug(message, { context: this.context, ...meta });
    }

    public verbose(message: string, meta?: Record<string, unknown>) {
        this.winston.verbose(message, { context: this.context, ...meta });
    }
}

import 'winston-daily-rotate-file';
import { Logform, Logger, format } from 'winston';
import { config } from '../../config';
import initializeLogger, { IExtra, IPrintData } from './loggerFactory';

const { logs } = config;

type IWinstonFormat = Logform.Format;

const jsonReplacer = (_key, val) => (val instanceof Error ? { ...val, message: val.message, stack: val.stack } : val);

const customFormat: IWinstonFormat = format.combine(
    format.splat(),
    format.metadata({
        fillExcept: ['timestamp', 'level', 'message', 'metadata'],
    }),
    format.timestamp({
        format: logs.format,
    }),
    format.label({ label: 'logs' }),
    format.printf(({ timestamp, level, message, metadata }) => {
        const extra: IExtra = { ...logs.extraDefault };

        if (metadata.error instanceof Error) {
            // eslint-disable-next-line no-param-reassign
            metadata.error = Object.getOwnPropertyNames(metadata.error).reduce((acc, key) => {
                if (key !== 'stack') acc[key] = metadata.error[key];
                return acc;
            }, {} as Record<string, any>);
        }

        const printData: IPrintData = {
            timestamp,
            level,
            message: typeof message === 'object' ? { ...message } : message,
            extra,
            ...metadata,
        };

        return JSON.stringify(printData, jsonReplacer);
    }),
);

const logger: Logger = initializeLogger(logs.enableFile, true, logs.enableRotateFile, customFormat, logs.extraDefault.serviceName);

export default logger;

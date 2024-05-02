import 'winston-daily-rotate-file';
import { Logform, Logger, format } from 'winston';
import { config } from '../../config';
import initializeLogger, { IExtra, IPrintData } from './loggerFactory';

const { logs } = config;

type IWinstonFormat = Logform.Format;

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
        const printData: IPrintData = {
            timestamp,
            level,
            message: typeof message === 'object' ? { ...message } : message,
            extra,
            ...metadata,
        };

        return JSON.stringify(printData);
    }),
);

const logger: Logger = initializeLogger(logs.enableFile, true, logs.enableRotateFile, customFormat, logs.extraDefault.serviceName);

export default logger;

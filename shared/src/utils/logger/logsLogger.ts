import 'winston-daily-rotate-file';
import { Logform, Logger, format } from 'winston';

import config from '../../config';
import initializeLogger, { IExtra, IPrintData } from './loggerFactory';

const { logs } = config;

type IWinstonFormat = Logform.Format;

const jsonReplacer = (_key, val) => (val instanceof Error ? { ...val, message: val.message, stack: val.stack } : val);

const consoleFormat: IWinstonFormat = format.combine(
    format.splat(),
    format.metadata({
        fillExcept: ['timestamp', 'level', 'message', 'metadata'],
    }),
    format.timestamp(),
    format.printf(({ timestamp, level, message, metadata = {} }) => {
        const messageToPrint = typeof message === 'object' ? JSON.stringify(message, jsonReplacer, 2) : message;
        const metadataToPrint = JSON.stringify(metadata, jsonReplacer, 2);
        const infoPrefix = `(${logs.extraDefault.environment.toUpperCase()}) ${timestamp} [${level.toUpperCase()}]`;

        return `${infoPrefix}: message - ${messageToPrint}, data - ${metadataToPrint}`;
    }),
);

const customFormat: IWinstonFormat = format.combine(
    format.splat(),
    format.metadata({
        fillExcept: ['timestamp', 'level', 'message', 'metadata'],
    }),
    format.timestamp({
        format: logs.format,
    }),
    format.label({ label: 'logs' }),
    format.printf(({ timestamp, level, message, metadata = {} }: any) => {
        const extra: IExtra = { ...logs.extraDefault };

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

const logger: Logger = initializeLogger(logs.enableFile, true, logs.enableRotateFile, customFormat, consoleFormat, logs.extraDefault.serviceName);

export default logger;

import { Logger, format } from 'winston';
import config from '../../config';
import initializeLogger, { IExtra } from './loggerFactory';

const { logs } = config;

const customFormat = format.combine(
    format.label({ label: 'entities' }),
    format.splat(),
    format.metadata({
        fillExcept: ['timestamp', 'level', 'message', 'metadata'],
    }),
    format.timestamp({
        format: logs.format,
    }),
    format.printf(({ timestamp, level, message, metadata }) => {
        const extra: IExtra = { ...logs.extraDefault };
        return JSON.stringify({ timestamp, level, extra, message, ...metadata });
    }),
);

const dataLogger: Logger = initializeLogger(logs.enableFile, false, logs.enableRotateFile, customFormat, 'entities');

export default dataLogger;

import { Logger, format } from 'winston';
import { config } from '../../config';
import initializeLogger from './loggerFactory';

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
        return JSON.stringify({ timestamp, level, ...logs.extraDefault, message, ...metadata });
    }),
);

const dataLogger: Logger = initializeLogger(logs.enableFile, false, logs.enableRotateFile, customFormat, 'entities');

export default dataLogger;

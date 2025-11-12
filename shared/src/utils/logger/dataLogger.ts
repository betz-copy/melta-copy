import { format, Logger } from 'winston';
import config from '../../config';
import initializeLogger, { IExtra } from './loggerFactory';

const { logs } = config;

const jsonReplacer = (_key, val) => (val instanceof Error ? { ...val, message: val.message, stack: val.stack } : val);

const customFormat = format.combine(
    format.label({ label: 'crud' }),
    format.splat(),
    format.metadata({
        fillExcept: ['timestamp', 'level', 'message', 'metadata'],
    }),
    format.timestamp({
        format: logs.format,
    }),
    format.printf(({ timestamp, level, message, metadata }) => {
        const extra: IExtra = { ...logs.extraDefault };
        return JSON.stringify({ timestamp, level, extra, message, ...(typeof metadata === 'object' ? metadata : {}) }, jsonReplacer);
    }),
);

const dataLogger: Logger = initializeLogger(logs.enableFile, false, logs.enableRotateFile, customFormat, customFormat, 'crud');

export default dataLogger;

import 'winston-daily-rotate-file';
import { Logform, Logger, format } from 'winston';
import config from '../../config';
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
        let printData: IPrintData;

        if (typeof message === 'object') printData = { timestamp, level, extra, ...message, ...metadata };
        else printData = { timestamp, level, extra, message, ...metadata };

        return JSON.stringify(printData);
    }),
);

const logger: Logger = initializeLogger(logs.enableFile, true, logs.enableRotateFile, customFormat, logs.extraDefault.serviceName);

export default logger;

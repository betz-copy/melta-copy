import 'winston-daily-rotate-file';
import { Logform, Logger, createLogger, format, transport, transports } from 'winston';
import config from '../config';

const { logs } = config;

type IWinstonFormat = Logform.Format;

interface IPrintData {
    timestamp: string;
    level: string;
    message: string;
    extra: object;
}

interface IExtra {
    serviceName: string;
    environment: string;
}

const initializeLogger = () => {
    const customFormat: IWinstonFormat = format.combine(
        format.splat(),
        format.metadata({
            fillExcept: ['timestamp', 'level', 'message', 'metadata'],
        }),
        format.timestamp({
            format: logs.format,
        }),
        format.printf(({ timestamp, level, message, metadata }) => {
            const extra: IExtra = { ...logs.extraDefault };
            let printData: IPrintData;

            if (typeof message === 'object') printData = { timestamp, level, extra, ...message, ...metadata };
            else printData = { timestamp, level, extra, message, ...metadata };

            return JSON.stringify(printData);
        }),
    );

    const transportsList: transport[] = [
        new transports.Console({
            format: customFormat,
        }),
    ];

    if (logs.enableFile) {
        const fileTransportSettings = { ...logs.fileSettings, format: customFormat };
        const fileTransport = new transports.File(fileTransportSettings);
        transportsList.push(fileTransport);
    }

    if (logs.enableRotateFile) {
        const fileRotateTransport = new transports.DailyRotateFile({
            ...logs.fileRotateSettings,
            filename: `${logs.extraDefault.serviceName}-%DATE%.log`,
            format: customFormat,
        });
        transportsList.push(fileRotateTransport);
    }

    const logger = createLogger({
        format: customFormat,
        transports: transportsList,
        exitOnError: false,
    });

    return logger;
};

const logger: Logger = initializeLogger();

export default logger;

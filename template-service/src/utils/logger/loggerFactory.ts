import 'winston-daily-rotate-file';
import { Logform, createLogger, Logger, transport, transports } from 'winston';
import config from '../../config';

const { logs } = config;

type IWinstonFormat = Logform.Format;

export interface IExtra {
    serviceName: string;
    environment: string;
}

export interface IPrintData {
    timestamp: string;
    level: string;
    message: string;
    extra: IExtra;
}

const initializeLogger = (
    enableFile: boolean,
    enableConsole: boolean,
    enableRotateFile: boolean,
    customFormat: IWinstonFormat,
    label: string,
): Logger => {
    const transportsList: transport[] = [];

    if (enableConsole)
        transportsList.push(
            new transports.Console({
                format: customFormat,
            }),
        );

    if (enableFile) {
        const fileTransportSettings = { ...logs.fileSettings, format: customFormat };
        const fileTransport = new transports.File(fileTransportSettings);
        transportsList.push(fileTransport);
    }

    if (enableRotateFile) {
        const fileRotateTransport = new transports.DailyRotateFile({
            ...logs.fileRotateSettings,
            filename: `${label}-%DATE%.log`,
            format: customFormat,
        });
        transportsList.push(fileRotateTransport);
    }

    return createLogger({
        format: customFormat,
        transports: transportsList,
        exitOnError: false,
    });
};

export default initializeLogger;

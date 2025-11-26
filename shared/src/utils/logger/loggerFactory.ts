import 'winston-daily-rotate-file';
import { createLogger, Logform, Logger, transport, transports } from 'winston';

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
    consoleFormat: IWinstonFormat,
    label: string,
): Logger => {
    const transportsList: transport[] = [];

    if (enableConsole) {
        try {
            const consoleTransport = new transports.Console({
                format: consoleFormat,
            });

            transportsList.push(consoleTransport);
        } catch (error) {
            console.error(`Error while initializing console transport: ${error}`);
        }
    }

    if (enableFile) {
        try {
            const fileTransportSettings = { ...logs.fileSettings, format: customFormat };
            const fileTransport = new transports.File(fileTransportSettings);

            transportsList.push(fileTransport);
        } catch (error) {
            console.error(`Error while initializing file transport: ${error}`);
        }
    }

    if (enableRotateFile) {
        try {
            const fileRotateTransport = new transports.DailyRotateFile({
                ...logs.fileRotateSettings,
                filename: `${label}-%DATE%.log`,
                format: customFormat,
            });

            transportsList.push(fileRotateTransport);
        } catch (error) {
            console.error(`Error while initializing rotate file transport: ${error}`);
        }
    }

    return createLogger({
        format: customFormat,
        transports: transportsList,
        exitOnError: false,
    });
};

export default initializeLogger;

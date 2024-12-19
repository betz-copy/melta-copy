import { Client, FileInfo } from 'basic-ftp';
import config from '../config';
import { splitExtension } from './fs';
import { IFileData, IFolderData } from './interface';

const {
    remoteFolder: {
        ftp: { host, password, port, user, secure },
    },
} = config;

export const connectToFtp = (client: Client) => {
    return client.access({
        host,
        password,
        port,
        user,
        secure,
    });
};

const getFileAge = (fileDate: string): number => {
    const fileDateFormat = new Date(fileDate);
    fileDateFormat.setFullYear(new Date().getFullYear());
    const age = Date.now() - fileDateFormat.getTime();

    return age;
};

export const getRemoteFileData = (files: FileInfo[]): (IFileData | IFolderData)[] => {
    return files.flatMap(({ isFile, name, rawModifiedAt }) => {
        const age = getFileAge(rawModifiedAt);

        if (isFile) {
            const { ext, fileWithoutExtension } = splitExtension(name);
            return { ext, fileWithoutExtension, age, name };
        }

        return { age, name };
    });
};

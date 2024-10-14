import { environment } from '../globals';

export const getFileName = (fileId: string) => {
    return fileId.slice(environment.staticConfigs.fileIdLength);
};

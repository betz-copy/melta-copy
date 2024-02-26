import { environment } from '../globals';

export const getFileName = (fileId: string) => {
    console.log(fileId);
    return fileId.slice(environment.fileIdLength);
};

import { environment } from '../globals';

export const getFileName = (fileId: string) => {
    return fileId.slice(environment.fileIdLength);
};

export const getFilesName = (files: string): string => {
    const filesArr: string[] = files.split(',');

    return filesArr.map((file) => file.slice(environment.fileIdLength + 1, -1)).join(', ');
};

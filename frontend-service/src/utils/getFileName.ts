import { environment } from '../globals';

export const getFileName = (fileId: string) => {
    return fileId.slice(environment.fileIdLength);
};

export const getFilesName = (files: string): string => {
    if (!files) return ' ';

    const fileNames: string[] = files
        .split(',')
        .map((file) => file.trim().slice(environment.fileIdLength + 1, -1))
        .filter(Boolean);

    return fileNames.join(', ');
};

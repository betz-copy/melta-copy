import fsExtra from 'fs-extra';
import fs from 'fs/promises';
import path from 'path';
import { Dirent } from 'fs';
import { IFileData } from './interface';

export const emptyLocalFolder = async (folderPath: string): Promise<void> => {
    try {
        await fsExtra.emptyDir(folderPath);
        console.log(`Successfully removed folder contents ${folderPath}`);
    } catch (error) {
        console.error('Error removing file', { error });
    }
};

export const splitExtension = (fileName: string) => {
    const splittedFileName = fileName.split('.');
    const ext = splittedFileName.pop();

    return { fileWithoutExtension: splittedFileName.join('.'), ext };
};

export const getLocalFileData = async (files: Dirent[], folderPath: string): Promise<IFileData[]> => {
    const filesArray = await Promise.all(
        files.map(async (f) => {
            const filePath = path.join(folderPath, f.name);
            const fileStats = await fs.stat(filePath);
            const age = new Date().getTime() - fileStats.mtime.getTime();

            if (!f.isFile()) {
                return { age, name: f.name };
            }

            const { ext, fileWithoutExtension } = splitExtension(f.name);

            return { ext, fileWithoutExtension, age, name: f.name };
        }),
    );

    return filesArray;
};

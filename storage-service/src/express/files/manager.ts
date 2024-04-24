/* eslint-disable class-methods-use-this */
import { generatePath } from '../../utils/generatePath';
import DefaultManagerMinio from '../../utils/minio/manager';

export class FilesManager extends DefaultManagerMinio {
    uploadFile(file?: Express.Multer.File) {
        return file;
    }

    uploadFiles(files?: Express.Multer.File[]) {
        return files;
    }

    async downloadFile(path: string) {
        return this.minioClient.downloadFileStream(path);
    }

    async listFiles() {
        return this.minioClient.getFilesList(true);
    }

    async fileStat(filePath: string) {
        return this.minioClient.statFile(filePath);
    }

    async deleteFile(filePath: string) {
        return this.minioClient.removeFile(filePath);
    }

    async duplicateFile(sourceFilePath: string) {
        const destinationPath = generatePath(sourceFilePath.slice(32));
        await this.minioClient.copyFile(sourceFilePath, destinationPath);
        return { ...(await this.fileStat(destinationPath)), path: destinationPath };
    }

    async duplicateFiles(sourceFilePaths: string[]) {
        const copiedFiles = sourceFilePaths.map((path) => this.duplicateFile(path));
        const result = await Promise.all(copiedFiles);

        return result;
    }

    async deleteFiles(filePaths: string[]) {
        return this.minioClient.removeFiles(filePaths);
    }
}

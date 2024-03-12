import { Stream } from 'stream';
import { generatePath } from '../../utils/generatePath';
import { minioClient } from '../../utils/minio';

export class FilesManager {
    static uploadFile(file?: Express.Multer.File) {
        return file;
    }

    static uploadFiles(files?: Express.Multer.File[]) {
        return files;
    }

    static downloadFile(path: string) {
        return minioClient.downloadFileStream(path);
    }

    static listFiles() {
        return minioClient.getFilesList(true);
    }

    static fileStat(filePath: string) {
        return minioClient.statFile(filePath);
    }

    static deleteFile(filePath: string) {
        return minioClient.removeFile(filePath);
    }

    static async duplicateFile(sourceFilePath: string) {
        const destinationPath = generatePath(sourceFilePath.slice(32));
        await minioClient.copyFile(sourceFilePath, destinationPath);
        return { ...(await FilesManager.fileStat(destinationPath)), path: destinationPath };
    }

    static async duplicateFiles(sourceFilePaths: string[]) {
        const copiedFiles = sourceFilePaths.map((path) => FilesManager.duplicateFile(path));
        const result = await Promise.all(copiedFiles);

        return result;
    }

    static deleteFiles(filePaths: string[]) {
        return minioClient.removeFiles(filePaths);
    }

    static async getFilesData(filePaths: string[]): Promise<Buffer[]> {
        const fileStreams = await Promise.all(
            filePaths.map((filePath) => {
                return minioClient.downloadFileStream(filePath.toString());
            }),
        );
        return Promise.all(fileStreams.map(streamToBuffer));
    }
}

async function streamToBuffer(stream: Stream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

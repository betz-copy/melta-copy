import { Stream } from 'stream';
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

    async getFilesData(filePaths: string[]): Promise<Buffer[]> {
        const fileStreams = await Promise.all(
            filePaths.map((filePath) => {
                return this.minioClient.downloadFileStream(filePath.toString());
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

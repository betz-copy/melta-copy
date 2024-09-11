import { menash } from 'menashmq';
import { Stream } from 'stream';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../config';
import { getFileExtension, isFileDocument } from '../../utils/fileHelper';
import { ServiceError } from '../error';
import { generatePath } from '../../utils/generatePath';
import DefaultManagerMinio from '../../utils/minio/manager';

const {
    rabbit,
    document,
    service: { workspaceIdHeaderName },
} = config;

export class FilesManager extends DefaultManagerMinio {
    uploadFile(file?: Express.Multer.File) {
        return file;
    }

    async uploadFiles(files?: Express.Multer.File[]) {
        const documentFiles = files?.filter((file) => isFileDocument(file.path));
        if (documentFiles?.length)
            await menash.send(
                rabbit.previewQueue,
                documentFiles.map((file) => file.path),
                { headers: { [workspaceIdHeaderName]: this.workspaceId } },
            );
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
        const pdfFileName = `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        try {
            await this.minioClient.removeFile(pdfFileName);
        } catch (error) {
            throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error removing preview file', { error });
        }
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

    deleteFiles(filePaths: string[]) {
        const removalPromises = filePaths.map(async (filePath) => {
            const extension = getFileExtension(filePath);
            if (document.documentType.includes(extension)) {
                const pdfFileName = `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
                try {
                    await this.minioClient.removeFile(pdfFileName);
                } catch (error) {
                    throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error removing preview file', { error });
                }
            }
        });

        return Promise.all(removalPromises)
            .then(() => this.minioClient.removeFiles(filePaths))
            .catch((error) => {
                throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error removing files', { error });
            });
    }

    async getFilesData(filePaths: string[]): Promise<Buffer[]> {
        const fileStreams = await Promise.all(
            filePaths.map((filePath) => {
                return this.minioClient.downloadFileStream(filePath.toString());
            }),
        );
        return Promise.all(fileStreams.map((fileStream) => this.streamToBuffer(fileStream)));
    }

    private async streamToBuffer(stream: Stream): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
}

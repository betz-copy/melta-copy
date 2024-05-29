import { Stream } from 'stream';
import { menash } from 'menashmq';
import { generatePath } from '../../utils/generatePath';
import { minioClient } from '../../utils/minio';
import { config } from '../../config';
import { getFileExtension, isFileDocument } from '../../utils/fileHelper';
import logger from '../../utils/logger/logsLogger';

const { rabbit, document } = config;

export class FilesManager {
    static uploadFile(file?: Express.Multer.File) {
        return file;
    }

    static async uploadFiles(files?: Express.Multer.File[]) {
        const documentFiles = files?.filter((file) => isFileDocument(file.path));
        if (documentFiles?.length)
            await menash.send(
                rabbit.previewQueue,
                documentFiles.map((file) => file.path),
            );
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

    static async deleteFile(filePath: string) {
        const pdfFileName = `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        try {
            await minioClient.removeFile(pdfFileName);
        } catch (error) {
            logger.error('Error removing preview file:', error);
        }
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
        const removalPromises = filePaths.map(async (filePath) => {
            const extension = getFileExtension(filePath);
            if (document.documentType.includes(extension)) {
                const pdfFileName = `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
                try {
                    await minioClient.removeFile(pdfFileName);
                } catch (error) {
                    logger.error('Error removing preview file:', error);
                }
            }
        });

        return Promise.all(removalPromises)
            .then(() => minioClient.removeFiles(filePaths))
            .catch((error) => logger.error('Error removing files:', error));
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

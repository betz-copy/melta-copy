import { UploadedFile } from '@packages/entity';
import { ServiceError } from '@packages/utils';
import { menash } from 'menashmq';
import { Stream } from 'stream';
import config from '../../config';
import { getFileExtension, isFileDocument } from '../../utils/fileHelper';
import { generate32CharUUID, generatePath } from '../../utils/generatePath';
import DefaultManagerMinio from '../../utils/minio/manager';

const {
    rabbit,
    document,
    service: { workspaceIdHeaderName },
} = config;

class FilesManager extends DefaultManagerMinio {
    async makeBuckets() {
        const bucketExists = await this.minioClient.bucketExists();
        if (!bucketExists) await this.minioClient.makeBucket();
    }

    async uploadFile(file?: UploadedFile) {
        await this.makeBuckets();
        const nameWithId = `${generate32CharUUID()}${file?.originalname}`;
        const fileWithId = { ...file, originalname: nameWithId, path: nameWithId };

        await this.minioClient.uploadFileStream(fileWithId.stream!, fileWithId.originalname, fileWithId.size ?? undefined, {
            'content-type': file?.mimetype,
        });

        return fileWithId;
    }

    async uploadFiles(files?: UploadedFile[]) {
        if (!files?.length) return [];

        await this.minioClient.ensureBucket();

        const filesWithIds = files?.map((file) => {
            if (!file.stream) throw new Error(`Missing stream for file ${file.originalname}`);
            const nameWithId = this.buildNameWithId(file);
            return { ...file, originalname: nameWithId, path: nameWithId };
        });

        await Promise.allSettled(
            filesWithIds!.map((file) =>
                this.minioClient.uploadFileStream(file.stream, file.originalname!, file.size ?? undefined, { 'content-type': file.mimetype }),
            ),
        );

        const documentFiles = filesWithIds.filter((file) => isFileDocument(file.originalname));
        if (documentFiles.length > 0) {
            await menash.send(
                rabbit.previewQueue,
                documentFiles.map((file) => file.originalname),
                { headers: { [workspaceIdHeaderName]: this.workspaceId } },
            );
        }

        return filesWithIds;
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
            throw new ServiceError(undefined, 'Error removing preview file', { error });
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

    async deleteFiles(filePaths: string[]) {
        const removalPromises = filePaths.map(async (filePath) => {
            const extension = getFileExtension(filePath);
            if (document.documentType.includes(extension)) {
                const pdfFileName = `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
                try {
                    await this.minioClient.removeFile(pdfFileName);
                } catch (error) {
                    throw new ServiceError(undefined, 'Error removing preview file', { error });
                }
            }
        });

        return Promise.all(removalPromises)
            .then(() => this.minioClient.removeFiles(filePaths))
            .catch((error) => {
                throw new ServiceError(undefined, 'Error removing files', { error });
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

    private buildNameWithId(file?: UploadedFile): string {
        return `${generate32CharUUID()}${file!.originalname}`;
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

export default FilesManager;

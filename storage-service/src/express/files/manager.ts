import { minioClient } from '../../utils/minio';

export class FilesManager {
    static async uploadFile(file?: Express.Multer.File) {
        return file;
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
}

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

    static deleteFiles(filePaths: string[]) {
        return minioClient.removeFiles(filePaths);
    }
}

import FormData from 'form-data';
import fsCreateReadStream from '../utils/fs';

import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const { url, uploadFileRoute, uploadFilesRoute, deleteFileRoute, deleteFilesRoute, duplicateFilesRoute } = config.storageService;

export class StorageService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: url });
    }

    async uploadFile(file: Express.Multer.File) {
        const formData = new FormData();
        const fileStream = await fsCreateReadStream(file.path);
        formData.append('file', fileStream, file.originalname);

        const { data } = await this.api.post<{ path: string }>(uploadFileRoute, formData, {
            headers: formData.getHeaders(),
        });

        return data.path;
    }

    async uploadFiles(files: Express.Multer.File[]) {
        const formData = new FormData();

        const fileStreamsPromises = files.map((file) => fsCreateReadStream(file.path));
        const fileStreams = await Promise.all(fileStreamsPromises);

        fileStreams.forEach((fileStream, index) => {
            formData.append('files', fileStream, files[index].originalname);
        });

        const { data } = await this.api.post<{ path: string }[]>(uploadFilesRoute, formData, {
            headers: formData.getHeaders(),
        });

        return data.map(({ path }) => path);
    }

    async deleteFile(fileId: string) {
        return this.api.delete(`${deleteFileRoute}/${encodeURIComponent(fileId)}`);
    }

    async deleteFiles(paths: string[]) {
        return this.api.post(deleteFilesRoute, { paths });
    }

    async duplicateFiles(paths: string[]) {
        const { data } = await this.api.post(duplicateFilesRoute, { paths });
        return data;
    }
}

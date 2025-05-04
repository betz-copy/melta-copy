import FormData from 'form-data';
import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';
import { UploadedFile } from '@microservices/shared';

const {
    service: { docxHeaders, workspaceIdHeaderName },
    storageService: {
        url,
        uploadFileRoute,
        uploadFilesRoute,
        downloadFileRoute,
        deleteFileRoute,
        deleteFilesRoute,
        duplicateFilesRoute,
        usersGlobalBucketName,
    },
} = config;

class StorageService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url });
    }

    async uploadFile(file: UploadedFile) {
        const formData = new FormData();
        formData.append('file', file.stream, file.originalname);

        const { data } = await this.api.post<{ path: string }>(uploadFileRoute, formData, {
            headers: formData.getHeaders(),
        });

        return data.path;
    }

    async uploadFiles(files: UploadedFile[]) {
        const formData = new FormData();

        files.forEach((file) => {
            formData.append('files', file.stream, file.originalname);
        });

        const { data } = await this.api.post<{ path: string }[]>(uploadFilesRoute, formData, {
            headers: formData.getHeaders(),
        });

        return data.map(({ path }) => path);
    }

    async downloadProfileFile(path: string) {
        const { data } = await this.api.get(`${downloadFileRoute}/${encodeURIComponent(path)}`, {
            responseType: 'stream',
            headers: {
                [workspaceIdHeaderName]: usersGlobalBucketName,
            },
        });
        return data;
    }

    async downloadFile(path: string) {
        const { data } = await this.api.get<ArrayBuffer>(`${downloadFileRoute}/${encodeURIComponent(path)}`, {
            responseType: 'arraybuffer',
            ...docxHeaders,
        });

        return data;
    }

    async downloadFiles(paths: string[]) {
        const { data } = await this.api.get(`${downloadFileRoute}/zip/`, {
            params: { path: paths.join('?') },
            responseType: 'stream',
        });
        return data;
    }

    async deleteFile(fileId: string) {
        return this.api.delete(`${deleteFileRoute}/${encodeURIComponent(fileId)}`);
    }

    async deleteFiles(paths: string[]) {
        return this.api.post(deleteFilesRoute, { paths });
    }

    async duplicateFiles(paths: string[]) {
        const { data } = await this.api.post<{ path: string }[]>(duplicateFilesRoute, { paths });
        return data;
    }
}

export default StorageService;

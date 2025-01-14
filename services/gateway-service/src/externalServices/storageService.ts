import FormData from 'form-data';
import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';
import fsCreateReadStream from '../utils/fs';

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

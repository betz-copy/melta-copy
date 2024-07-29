import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import config from '../config';
import fsCreateReadStream from '../utils/fs';

const { url, uploadFileRoute, uploadFilesRoute, downloadFileRoute, deleteFileRoute, deleteFilesRoute, duplicateFilesRoute } = config.storageService;

export const uploadFile = async (file: Express.Multer.File) => {
    const formData = new FormData();
    const fileStream = await fsCreateReadStream(file.path);
    formData.append('file', fileStream, file.originalname);

    const { data } = await axios.post<{ path: string }>(`${url}/${uploadFileRoute}`, formData, {
        headers: formData.getHeaders(),
    });

    return data.path;
};

export const uploadFiles = async (files: Express.Multer.File[]) => {
    const formData = new FormData();

    const fileStreamsPromises = files.map((file) => fsCreateReadStream(file.path));
    const fileStreams = await Promise.all(fileStreamsPromises);

    fileStreams.forEach((fileStream, index) => {
        formData.append('files', fileStream, files[index].originalname);
    });

    const { data } = await axios.post<{ path: string }[]>(`${url}/${uploadFilesRoute}`, formData, {
        headers: formData.getHeaders(),
    });

    return data.map(({ path }) => path);
};

export const downloadFile = async (path: string) => {
    const { data } = await axios.get<Readable>(`${url}/${downloadFileRoute}/${path}`, {
        responseType: 'stream',
        headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
    });

    return data;
};

export const downloadFiles = async (paths: string[]) => {
    const { data } = await axios.get(`${url}/${downloadFileRoute}/zip/`, {
        params: { path: paths.join('?') },
        responseType: 'stream',
    });
    return data;
};

export const deleteFile = (fileId: string) => {
    return axios.delete(`${url}/${deleteFileRoute}/${encodeURIComponent(fileId)}`);
};

export const deleteFiles = (paths: string[]) => {
    return axios.post(`${url}/${deleteFilesRoute}`, { paths });
};

export const duplicateFiles = async (paths: string[]) => {
    const { data } = await axios.post<{ path: string }[]>(`${url}/${duplicateFilesRoute}`, { paths });
    return data;
};

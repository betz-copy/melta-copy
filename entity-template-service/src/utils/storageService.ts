import axios from 'axios';
import * as FormData from 'form-data';
import { fsCreateReadStream } from './fs';

import config from '../config';

const { uri, uploadFileRoute, deleteFileRoute } = config.storageService;

export const uploadFile = async (file: Express.Multer.File) => {
    const formData = new FormData();
    const fileStream = await fsCreateReadStream(file.path);
    formData.append('file', fileStream, file.originalname);

    return axios.post(`${uri}/${uploadFileRoute}`, formData, {
        headers: formData.getHeaders(),
    });
};

export const deleteFile = (fileId: string) => {
    return axios.delete(`${uri}/${deleteFileRoute}/${fileId}`);
};

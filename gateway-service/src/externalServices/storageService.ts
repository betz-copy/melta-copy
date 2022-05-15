import axios from 'axios';
import * as FormData from 'form-data';
import fsCreateReadStream from '../utils/fs';

import config from '../config';

const { uri, uploadFileRoute, deleteFileRoute } = config.storageService;

export const uploadFile = async (file: Express.Multer.File) => {
    const formData = new FormData();
    const fileStream = await fsCreateReadStream(file.path);
    formData.append('file', fileStream, file.originalname);

    const { data } = await axios.post<{ path: string }>(`${uri}/${uploadFileRoute}`, formData, {
        headers: formData.getHeaders(),
    });

    return data.path;
};

export const deleteFile = (fileId: string) => {
    return axios.delete(`${uri}/${deleteFileRoute}/${fileId}`);
};

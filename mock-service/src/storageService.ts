import * as fs from 'fs';
import * as path from 'path';
import config from './config';
import { trycatch } from './utils';
import { Axios } from './utils/axios';
import FormData = require('form-data');

const { url, uploadFileRoute, fileData, fileName, isAliveRoute } = config.storageService;
export const uploadFile = async () => {
    const filePath = path.join(__dirname, fileName);

    try {
        await fs.promises.writeFile(filePath, fileData);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const { data } = await Axios.post(url + uploadFileRoute, formData, {
            headers: formData.getHeaders(),
        });

        await fs.promises.unlink(filePath);
        return data.path;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in mockFileService:', error);
        throw error;
    }
};

export const isStorageServiceAlive = async () => {
    const { result, err } = await trycatch(() => Axios.get(url + isAliveRoute));

    return { result, err };
};

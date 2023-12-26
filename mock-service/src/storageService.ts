import * as fs from 'fs';
import axios from 'axios';
import * as path from 'path';
import FormData = require('form-data');
import config from './config';
import { trycatch } from './utils';

const { uri, uploadFileRoute, fileData, fileName, isAliveRoute } = config.storageService;
export const uploadFile = async () => {
    const filePath = path.join(__dirname, fileName);

    try {
        await fs.promises.writeFile(filePath, fileData);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const { data } = await axios.post(uri + uploadFileRoute, formData, {
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
    const { result, err } = await trycatch(() => axios.get(uri + isAliveRoute));

    return { result, err };
};

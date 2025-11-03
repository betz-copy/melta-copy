import * as fs from 'node:fs';
import * as path from 'path';

import FormData = require('form-data'); // TODO: yona - Check if could replace with es6 import

import axios from 'axios';
import config from './config';
import { trycatch } from './utils';
import createAxiosInstance from './utils/axios';

const { url, uploadFileRoute, fileData, fileName, isAliveRoute } = config.storageService;
export const uploadFile = async (workspaceId: string) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const filePath = path.join(__dirname, fileName);

    try {
        await fs.promises.writeFile(filePath, fileData);

        const formData = new FormData();
        formData.append('files', fs.createReadStream(filePath));

        const { data } = await axiosInstance.post(url + uploadFileRoute, formData, {
            headers: formData.getHeaders(),
        });

        await fs.promises.unlink(filePath);
        return data.map(({ path: resultPath }) => resultPath)[0];
    } catch (error) {
        console.error('Error in mockFileService:', error);
        throw error;
    }
};

export const isStorageServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

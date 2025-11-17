import axios from 'axios';
import config from '../config';
import { tryCatch } from '../utils';

const { url, isAliveRoute } = config.templateService;

export const isTemplateServiceAlive = async () => {
    const { result, err } = await tryCatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

/* eslint-disable import/prefer-default-export */
import axios from 'axios';
import config from '../config';
import { trycatch } from '../utils';

const { url, isAliveRoute } = config.templateService;

export const isTemplateServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

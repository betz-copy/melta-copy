/* eslint-disable import/prefer-default-export */
import axios from 'axios';
import { trycatch } from '../utils';
import config from '../config';

const { url, isAliveRoute } = config.templateService;

export const isTemplateServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

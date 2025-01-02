import axios from 'axios';
import { logger } from '@microservices/shared';
import config from '../config';

const {
    modelApi: { url, searchRoute, endpoint },
} = config;

class ModelApiService {
    static api = axios.create({ baseURL: url });

    static async embed(texts: string[]): Promise<number[][]> {
        try {
            const { data } = await ModelApiService.api.post<number[][]>(searchRoute, {
                endpoint,
                inputs: texts,
            });

            return data;
        } catch (error) {
            logger.error('Error in ModelApiService.search', { error });
            return [[]];
        }
    }
}

export default ModelApiService;

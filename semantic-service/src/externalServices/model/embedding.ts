import { logger } from '@microservices/shared';
import axios from 'axios';
import config from '../../config';

const {
    modelApi: {
        embedding: { baseUrl, embeddingRoute, requestTimeout },
    },
} = config;

class ModelEmbeddingApiService {
    static api = axios.create({ baseURL: baseUrl, timeout: requestTimeout });

    static async embed(texts: string[]): Promise<number[][]> {
        try {
            const { data } = await ModelEmbeddingApiService.api.post<number[][]>(embeddingRoute, {
                inputs: texts,
                endpoint: 'embed',
            });

            return data;
        } catch (e) {
            logger.error('Error in ModelApiService.search', e);
            return texts.map((): number[] => []);
        }
    }
}

export default ModelEmbeddingApiService;

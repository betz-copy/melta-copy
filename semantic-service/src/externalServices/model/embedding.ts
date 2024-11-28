import axios from 'axios';
import config from '../../config';

const {
    modelApi: {
        embedding: { baseUrl, embeddingRoute, requestTimeout },
    },
} = config;

export class ModelEmbeddingApiService {
    static api = axios.create({ baseURL: baseUrl, timeout: requestTimeout });

    static async embed(texts: string[]): Promise<number[][]> {
        try {
            const { data } = await ModelEmbeddingApiService.api.post<number[][]>(embeddingRoute, {
                inputs: texts,
            });

            return data;
        } catch (e) {
            console.log('Error in ModelApiService.search', e);
            return [[]];
        }
    }
}

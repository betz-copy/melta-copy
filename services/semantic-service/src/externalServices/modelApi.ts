import axios from 'axios';
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
        } catch (e) {
            console.log('Error in ModelApiService.search', e);
            return [[]];
        }
    }
}

export default ModelApiService;

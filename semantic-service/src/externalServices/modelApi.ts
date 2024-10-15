import DefaultExternalServiceApi from '../utils/express/externalService';
import config from '../config';

const {
    modelApi: { url, searchRoute, endpoint },
} = config;

export class ModelApiService extends DefaultExternalServiceApi {
    constructor() {
        super({ baseURL: url });
    }

    async search(texts: string[]): Promise<number[][]> {
        try {
            const { data } = await this.api.post<number[][]>(searchRoute, {
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

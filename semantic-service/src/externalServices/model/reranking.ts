import axios from 'axios';
import config from '../../config';
import { IRerankRequest, IRerankResult } from '../../express/semantics/interface';

const {
    modelApi: {
        rerank: { baseUrl, rerankRoute, requestTimeout },
    },
} = config;

export class ModelRerankingApiService {
    static api = axios.create({ baseURL: baseUrl, timeout: requestTimeout });

    static async rerank(body: IRerankRequest): Promise<IRerankResult[] | undefined> {
        try {
            const { data } = await ModelRerankingApiService.api.post<IRerankResult[]>(rerankRoute, { ...body, truncate: true, return_text: true });

            return data;
        } catch (e) {
            console.log('Error in ModelApiService.search', e);
            return undefined;
        }
    }
}

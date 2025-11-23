import { IRerankRequest, IRerankResult, logger } from '@microservices/shared';
import axios from 'axios';
import config from '../../config';

const {
    modelApi: {
        rerank: { baseUrl, rerankRoute, requestTimeout },
    },
} = config;

class ModelRerankingApiService {
    static api = axios.create({ baseURL: baseUrl, timeout: requestTimeout });

    static async rerank(body: IRerankRequest): Promise<IRerankResult[] | undefined> {
        try {
            const { data } = await ModelRerankingApiService.api.post<IRerankResult[]>(rerankRoute, {
                ...body,
                endpoint: 'rerank',
                truncate: true,
                return_text: true,
            });

            return data;
        } catch (e) {
            logger.error('Error in ModelApiService.search', e);
            return undefined;
        }
    }
}

export default ModelRerankingApiService;

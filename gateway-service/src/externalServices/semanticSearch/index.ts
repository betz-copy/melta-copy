import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import logger from '../../utils/logger/logsLogger';
import { ISearchBatchBody } from '../instanceService/interfaces/entities';
import { IRerankRequest, IRerankResult, ISemanticSearchResult } from './interface';

const {
    semanticSearchService: { url, searchRoute, requestTimeout, baseRoute, rerankRoute },
} = config;

export class SemanticSearchService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    async search(searchBody: Omit<ISearchBatchBody, 'templates'> & { templates: string[] }) {
        try {
            const { data } = await this.api.post<ISemanticSearchResult>(searchRoute, searchBody);
            return data;
        } catch (e) {
            console.dir(`Search error: ${e}`, { depth: null });
            logger.error(e);
            return {};
        }
    }

    async rerank(rerankBody: IRerankRequest) {
        try {
            const { data } = await this.api.post<IRerankResult[]>(rerankRoute, rerankBody);
            return data;
        } catch (e) {
            console.dir(`Rerank error: ${e}`, { depth: null });
            logger.error(e);
            return [];
        }
    }
}

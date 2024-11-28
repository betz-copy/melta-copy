import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { ISearchBatchBody } from '../instanceService/interfaces/entities';
import { IRerankRequest, ISemanticSearchResult } from './interface';

const {
    semanticSearchService: { url, searchRoute, requestTimeout },
} = config;

export class SemanticSearchService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    async search(searchBody: Omit<ISearchBatchBody, 'templates'> & { templates: string[] }) {
        try {
            const { data } = await this.api.post<ISemanticSearchResult>(searchRoute, searchBody);
            return data;
        } catch (e) {
            console.log(e);
            return {};
        }
    }

    async rerank(rerankBody: IRerankRequest) {
        try {
            const { data } = await this.api.post<number[]>(searchRoute, rerankBody);
            return data;
        } catch (e) {
            console.log(e);
            return [];
        }
    }
}

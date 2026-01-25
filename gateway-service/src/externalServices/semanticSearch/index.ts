import { ISearchBatchBody, ISearchSort } from '@packages/entity';
import { IRerankRequest, IRerankResult, ISemanticSearchResult } from '@packages/semantic-search';
import { logger } from '@packages/utils';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const { url, searchRoute, requestTimeout, baseRoute, rerankRoute } = config.semanticSearchService;

export type ISemanticSearchBatchBody = Omit<ISearchBatchBody, 'templates' | 'sort' | 'skip' | 'limit'> & {
    templates: string[];
    sort?: ISearchSort;
    skip?: number;
    limit?: number;
};

export class SemanticSearchService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    async search(searchBody: ISemanticSearchBatchBody) {
        try {
            const { data } = await this.api.post<ISemanticSearchResult>(searchRoute, searchBody);
            return data;
        } catch (error) {
            logger.error("Error in SemanticSearchService's search", { error });
            return {};
        }
    }

    async rerank(rerankBody: IRerankRequest) {
        try {
            const { data } = await this.api.post<IRerankResult[]>(rerankRoute, rerankBody);
            return data;
        } catch (error) {
            logger.error('Rerank error: ', { error });
            return [];
        }
    }
}

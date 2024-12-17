import { ISearchBatchBody, ISearchSort, ISemanticSearchResult } from '@microservices/shared';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    semanticSearchService: { url, searchRoute },
} = config;

export type ISemanticSearchBatchBody = Omit<ISearchBatchBody, 'templates' | 'sort' | 'skip' | 'limit'> & {
    templates: string[];
    sort?: ISearchSort;
    skip?: number;
    limit?: number;
};

export class SemanticSearchService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url });
    }

    async search(searchBody: ISemanticSearchBatchBody) {
        try {
            const { data } = await this.api.post<ISemanticSearchResult>(searchRoute, searchBody);
            return data;
        } catch (e) {
            console.log(e);
            return {};
        }
    }
}

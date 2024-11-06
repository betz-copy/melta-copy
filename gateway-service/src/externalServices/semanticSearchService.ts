import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';
import { ISearchBatchBody } from './instanceService/interfaces/entities';

const {
    semanticSearchService: { url, searchRoute },
} = config;

export class SemanticSearchService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url });
    }

    async search(searchBody: Omit<ISearchBatchBody, 'templates'> & { templates: string[]; }): Promise<string[]> {
        try {
            const { data } = await this.api.post<string[]>(searchRoute, searchBody);

            return data;
        } catch (e) {
            console.log(e);
            return [];
        }
    }
}

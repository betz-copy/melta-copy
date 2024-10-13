import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';
import { IEntityWithDirectRelationships, ISearchBatchBody } from './instanceService/interfaces/entities';

const {
    semanticSearchService: { url, searchRoute },
} = config;

interface SingleResult {
    text: string;
    title: string;
    workspace_id: string;
    template_id: string;
    entity_id: string;
    minio_file_id: string;
}

export interface SemanticSearchResult {
    results: SingleResult[];
    count: number;
}

export class SemanticSearchService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url });
    }

    combineResults(elasticResults: Record<string, (IEntityWithDirectRelationships | SingleResult)[]>, rrfRankConstant = 60): any[] {
        const results = {};

        Object.values(elasticResults).forEach((resultKind) => {
            resultKind.forEach((document, index) => {
                const docId = (document as SingleResult)?.entity_id ?? (document as IEntityWithDirectRelationships)!.entity!.properties!._id;

                if (!results[docId]) {
                    results[docId] = { rrf_score: 0, ...document };
                }

                results[docId].rrf_score! += 1 / (index + rrfRankConstant);
            });
        });

        return Object.values(results).sort((a: any, b: any) => b.rrf_score! - a.rrf_score!);
    }

    async search(searchBody: Omit<ISearchBatchBody, 'templates' | 'textSearch'> & { templates: string[]; search_text?: string }) {
        try {
            const { data } = await this.api.post<SemanticSearchResult>(searchRoute, searchBody);

            return data;
        } catch (e) {
            console.log(e);
            return { count: 0, results: [] };
        }
    }
}

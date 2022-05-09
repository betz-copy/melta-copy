import axios from 'axios';
import config from '../config';

const {
    relationshipTemplateManager: { uri, baseRoute, requestTimeout },
} = config;

export interface IRelationshipTemplate {
    _id: string;
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface ISearchRelationshipTemplatesBody {
    search?: string;
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
    limit?: number;
    skip?: number;
}

export class RelationshipsTemplateManagerService {
    private static RelationshipsTemplateManagerApi = axios.create({ baseURL: `${uri}${baseRoute}`, timeout: requestTimeout });

    static async searchRelationshipTemplates(searchBody: ISearchRelationshipTemplatesBody = {}) {
        const { data } = await this.RelationshipsTemplateManagerApi.post<IRelationshipTemplate[]>('/search', searchBody);

        return data;
    }

    static async getRelationshipTemplateById(id: string) {
        const { data } = await this.RelationshipsTemplateManagerApi.get<IRelationshipTemplate>(`/${id}`);

        return data;
    }

    static async createRelationshipTemplate(relationship: Omit<IRelationshipTemplate, '_id'>) {
        const { data } = await this.RelationshipsTemplateManagerApi.post<IRelationshipTemplate>('/', relationship);

        return data;
    }

    static async updateRelationshipTemplate(id: string, updatedRelationship: Partial<Omit<IRelationshipTemplate, '_id'>>) {
        const { data } = await this.RelationshipsTemplateManagerApi.put<IRelationshipTemplate>(`/${id}`, updatedRelationship);

        return data;
    }

    static async deleteRelationshipTemplate(id: string) {
        const { data } = await this.RelationshipsTemplateManagerApi.delete<IRelationshipTemplate>(`/${id}`);

        return data;
    }
}

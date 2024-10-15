import DefaultManagerElastic from '../../utils/elastic/manager';
import { IDeleteFilesRequest, IIndexFilesRequest } from './interface';

export class SemanticManager extends DefaultManagerElastic {
    public async search(limit: number, step: number, query: any) {
        return await this.elasticClient.search(limit, step, query);
    }

    public async createIndex() {
        return await this.elasticClient.createIndex();
    }

    public async deleteIndex() {
        return await this.elasticClient.deleteIndex();
    }

    public async initIndex() {
        return await this.elasticClient.initIndex();
    }

    public async indexFiles({ workspaceId, minioFileIds, templateId, entityId }: IIndexFilesRequest) {
        return await this.elasticClient.indexFiles();
    }

    public async deleteFiles({ workspaceId, minioFileIds }: IDeleteFilesRequest) {
        return await this.elasticClient.indexFile(file);
    }
}

export default SemanticManager;

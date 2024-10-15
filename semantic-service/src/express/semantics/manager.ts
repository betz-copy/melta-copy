import ElasticClient from '../../utils/elastic';
import { streamToBuffer } from '../../utils/fs';
import { MinIOClient } from '../../utils/minio/minioClient';
import { IDeleteFilesRequest, IIndexFilesRequest } from './interface';

export class SemanticManager {
    workspaceId: string;

    elasticClient: ElasticClient;

    minioClient: MinIOClient;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.elasticClient = new ElasticClient(workspaceId);
        this.minioClient = new MinIOClient(workspaceId);
    }

    public async search(limit: number, step: number, query: any) {
        return await this.elasticClient.search(limit, step, query);
    }

    public async createIndex(indexName: string) {
        return this.elasticClient.index(indexName);
    }

    public async deleteIndex() {
        return await this.elasticClient.deleteIndex();
    }

    public async initIndex() {
        return await this.elasticClient.initIndex();
    }

    public async indexFiles({ workspaceId, minioFileIds, templateId, entityId }: IIndexFilesRequest) {
        const fileStream = await this.minioClient.downloadFileStream(workspaceId);
        const fileBuffer = await streamToBuffer(fileStream);
        await Promise.allSettled(minioFileIds.map((minioFile: string) => {}));
    }

    public async deleteFiles({ workspaceId, minioFileIds }: IDeleteFilesRequest) {
        return await this.elasticClient.indexFile(file);
    }
}

export default SemanticManager;

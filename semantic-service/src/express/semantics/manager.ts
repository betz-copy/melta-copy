import { ModelApiService } from '../../externalServices/modelApi';
import ElasticClient from '../../utils/elastic';
import { streamToBuffer } from '../../utils/fs';
import { MinIOClient } from '../../utils/minio/minioClient';
import { IDeleteFilesRequest, IIndexFilesRequest, ISearchRequest } from './interface';

export class SemanticManager {
    workspaceId: string;

    elasticClient: ElasticClient;

    minioClient: MinIOClient;

    modelApiService: ModelApiService;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.elasticClient = new ElasticClient(workspaceId);
        this.minioClient = new MinIOClient(workspaceId);
        this.modelApiService = new ModelApiService();
    }

    public async search(searchBody: ISearchRequest) {
        const embeddedQuery = await this.modelApiService.search([searchBody.search_text]);

        return this.elasticClient.hybridSearch(searchBody.search_text, embeddedQuery[0], searchBody.limit, searchBody.skip, searchBody.templates);
    }

    public async createIndex(indexName: string) {
        return this.elasticClient.index(indexName);
    }

    public async deleteIndex() {
        return this.elasticClient.deleteIndex();
    }

    public async initIndex() {
        return this.elasticClient.initIndex();
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

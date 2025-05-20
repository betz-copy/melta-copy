import { logger, IRerankRequest } from '@microservices/shared';
import config from '../../config';
import ElasticClient from '../../utils/elastic';
import { splitTextIntoChunks } from '../../utils/fs';
import MinIOClient from '../../utils/minio/minioClient';
import { IIndexFilesRequest, ISearchRequest } from './interface';
import ModelEmbeddingApiService from '../../externalServices/model/embedding';
import ModelRerankingApiService from '../../externalServices/model/reranking';

const {
    consts: { fileIdLength },
    minio: { useDevBucket, devBucketPrefix },
} = config;

export class SemanticManager {
    workspaceId: string;

    elasticClient: ElasticClient;

    minioClient: MinIOClient;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.elasticClient = new ElasticClient(workspaceId);

        const fixedBucketName = `${useDevBucket ? devBucketPrefix : ''}${workspaceId}`;
        this.minioClient = new MinIOClient(fixedBucketName);
    }

    public async search(searchBody: ISearchRequest) {
        const embeddedQuery = await ModelEmbeddingApiService.embed([searchBody.textSearch]);

        return this.elasticClient.hybridSearch(searchBody.textSearch, embeddedQuery[0], searchBody.limit, searchBody.skip, searchBody.templates);
    }

    public async rerank(searchBody: IRerankRequest) {
        return ModelRerankingApiService.rerank(searchBody);
    }

    public createIndex() {
        return this.elasticClient.createIndex();
    }

    public deleteIndex() {
        return this.elasticClient.deleteIndex();
    }

    private async indexFile({ minioFileId, templateId, entityId }: Omit<IIndexFilesRequest, 'minioFileIds'> & { minioFileId: string }) {
        const content = await this.minioClient.readFile(minioFileId);

        if (!content) {
            logger.error(`Content is None for minioFileId: ${minioFileId}`);
            return;
        }

        const title = minioFileId.length > fileIdLength ? minioFileId.slice(fileIdLength) : minioFileId;

        const chunks = await splitTextIntoChunks(content, title, templateId, entityId, minioFileId, this.workspaceId);

        await this.elasticClient.bulkIndexDocuments(chunks);
    }

    public async indexFiles(fileData: IIndexFilesRequest) {
        await Promise.allSettled(fileData.minioFileIds.map((minioFileId: string) => this.indexFile({ ...fileData, minioFileId })));
    }

    public deleteFiles(minioFileIds: string[]) {
        return this.elasticClient.deleteFiles(minioFileIds);
    }
}

export default SemanticManager;

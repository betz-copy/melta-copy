import config from '../../config';
import { ModelApiService } from '../../externalServices/modelApi';
import ElasticClient from '../../utils/elastic';
import { splitTextIntoChunks } from '../../utils/fs';
import logger from '../../utils/logger/logsLogger';
import { MinIOClient } from '../../utils/minio/minioClient';
import { IIndexFilesRequest, ISearchRequest } from './interface';

const {
    consts: { fileIdLength },
} = config;

export class SemanticManager {
    workspaceId: string;

    elasticClient: ElasticClient;

    minioClient: MinIOClient;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.elasticClient = new ElasticClient(workspaceId);
        this.minioClient = new MinIOClient(workspaceId);
    }

    public async search(searchBody: ISearchRequest) {
        const embeddedQuery = await ModelApiService.embed([searchBody.search_text]);

        return this.elasticClient.hybridSearch(searchBody.search_text, embeddedQuery[0], searchBody.limit, searchBody.skip, searchBody.templates);
    }

    public createIndex() {
        return this.elasticClient.createIndex();
    }

    public deleteIndex() {
        return this.elasticClient.deleteIndex();
    }

    private async indexFile({
        minioFileId,
        template_id: templateId,
        entity_id: entityId,
    }: Omit<IIndexFilesRequest, 'minioFileIds'> & { minioFileId: string }) {
        const content = await this.minioClient.readFile(minioFileId);

        if (!content) {
            logger.error(`Content is None for minio_file_id: ${minioFileId}`);
            return;
        }

        const title = minioFileId.length > fileIdLength ? minioFileId.slice(fileIdLength) : minioFileId;

        const chunks = await splitTextIntoChunks(content, title, templateId, entityId, minioFileId, this.workspaceId);

        await this.elasticClient.bulkIndexDocuments(chunks);
    }

    public async indexFiles(fileData: IIndexFilesRequest) {
        await Promise.allSettled(fileData.minio_file_ids.map((minioFileId: string) => this.indexFile({ ...fileData, minioFileId })));
    }

    public deleteFiles(minioFileIds: string[]) {
        return this.elasticClient.deleteFiles(minioFileIds);
    }
}

export default SemanticManager;

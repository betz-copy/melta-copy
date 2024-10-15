import { ModelApiService } from '../../externalServices/modelApi';
import config from '../../config';
import ElasticClient from '../../utils/elastic';
import { splitTextIntoChunks, streamToString } from '../../utils/fs';
import logger from '../../utils/logger/logsLogger';
import { MinIOClient } from '../../utils/minio/minioClient';
import { IDeleteFilesRequest, IIndexFilesRequest } from './interface';

const {
    consts: { fileIdLength },
} = config;
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

    public async search(limit: number, step: number, query: any) {
        const embeddedQuery = await this.modelApiService.search([query.text]);
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

    private async indexFile({ workspaceId, minioFileId, templateId, entityId }: Omit<IIndexFilesRequest, 'minioFileIds'> & { minioFileId: string }) {
        const content = await this.minioClient.readFile(minioFileId);

        if (!content) {
            logger.error(`Content is None for minio_file_id: ${minioFileId}`);
            return;
        }

        const title = minioFileId.length > fileIdLength ? minioFileId.slice(fileIdLength) : minioFileId;
        const chunks = splitTextIntoChunks(content, title, templateId, entityId, minioFileId, workspaceId);
        await es.bulk_insert_documents(chunks, workspace_id);
    }

    public async indexFiles(fileData: IIndexFilesRequest) {
        await Promise.allSettled(fileData.minioFileIds.map((minioFileId: string) => this.indexFile({ ...fileData, minioFileId })));
    }

    public async deleteFiles({ workspaceId, minioFileIds }: IDeleteFilesRequest) {
        return await this.elasticClient.indexFile(file);
    }
}

export default SemanticManager;

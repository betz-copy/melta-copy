export interface IIndexFilesRequest {
    minioFileIds: string[];
    templateId: string;
    entityId: string;
}

export interface ISearchRequest {
    textSearch: string;
    limit: number;
    skip: number;
    templates: string[];
}

export interface IElasticDoc extends Omit<IIndexFilesRequest, 'minioFileIds'> {
    text: string;
    embedding: number[];
    title: string;
    minioFileId: string;
    workspaceId: string;
    chunkIndex: number;
}

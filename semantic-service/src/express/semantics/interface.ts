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

// { [templateId]: { [entityId]: { minioFileId: string, text: string }[] } }
export type ISemanticSearchResult = Record<string, Record<string, { minioFileId: string; text: string }[]>>;

export interface IRerankResult {
    index: number;
    text: string;
    score: number;
}

export interface IRerankRequest {
    query: string;
    texts: string[];
}

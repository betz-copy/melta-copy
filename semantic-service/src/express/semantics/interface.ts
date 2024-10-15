export interface IIndexFilesRequest {
    workspace_id: string;
    minio_file_ids: string[];
    template_id: string;
    entity_id: string;
}

export interface IDeleteFilesRequest {
    workspaceId: string;
    minioFileIds: string[];
}

export interface ISearchRequest {
    // TODO: convert to js naming format
    search_text: string;
    limit: number;
    skip: number;
    templates: string[];
}

export interface Chunk extends Omit<IIndexFilesRequest, 'minio_file_ids'> {
    text: string;
    embedding: number[];
    title: string;
    minio_file_id: string;
}

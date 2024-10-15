export interface IIndexFilesRequest {
    workspaceId: string;
    minioFileIds: string[];
    templateId: string;
    entityId: string;
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

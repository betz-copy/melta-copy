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

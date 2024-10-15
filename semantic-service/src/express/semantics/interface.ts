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

export interface Chunk extends Omit<IIndexFilesRequest, 'minioFileIds'> {
    text: string;
    // embedding: number[];
    title: string;
    minioFileId: string;
}

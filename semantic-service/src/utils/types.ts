export interface IEvaluationResult {
    grades: {
        accuracy: number;
        completeness: number;
        clarity: number;
    };
    critique: string;
    hallucinations: string[];
    missingInfo: string;
}

export interface IValidationResult {
    isValid: boolean;
    detectedIssues: string;
}

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

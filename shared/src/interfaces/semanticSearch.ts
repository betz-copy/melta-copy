// { [templateId]: { [entityId]: { minioFileId: string, text: string }[] } }
export type ISemanticSearchResult = Record<string, Record<string, { minioFileId: string; text: string }[]>>;

export interface IRerankRequest {
    query: string;
    texts: string[];
}

export interface IRerankResult {
    index: number;
    text: string;
    score: number;
}

export enum FileTypes {
    PDF = 'pdf',
    TXT = 'txt',
    DOC = 'doc',
    DOCX = 'docx',
    XLSX = 'xlsx',
    CSV = 'csv',
    PPTX = 'pptx',
}

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

export enum FileMimeType {
    DOC = 'application/msword',
    PDF = 'application/pdf',
    DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    TXT = 'text/plain',
    XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    CSV = 'text/csv',
}

export const FILE_EXTENSION_TO_MIME_TYPE: Record<FileTypes, FileMimeType> = {
    [FileTypes.DOC]: FileMimeType.DOC,
    [FileTypes.PDF]: FileMimeType.PDF,
    [FileTypes.DOCX]: FileMimeType.DOCX,
    [FileTypes.PPTX]: FileMimeType.PPTX,
    [FileTypes.TXT]: FileMimeType.TXT,
    [FileTypes.XLSX]: FileMimeType.XLSX,
    [FileTypes.CSV]: FileMimeType.CSV,
};

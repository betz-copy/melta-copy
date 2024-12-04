// { [templateId]: { [entityId]: { minioFileId: string, text: string }[] } }
export type ISemanticSearchResult = Record<string, Record<string, { minioFileId: string; text: string }[]>>;

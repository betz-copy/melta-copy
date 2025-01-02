export type FunctionKey<T extends Object, F = Function> = { [K in keyof T]: T[K] extends F ? K : never }[keyof T];

export enum FileTypes {
    PDF = 'pdf',
    TXT = 'txt',
    DOC = 'doc',
    DOCX = 'docx',
    XLSX = 'xlsx',
    CSV = 'csv',
    PPTX = 'pptx',
}

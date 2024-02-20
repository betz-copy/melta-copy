export enum FileExtensions {
    pdf = 'pdf',
    png = 'png',
}

export interface IFile {
    id: string;
    name: string;
    contentType: 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'unsupported';
    targetExtension: FileExtensions;
}

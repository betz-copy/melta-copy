import { environment } from '../globals';
import { IFile } from '../interfaces/preview';
import { getFileName } from './getFileName';

export const getFileExtension = (name: string) => {
    return name.match(/\.([^.]*)$/)?.pop() || '';
};

export const getFileNameWithoutExtension = (name: string) => {
    const lastDotIndex = name.lastIndexOf('.');
    const fileNameWithoutExtension = lastDotIndex !== -1 ? name.slice(0, lastDotIndex) : name;

    return fileNameWithoutExtension.trim();
};

export const getPreviewContentType = (name: string) => {
    const { video, audio, image, document } = environment.fileExtensions;
    const extension = getFileExtension(name).toLowerCase();

    if (extension === 'pdf') return 'pdf';
    if ((video as unknown as string[]).includes(extension)) return 'video';
    if ((audio as unknown as string[]).includes(extension)) return 'audio';
    if ((image as unknown as string[]).includes(extension)) return 'image';
    if ((document as unknown as string[]).includes(extension)) return 'document';
    return 'unsupported';
};

export const getFile = (id: string) => {
    const name = getFileName(id);
    return {
        id,
        name,
        contentType: getPreviewContentType(name),
        targetExtension: getFileExtension(name),
    } as IFile;
};

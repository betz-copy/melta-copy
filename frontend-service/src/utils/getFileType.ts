import { environment } from '../globals';

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
